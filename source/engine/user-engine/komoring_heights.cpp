﻿#if !defined(USER_ENGINE)
#define USER_ENGINE
#endif

#include "komoring_heights.hpp"

#include <algorithm>
#include <cmath>

#include "../../mate/mate.h"
#include "children_cache.hpp"
#include "hands.hpp"
#include "move_picker.hpp"
#include "node_history.hpp"
#include "path_keys.hpp"

namespace komori {
namespace {
constexpr std::size_t kDefaultHashSizeMb = 1024;
constexpr std::int64_t kGcInterval = 3000;

/// TT の使用率が kGcHashfullThreshold を超えたら kGcHashfullRemoveRatio だけ削除する
constexpr int kGcHashfullThreshold = 850;
constexpr int kGcHashfullRemoveRatio = 300;

std::vector<std::pair<Move, SearchResult>> ExpandChildren(TranspositionTable& tt, const Node& n) {
  std::vector<std::pair<Move, SearchResult>> ret;
  if (n.IsOrNode()) {
    for (auto&& move : MovePicker{n.Pos(), NodeTag<true>{}}) {
      auto query = tt.GetChildQuery<true>(n, move.move);
      auto entry = query.LookUpWithoutCreation();
      SearchResult result{*entry, query.GetHand()};
      ret.emplace_back(move.move, result);
    }
  } else {
    for (auto&& move : MovePicker{n.Pos(), NodeTag<false>{}}) {
      auto query = tt.GetChildQuery<false>(n, move.move);
      auto entry = query.LookUpWithoutCreation();
      SearchResult result{*entry, query.GetHand()};
      ret.emplace_back(move.move, result);
    }
  }

  return ret;
}
}  // namespace

void SearchProgress::NewSearch() {
  start_time_ = std::chrono::system_clock::now();
  depth_ = 0;
  move_count_ = 0;
}

void SearchProgress::WriteTo(UsiInfo& output) const {
  auto curr_time = std::chrono::system_clock::now();
  auto time_ms = std::chrono::duration_cast<std::chrono::milliseconds>(curr_time - start_time_).count();
  time_ms = std::max(time_ms, decltype(time_ms){1});
  auto nps = move_count_ * 1000ULL / time_ms;

  output.Set(UsiInfo::KeyKind::kSelDepth, depth_)
      .Set(UsiInfo::KeyKind::kTime, time_ms)
      .Set(UsiInfo::KeyKind::kNodes, move_count_)
      .Set(UsiInfo::KeyKind::kNps, nps);
}

KomoringHeights::KomoringHeights() : tt_{kGcHashfullRemoveRatio} {}

void KomoringHeights::Init() {
  Resize(kDefaultHashSizeMb);
}

void KomoringHeights::Resize(std::uint64_t size_mb) {
  tt_.Resize(size_mb);
}

bool KomoringHeights::Search(Position& n, std::atomic_bool& stop_flag) {
  tt_.NewSearch();
  progress_.NewSearch();
  stop_ = &stop_flag;
  gc_timer_.reset();
  last_gc_ = 0;
  best_moves_.clear();
  tree_size_ = 0;

  Node node{n};
  PnDn thpndn = 1;
  ChildrenCache cache{tt_, node, true, NodeTag<true>{}};
  SearchResult result = cache.CurrentResult(node);
  while (StripMaybeRepetition(result.GetNodeState()) == NodeState::kOtherState && !IsSearchStop()) {
    thpndn = std::max(2 * result.Pn(), 2 * result.Dn());
    thpndn = std::max(thpndn, result.Pn() + 1);
    thpndn = std::max(thpndn, result.Dn() + 1);
    thpndn = std::min(thpndn, kInfinitePnDn);
    score_ = Score::Unknown(result.Pn(), result.Dn());

    result = SearchImpl<true>(node, thpndn, thpndn, cache, false);
  }

  // <for-debug>
  auto query = tt_.GetQuery<true>(node);
  switch (result.GetNodeState()) {
    case NodeState::kProvenState:
      query.SetProven(result.ProperHand(), result.BestMove(), result.GetSolutionLen(), node.GetMoveCount());
      break;
    case NodeState::kDisprovenState:
      query.SetDisproven(result.ProperHand(), result.BestMove(), result.GetSolutionLen(), node.GetMoveCount());
      break;
    case NodeState::kRepetitionState: {
      auto entry = query.LookUpWithCreation();
      query.SetRepetition(entry, node.GetMoveCount());
    } break;
    default:
      auto entry = query.LookUpWithCreation();
      entry->UpdatePnDn(result.Pn(), result.Dn(), node.GetMoveCount());
  }

  std::ostringstream oss;
  auto entry = query.LookUpWithCreation();
  oss << *entry;
  auto usi_output = UsiInfo::String(oss.str());
  progress_.WriteTo(usi_output);
  sync_cout << usi_output << sync_endl;
  // </for-debug>

  stop_ = nullptr;
  if (result.GetNodeState() == NodeState::kProvenState) {
    best_moves_ = CalcBestMoves(node);
    score_ = Score::Proven(static_cast<Depth>(best_moves_.size()));
    if (best_moves_.size() % 2 != 1) {
      sync_cout << "info string Failed to detect PV" << sync_endl;
    }
    return true;
  } else {
    score_ = Score::Disproven();
    return false;
  }
}

std::vector<Move> KomoringHeights::CalcBestMoves(Node& n) {
  std::vector<Move> moves;

  for (;;) {
    auto query = n.IsOrNode() ? tt_.GetQuery<true>(n) : tt_.GetQuery<false>(n);
    auto entry = query.LookUpWithoutCreation();
    Move move = n.Pos().to_move(entry->BestMove(n.OrHand()));

    if (move == MOVE_NONE || !n.Pos().pseudo_legal(move) || !n.Pos().legal(move)) {
      break;
    }

    if (n.IsRepetitionAfter(move)) {
      break;
    }

    moves.emplace_back(move);
    n.DoMove(move);
  }

  // 局面をもとに戻しておく
  for (auto itr = moves.crbegin(); itr != moves.crend(); ++itr) {
    n.UndoMove(*itr);
  }

  return moves;
}

void KomoringHeights::ShowValues(Position& n, const std::vector<Move>& moves) {
  auto depth_max = static_cast<Depth>(moves.size());
  Key path_key = 0;
  Node node{n};
  for (Depth depth = 0; depth < depth_max; ++depth) {
    path_key = PathKeyAfter(path_key, moves[depth], depth);
    node.DoMove(moves[depth]);
  }

  if (depth_max % 2 == 0) {
    for (auto&& move : MovePicker{n, NodeTag<true>{}}) {
      auto query = tt_.GetChildQuery<true>(node, move.move);
      auto entry = query.LookUpWithoutCreation();
      sync_cout << move.move << " " << *entry << sync_endl;
    }
  } else {
    for (auto&& move : MovePicker{n, NodeTag<false>{}}) {
      auto query = tt_.GetChildQuery<false>(node, move.move);
      auto entry = query.LookUpWithoutCreation();
      sync_cout << move.move << " " << *entry << sync_endl;
    }
  }

  static_assert(std::is_signed_v<Depth>);
  for (Depth depth = depth_max - 1; depth >= 0; --depth) {
    node.UndoMove(moves[depth]);
  }
}

void KomoringHeights::ShowPv(Position& n) {
  Node node{n};
  std::vector<Move> moves;

  for (;;) {
    auto children = ExpandChildren(tt_, node);
    std::sort(children.begin(), children.end(), [&](const auto& lhs, const auto& rhs) {
      if (node.IsOrNode()) {
        if (lhs.second.Pn() != rhs.second.Pn()) {
          return lhs.second.Pn() < rhs.second.Pn();
        }
        return lhs.second.Dn() > rhs.second.Dn();
      } else {
        if (lhs.second.Dn() != rhs.second.Dn()) {
          return lhs.second.Dn() < rhs.second.Dn();
        }
        return lhs.second.Pn() > rhs.second.Pn();
      }
    });

    std::ostringstream oss;
    oss << "[" << node.GetDepth() << "] ";
    for (const auto& child : children) {
      oss << child.first << "(" << ToString(child.second.Pn()) << "/" << ToString(child.second.Dn()) << ") ";
    }
    sync_cout << oss.str() << sync_endl;

    if (children.empty() || (children[0].second.Pn() == 1 && children[0].second.Dn() == 1)) {
      break;
    }
    auto best_move = children[0].first;
    node.DoMove(best_move);
    moves.emplace_back(best_move);
    if (node.IsRepetition()) {
      break;
    }
  }

  // 高速 1 手詰めルーチンで解ける局面は置換表に登録されていない可能性がある
  if (node.IsOrNode()) {
    if (Move move = Mate::mate_1ply(node.Pos()); move != MOVE_NONE) {
      node.DoMove(move);
      moves.emplace_back(move);
    }
  }

  sync_cout << sync_endl;
  std::ostringstream oss;
  for (const auto& move : moves) {
    oss << move << " ";
  }
  sync_cout << "pv: " << oss.str() << sync_endl;

  sync_cout << node.Pos() << sync_endl;
  for (auto itr = moves.crbegin(); itr != moves.crend(); ++itr) {
    node.UndoMove(*itr);
  }
}

UsiInfo KomoringHeights::Info() const {
  UsiInfo usi_output{};
  progress_.WriteTo(usi_output);
  usi_output.Set(UsiInfo::KeyKind::kHashfull, tt_.Hashfull()).Set(UsiInfo::KeyKind::kScore, score_);

  return usi_output;
}

void KomoringHeights::PrintDebugInfo() const {
  auto stat = tt_.GetStat();
  std::ostringstream oss;

  oss << "hashfull=" << stat.hashfull << " proven=" << stat.proven_ratio << " disproven=" << stat.disproven_ratio
      << " repetition=" << stat.repetition_ratio << " maybe_repetition=" << stat.maybe_repetition_ratio
      << " other=" << stat.other_ratio;

  sync_cout << UsiInfo::String(oss.str()) << sync_endl;
}

template <bool kOrNode>
SearchResult KomoringHeights::SearchImpl(Node& n, PnDn thpn, PnDn thdn, ChildrenCache& cache, bool inc_flag) {
  progress_.Visit(n.GetDepth(), n.GetMoveCount());

  if (print_flag_) {
    PrintProgress(n);
    print_flag_ = false;
  }

  // 深さ制限。これ以上探索を続けても詰みが見つかる見込みがないのでここで early return する。
  if (n.IsExceedLimit(max_depth_)) {
    return {NodeState::kRepetitionState, kMinimumSearchedAmount, kInfinitePnDn, 0, n.OrHand()};
  }

  auto curr_result = cache.CurrentResult(n);
  // 探索延長。浅い結果を参照している場合、無限ループになる可能性があるので少しだけ探索を延長する
  inc_flag = inc_flag || cache.DoesHaveOldChild();
  if (inc_flag && curr_result.Pn() > 0 && curr_result.Dn() > 0) {
    if constexpr (kOrNode) {
      thdn = Clamp(thdn, curr_result.Dn() + 1);
    } else {
      thpn = Clamp(thpn, curr_result.Pn() + 1);
    }
  }

  if (gc_timer_.elapsed() > last_gc_ + kGcInterval) {
    if (tt_.Hashfull() >= kGcHashfullThreshold) {
      tt_.CollectGarbage();
    }
    last_gc_ = gc_timer_.elapsed();
  }

  std::unordered_map<Move, ChildrenCache*> cache_cache;
  while (!IsSearchStop()) {
    if (curr_result.Pn() >= thpn || curr_result.Dn() >= thdn) {
      break;
    }

    // 最も良さげな子ノードを展開する
    auto best_move = cache.BestMove();
    bool is_first_search = cache.BestMoveIsFirstVisit();
    auto [child_thpn, child_thdn] = cache.ChildThreshold(thpn, thdn);
    if (is_first_search) {
      inc_flag = false;
    }

    auto move_count_org = n.GetMoveCount();
    n.DoMove(best_move);
    auto& child_cache = children_cache_.emplace(tt_, n, is_first_search, NodeTag<!kOrNode>{});
    SearchResult child_result;
    if (is_first_search) {
      child_result = child_cache.CurrentResult(n);
    } else {
      child_result = SearchImpl<!kOrNode>(n, child_thpn, child_thdn, child_cache, inc_flag);
    }

    children_cache_.pop();
    n.UndoMove(best_move);

    cache.UpdateFront(child_result, n.GetMoveCount() - move_count_org);
    curr_result = cache.CurrentResult(n);
  }

  return curr_result;
}

template <bool kOrNode>
std::pair<KomoringHeights::NumMoves, Depth> KomoringHeights::MateMovesSearchImpl(
    std::unordered_map<Key, MateMoveCache>& mate_table,
    std::unordered_map<Key, Depth>& search_history,
    Node& n,
    Depth max_start_depth,
    Depth max_depth) {
  auto key = n.Pos().key();
  tree_size_++;
  if (auto itr = search_history.find(key); itr != search_history.end()) {
    // 探索中の局面にあたったら、不詰を返す
    return {{}, itr->second};
  }

  if (n.GetDepth() > max_depth) {
    // これより短い詰みを知っているので、これ以上探索する意味がない
    return {{}, max_start_depth};
  }

  if (auto itr = mate_table.find(key); itr != mate_table.end()) {
    // 以前訪れたことがあるノードの場合、その結果をそのまま返す
    return {itr->second.num_moves, kNonRepetitionDepth};
  }

  if (kOrNode && !n.Pos().in_check()) {
    if (auto move = Mate::mate_1ply(n.Pos()); move != MOVE_NONE) {
      auto after_hand = AfterHand(n.Pos(), move, n.OrHand());
      NumMoves num_moves = {1, CountHand(after_hand)};
      mate_table[key] = {move, num_moves};
      return {num_moves, kNonRepetitionDepth};
    }
  }

  search_history.insert(std::make_pair(key, n.GetDepth()));
  auto& move_picker = pickers_.emplace(n.Pos(), NodeTag<kOrNode>{});
  auto picker_is_empty = move_picker.empty();

  MateMoveCache curr{};
  curr.num_moves.num = kOrNode ? kMaxNumMateMoves : 0;
  Depth rep_start = kNonRepetitionDepth;

  for (const auto& move : move_picker) {
    auto child_query = tt_.GetChildQuery<kOrNode>(n, move.move);
    auto child_entry = child_query.LookUpWithoutCreation();
    if (child_entry->GetNodeState() != NodeState::kProvenState) {
      continue;
    }

    auto child_capture = n.Pos().capture(move.move);
    n.DoMove(move.move);
    auto [child_num_moves, child_rep_start] =
        MateMovesSearchImpl<!kOrNode>(mate_table, search_history, n, max_start_depth, max_depth);
    n.UndoMove(move.move);

    rep_start = std::min(rep_start, child_rep_start);
    if (child_num_moves.num >= 0) {
      curr.Update<kOrNode>(move.move, child_num_moves.num + 1, child_num_moves.surplus + (child_capture ? 1 : 0));

      if constexpr (kOrNode) {
        if (max_depth > n.GetDepth() + curr.num_moves.num) {
          max_start_depth = n.GetDepth();
          max_depth = n.GetDepth() + curr.num_moves.num;
        }
      }
    } else if (!kOrNode) {
      // nomate
      curr = {};
      break;
    }
  }
  search_history.erase(key);
  pickers_.pop();

  if (!kOrNode && picker_is_empty) {
    curr.num_moves.num = 0;
    curr.num_moves.surplus = n.OrHand();
  }

  if (rep_start >= n.GetDepth()) {
    mate_table[key] = curr;
    if (rep_start == n.GetDepth() && curr.num_moves.num >= 0) {
      n.DoMove(curr.move);
      std::unordered_map<Key, Depth> new_search_history;
      MateMovesSearchImpl<!kOrNode>(mate_table, new_search_history, n, max_start_depth, max_depth);
      n.UndoMove(curr.move);
    }
  }

  return {curr.num_moves, rep_start};
}

void KomoringHeights::PrintProgress(const Node& n) const {
  auto usi_output = Info();

  usi_output.Set(UsiInfo::KeyKind::kDepth, n.GetDepth());
#if defined(KEEP_LAST_MOVE)
  usi_output.Set(UsiInfo::KeyKind::kPv, n.Pos().moves_from_start());
#endif

  sync_cout << usi_output << sync_endl;
}

bool KomoringHeights::IsSearchStop() const {
  return progress_.MoveCount() > max_search_node_ || *stop_;
}

template SearchResult KomoringHeights::SearchImpl<true>(Node& n,
                                                        PnDn thpn,
                                                        PnDn thdn,
                                                        ChildrenCache& cache,
                                                        bool inc_flag);
template SearchResult KomoringHeights::SearchImpl<false>(Node& n,
                                                         PnDn thpn,
                                                         PnDn thdn,
                                                         ChildrenCache& cache,
                                                         bool inc_flag);
template std::pair<KomoringHeights::NumMoves, Depth> KomoringHeights::MateMovesSearchImpl<false>(
    std::unordered_map<Key, MateMoveCache>& mate_table,
    std::unordered_map<Key, Depth>& search_history,
    Node& n,
    Depth max_start_depth,
    Depth max_depth);
template std::pair<KomoringHeights::NumMoves, Depth> KomoringHeights::MateMovesSearchImpl<true>(
    std::unordered_map<Key, MateMoveCache>& mate_table,
    std::unordered_map<Key, Depth>& search_history,
    Node& n,
    Depth max_start_depth,
    Depth max_depth);
}  // namespace komori
