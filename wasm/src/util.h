#pragma once

#include <emscripten.h>
#include <emscripten/val.h>

namespace ldb {

namespace em = emscripten;

inline size_t arrayLength(em::val ary)
{
    if (!ary)
        return 0;
    return ary["length"].as<size_t>();
}

template<class Callback>
inline void arrayEach(em::val ary, Callback&& cb)
{
    size_t len = arrayLength(ary);
    for (size_t i = 0; i < len; ++i) {
        cb(ary[i]);
    }
}

template<class Callback>
inline void objectEach(em::val obj, Callback&& cb)
{
    if (!obj)
        return;
    auto protoObject = em::val::global("Object");
    auto keys = protoObject.call<em::val>("keys", obj);
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

} // namespace ldb
