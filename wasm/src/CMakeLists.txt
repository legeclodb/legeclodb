file(GLOB sources *.h *.cpp)
add_executable(lookup ${sources})
target_include_directories(lookup
    PRIVATE
        ${CMAKE_SOURCE_DIR}
)
