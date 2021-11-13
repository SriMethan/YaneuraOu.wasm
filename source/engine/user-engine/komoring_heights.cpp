﻿#if !defined(USER_ENGINE)
#define USER_ENGINE
#endif

#include "komoring_heights.hpp"

#include <algorithm>

#include "../../mate/mate.h"
#include "move_picker.hpp"
#include "node_history.hpp"
#include "node_travels.hpp"
#include "proof_hand.hpp"

namespace {
constexpr std::size_t kDefaultHashSizeMb = 1024;

/// FirstSearch の初期深さ。数値実験してみた感じたと、1 ではあまり効果がなく、3 だと逆に遅くなるので
/// 2 ぐらいがちょうどよい
constexpr Depth kFirstSearchOrDepth = 1;
constexpr Depth kFirstSearchAndDepth = 2;

}  // namespace

namespace komori {
void KomoringHeights::Init() {
  Resize(kDefaultHashSizeMb);
  selector_cache_.Resize(max_depth_ + 1);
}

void KomoringHeights::Resize(std::uint64_t size_mb) {
  tt_.Resize(size_mb);
}

bool KomoringHeights::Search(Position& n, std::atomic_bool& stop_flag) {
  tt_.NewSearch();
  searched_node_ = 0;
  searched_depth_ = 0;
  stop_ = &stop_flag;
  start_time_ = std::chrono::system_clock::now();

  auto query = tt_.GetQuery<true>(n, 0, 0);
  auto* entry = query.LookUpWithCreation();
  NodeHistory node_history{};
  SearchImpl<true>(n, kInfinitePnDn, kInfinitePnDn, 0, node_history, query, entry, false);

  entry = query.RefreshWithoutCreation(entry);

  // <for-debug>
  sync_cout << "info string pn=" << entry->Pn() << " dn=" << entry->Dn() << " num_searched=" << searched_node_
            << " node_state=" << entry->GetNodeState() << " generation=" << entry->GetGeneration() << sync_endl;
  // </for-debug>

  stop_ = nullptr;
  return entry->GetNodeState() == NodeState::kProvenState;
}

std::vector<Move> KomoringHeights::BestMoves(Position& n) {
  std::unordered_map<Key, Move> memo;

  auto res = node_travels_.MateMovesSearch<true>(memo, n, 0, 0);

  std::vector<Move> result;
  Depth depth = 0;
  // 探索メモをたどって詰手順を復元する
  while (memo.find(n.key()) != memo.end()) {
    auto move = memo[n.key()];
    result.push_back(move);
    n.do_move(move, st_info_[depth++]);

    if (result.size() >= kMaxNumMateMoves) {
      break;
    }
  }

  // 動かした n をもとの n の状態に戻す
  for (auto itr = result.crbegin(); itr != result.crend(); ++itr) {
    n.undo_move(*itr);
  }

  return result;
}

std::string KomoringHeights::Info(int depth) const {
  auto curr_time = std::chrono::system_clock::now();
  auto time_ms = std::chrono::duration_cast<std::chrono::milliseconds>(curr_time - start_time_).count();
  time_ms = std::max(time_ms, decltype(time_ms){1});
  auto nps = searched_node_ * 1000ULL / time_ms;

  std::ostringstream oss;
  oss << "depth " << depth << " seldepth " << searched_depth_ << " time " << time_ms << " nodes " << searched_node_
      << " nps " << nps << " hashfull " << tt_.Hashfull();
  return oss.str();
}

void KomoringHeights::PrintDebugInfo() const {
  auto stat = tt_.GetStat();
  sync_cout << "info string hashfull=" << stat.hashfull << " proven=" << stat.proven_ratio
            << " disproven=" << stat.disproven_ratio << " repetition=" << stat.repetition_ratio
            << " maybe_repetition=" << stat.maybe_repetition_ratio << " other=" << stat.other_ratio << sync_endl;
}

template <bool kOrNode>
void KomoringHeights::SearchImpl(Position& n,
                                 PnDn thpn,
                                 PnDn thdn,
                                 Depth depth,
                                 NodeHistory& node_history,
                                 const LookUpQuery& query,
                                 CommonEntry* entry,
                                 bool inc_flag) {
  // 探索深さ上限 or 千日手 のときは探索を打ち切る
  auto node_state = node_history.State(n.state()->board_key(), query.GetHand());
  if (depth >= max_depth_ || node_state == NodeHistory::NodeState::kRepetition ||
      node_state == NodeHistory::NodeState::kInferior) {
    query.SetRepetition(searched_node_);
    return;
  }

  searched_depth_ = std::max(searched_depth_, depth);
  if (print_flag_) {
    PrintProgress(n, depth);
    print_flag_ = false;
  }

  // 初探索の時は n 手詰めルーチンを走らせる
  if (entry->IsFirstVisit()) {
    auto remain_depth = kOrNode ? kFirstSearchOrDepth : kFirstSearchAndDepth;
    remain_depth = std::min(remain_depth, max_depth_ - depth);
    auto res_entry = node_travels_.LeafSearch<kOrNode>(searched_node_, n, depth, remain_depth, query);
    if (res_entry->GetNodeState() == NodeState::kProvenState ||
        res_entry->GetNodeState() == NodeState::kDisprovenState) {
      return;
    }
    inc_flag = false;
  }

  node_history.Visit(n.state()->board_key(), query.GetHand());
  // スタックの消費を抑えめために、ローカル変数で確保する代わりにメンバで動的確保した領域を探索に用いる
  MoveSelector<kOrNode>* selector = &selector_cache_.EmplaceBack<kOrNode>(n, tt_, node_history, depth, query.PathKey());

  if (selector->DoesHaveOldChild()) {
    inc_flag = true;
  }

  if (inc_flag) {
    thpn = std::max(thpn, selector->Pn() + 1);
    thpn = std::min(thpn, kInfinitePnDn);
    thdn = std::max(thdn, selector->Dn() + 1);
    thdn = std::min(thdn, kInfinitePnDn);
  }

  // これ以降で return する場合、node_history の復帰と selector の返却を行う必要がある。
  // これらの処理は、SEARCH_IMPL_RETURN ラベル以降で行っている。

  while (searched_node_ < max_search_node_ && !*stop_) {
    if (selector->Pn() == 0) {
      query.SetProven(selector->ProofHand(), searched_node_);
      goto SEARCH_IMPL_RETURN;
    } else if (selector->Dn() == 0) {
      if (selector->IsRepetitionDisproven()) {
        // 千日手のため負け
        query.SetRepetition(searched_node_);
      } else {
        // 普通に詰まない
        query.SetDisproven(selector->DisproofHand(), searched_node_);
      }
      goto SEARCH_IMPL_RETURN;
    }

    entry->UpdatePnDn(selector->Pn(), selector->Dn(), searched_node_);
    if (entry->Pn() >= thpn || entry->Dn() >= thdn) {
      goto SEARCH_IMPL_RETURN;
    }

    if (selector->DoesHaveOldChild()) {
      inc_flag = true;
    }

    ++searched_node_;

    auto [child_thpn, child_thdn] = selector->ChildThreshold(thpn, thdn);
    auto best_move = selector->FrontMove();

    n.do_move(best_move, st_info_[depth]);
    SearchImpl<!kOrNode>(n, child_thpn, child_thdn, depth + 1, node_history, selector->FrontLookUpQuery(),
                         selector->FrontEntry(), inc_flag);
    n.undo_move(best_move);

    // GC の影響で entry の位置が変わっている場合があるのでループの最後で再取得する
    entry = query.RefreshWithCreation(entry);
    selector->Update();
  }

SEARCH_IMPL_RETURN:
  // node_history の復帰と selector の返却を行う必要がある
  selector_cache_.PopBack<kOrNode>();
  node_history.Leave(n.state()->board_key(), query.GetHand());
}

void KomoringHeights::PrintProgress(const Position& n, Depth depth) const {
  sync_cout << "info " << Info(depth) << "score cp 0 "
#if defined(KEEP_LAST_MOVE)
            << " pv " << n.moves_from_start()
#endif
            << sync_endl;
}

template void KomoringHeights::SearchImpl<true>(Position& n,
                                                PnDn thpn,
                                                PnDn thdn,
                                                Depth depth,
                                                NodeHistory& node_history,
                                                const LookUpQuery& query,
                                                CommonEntry* entry,
                                                bool inc_flag);
template void KomoringHeights::SearchImpl<false>(Position& n,
                                                 PnDn thpn,
                                                 PnDn thdn,
                                                 Depth depth,
                                                 NodeHistory& node_history,
                                                 const LookUpQuery& query,
                                                 CommonEntry* entry,
                                                 bool inc_flag);
}  // namespace komori
