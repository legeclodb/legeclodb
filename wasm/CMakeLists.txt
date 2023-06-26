CMAKE_MINIMUM_REQUIRED(VERSION 3.15)
PROJECT(ldb)

if (NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE "Release" CACHE PATH "" FORCE)
endif()
if (CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT)
    set(CMAKE_INSTALL_PREFIX "${CMAKE_SOURCE_DIR}/../public/lib" CACHE PATH "" FORCE)
endif()

if(MSVC)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /std:c++20")
else()
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++20 --bind \
    -ffile-prefix-map=${CMAKE_SOURCE_DIR}=./wasm \
    -s INVOKE_RUN=0 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
    -s USE_PTHREADS=1 \
    ")
endif()

add_compile_definitions(
    $<$<CONFIG:Debug>:_DEBUG>
)

file(GLOB sources src/*.h src/*.cpp)
add_executable(ldb ${sources})
target_include_directories(ldb
    PRIVATE
        ${CMAKE_SOURCE_DIR}
)

install(DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/" DESTINATION ${CMAKE_INSTALL_PREFIX}
    FILES_MATCHING 
    REGEX "\\.(js|wasm)$"
    PATTERN "CMakeFiles" EXCLUDE
)
