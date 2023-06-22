CMAKE_MINIMUM_REQUIRED(VERSION 3.5)
PROJECT(lookup)

if (NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE "Release" CACHE PATH "" FORCE)
endif()
if (CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT)
    set(CMAKE_INSTALL_PREFIX "${CMAKE_SOURCE_DIR}/public/wasm" CACHE PATH "" FORCE)
endif()

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++20 --bind \
-s INVOKE_RUN=0 \
-s ALLOW_MEMORY_GROWTH=1 \
-s ERROR_ON_UNDEFINED_SYMBOLS=1 \
-s USE_PTHREADS=1 \
")

add_compile_definitions(
    $<$<CONFIG:Debug>:_DEBUG>
)

add_subdirectory(src)