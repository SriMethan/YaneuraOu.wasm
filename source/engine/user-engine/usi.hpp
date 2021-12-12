#ifndef USI_HPP_
#define USI_HPP_
#include <cmath>
#include <optional>
#include <type_traits>
#include <unordered_map>

#include "typedefs.hpp"

namespace komori {

class Score {
 public:
  static Score Unknown(int pn, int dn) {
    // - a log(1/x - 1)
    //   a: Ponanza 定数
    //   x: 勝率(<- dn / (pn + dn))

    constexpr double kA = 600.0;
    dn = std::max(dn, 1);
    double value = -kA * std::log(static_cast<double>(pn) / static_cast<double>(dn));
    return Score{Kind::kUnknown, static_cast<int>(value)};
  }
  static Score Proven(Depth mate_len) { return Score{Kind::kProven, mate_len}; }
  static Score Disproven() { return Score{Kind::kDisproven, 0}; }

  Score() = default;

  std::string ToString() const {
    switch (kind_) {
      case Kind::kProven:
        return std::string{"mate "} + std::to_string(value_);
      case Kind::kDisproven:
        return std::string{"mate -0"};
      default:
        return std::string{"cp "} + std::to_string(value_);
    }
  }

 private:
  enum class Kind {
    kUnknown,
    kProven,
    kDisproven,
  };

  static inline constexpr int kMinValue = -32767;
  static inline constexpr int kMaxValue = 32767;

  Score(Kind kind, int value) : kind_{kind}, value_{value} {}

  Kind kind_{Kind::kUnknown};
  int value_{};
};

/**
 * @brief USIプロトコルに従い Info を出力するための構造体
 */
class UsiInfo {
 public:
  enum class KeyKind {
    kDepth,
    kSelDepth,
    kTime,
    kNodes,
    kNps,
    kHashfull,
    kScore,
    kPv,
    kString,
  };

  static UsiInfo String(const std::string& str) {
    UsiInfo usi_output{};
    usi_output.Set(KeyKind::kString, std::move(str));
    return usi_output;
  }

  std::string ToString() const;

  template <typename T,
            std::enable_if_t<std::is_integral_v<std::decay_t<T>> || std::is_floating_point_v<std::decay_t<T>>,
                             std::nullptr_t> = nullptr>
  UsiInfo& Set(KeyKind kind, T&& value) {
    return Set(kind, std::to_string(std::forward<T>(value)));
  }

  UsiInfo& Set(KeyKind kind, Score score) { return Set(kind, score.ToString()); }

  UsiInfo& Set(KeyKind kind, std::string value) {
    if (kind == KeyKind::kPv) {
      pv_ = std::move(value);
    } else if (kind == KeyKind::kString) {
      string_ = std::move(value);
    } else {
      options_[kind] = std::move(value);
    }
    return *this;
  }

 private:
  std::unordered_map<KeyKind, std::string> options_;

  // PV と String は info の最後に片方だけ出力する必要があるため、他の変数とは持ち方を変える
  std::optional<std::string> pv_;
  std::optional<std::string> string_;
};

std::ostream& operator<<(std::ostream& os, const UsiInfo& usi_output);
}  // namespace komori
#endif  // USI_HPP_