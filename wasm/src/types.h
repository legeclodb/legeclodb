#pragma once
#include <cstdint>
#include <array>
#include <vector>
#include <string>
#include <bitset>
#include <span>
#include <type_traits>
#include <limits>
#include <functional>
#include <future>
#include <atomic>

#include <emscripten.h>
#include <emscripten/val.h>
#include <emscripten/atomic.h>
#include "flat_container/fixed_vector.h"
#include "flat_container/flat_map.h"
#include "flat_container/flat_set.h"

namespace ldb {

const int gThreadCount = 8;

using val = emscripten::val;

} // namespace ldb
