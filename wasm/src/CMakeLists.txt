file(GLOB sources *.h *.cpp)
add_executable(lookup ${sources})
target_include_directories(lookup
    PRIVATE
        ${CMAKE_SOURCE_DIR}
)

install(DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/" DESTINATION ${CMAKE_INSTALL_PREFIX}
        FILES_MATCHING 
        REGEX "\\.(js|wasm)$"
        PATTERN "CMakeFiles" EXCLUDE
        )
