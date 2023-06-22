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

} // namespace ldb
