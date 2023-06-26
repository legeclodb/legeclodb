#pragma once
#include "types.h"

namespace ldb {

template<class T>
struct function_traits : public function_traits<decltype(&T::operator())>
{
};
template<class R, class ...Args> 
struct function_traits<R(Args...)>
{
    using result_type = R;
    static const size_t arg_count = sizeof...(Args);
    template <size_t i> using arg_type = typename std::tuple_element<i, std::tuple<Args...>>::type;
};
template<class R, class C, class ...Args> 
struct function_traits<R(C::*)(Args...)>
{
    using result_type = R;
    static const size_t arg_count = sizeof...(Args);
    template <size_t i> using arg_type = typename std::tuple_element<i, std::tuple<Args...>>::type;
};
template<class R, class C, class ...Args> 
struct function_traits<R(C::*)(Args...) const>
{
    using result_type = R;
    static const size_t arg_count = sizeof...(Args);
    template <size_t i> using arg_type = typename std::tuple_element<i, std::tuple<Args...>>::type;
};

template<class T>
constexpr size_t arg_count()
{
    return function_traits<T>::arg_count;
}

inline size_t array_length(val ary)
{
    if (!ary)
        return 0;
    return ary["length"].as<size_t>();
}


inline int to_bool(val v)
{
    return v.isTrue() ? true : false;
}
inline int to_int(val v, int fallback = 0)
{
    return v.isNumber() ? v.as<int>() : fallback;
}
inline int to_uint(val v, int fallback = 0)
{
    return v.isNumber() ? v.as<uint32_t>() : fallback;
}
inline int to_float(val v, float fallback = 0)
{
    return v.isNumber() ? v.as<float>() : fallback;
}
inline std::string to_string(val v, const char* fallback = "")
{
    return v.isString() ? v.as<std::string>() : fallback;
}

template<class Callback>
inline void array_each(val ary, const Callback& cb)
{
    size_t len = array_length(ary);
    for (size_t i = 0; i < len; ++i) {
        if constexpr (arg_count<Callback>() == 1) {
            cb(ary[i]);
        }
        else if constexpr (arg_count<Callback>() == 2) {
            cb(ary[i], i);
        }
    }
}

template<class Callback>
inline void object_each(val obj, Callback&& cb)
{
    if (!obj)
        return;
    auto protoObject = val::global("Object");
    auto keys = protoObject.call<val>("keys", obj);
    size_t len = keys["length"].as<size_t>();
    for (size_t i = 0; i < len; ++i) {
        auto key = keys[i];
        auto val = obj[key];
        cb(key, val);
    }
}

template<class Iterable, class Callback>
inline auto map(const Iterable& src, Callback&& cb)
{
    using value_t = std::decay_t<decltype(*std::begin(src))>;
    using result_t = decltype(cb(std::declval<value_t>()));
    std::vector<result_t> ret;
    for (const auto& v : src) {
        ret.push_back(cb(v));
    }
    return ret;
}
template<class Dst, class Iterable, class Callback>
inline Dst& map(Dst& dst, const Iterable& src, Callback&& cb)
{
    for (const auto& v : src) {
        dst.push_back(cb(v));
    }
    return dst;
}

template<class Iterable, class Callback>
inline auto filter(const Iterable& src, Callback&& cb)
{
    using value_t = std::decay_t<decltype(*std::begin(src))>;
    std::vector<value_t> ret;
    for (const auto& v : src) {
        if (cb(v))
            ret.push_back(v);
    }
    return ret;
}
template<class Dst, class Iterable, class Callback>
inline Dst& filter(Dst& dst, const Iterable& src, Callback&& cb)
{
    for (const auto& v : src) {
        if (cb(v))
            dst.push_back(v);
    }
    return dst;
}
// in-place version
template<class Container, class Callback>
inline Container& filter_in(Container& src, Callback&& cb)
{
    src.erase(
        std::remove_if(std::begin(src), std::end(src), cb),
        src.end());
    return src;
}

template<class T, size_t N>
static inline T select_value(
    const std::pair<const char*, T>(&table)[N], const std::string& name, T fallback = {})
{
    for (auto& kvp : table) {
        if (kvp.first == name) {
            return kvp.second;
        }
    }
    return fallback;
}

template<class T>
inline T& getTemporary()
{
    static thread_local T instance_;
    return instance_;
}

template<class T>
struct ScoreHolder
{
    float score = 0;
    T value{};

    bool operator<(const ScoreHolder& v) const { return score < v.score; }
};

template<class T, class ScoreFunc>
inline void sortByScore(std::span<T> span, ScoreFunc&& scoreF)
{
    auto& tmp = getTemporary<std::vector<ScoreHolder<T>>>();
    for (auto& obj : span) {
        tmp.push_back({ scoreF(obj), obj });
    }
    std::stable_sort(tmp.begin(), tmp.end());

    auto dst = span.data();
    for (auto& obj : tmp) {
        *dst++ = obj.value;
    }
    tmp.clear();
}


} // namespace ldb
