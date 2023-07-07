#pragma once
#include <array>
#include <type_traits>
#if __cpp_lib_span
#   include <span>
#endif // __cpp_lib_span

namespace ist {

template<typename Container, class T, typename = void>
constexpr bool is_sequential_container_v = false;
template<typename Container, class T>
constexpr bool is_sequential_container_v<Container, T, std::enable_if_t<
    std::is_same_v<std::decay_t<decltype(*std::declval<Container>().data())>, T>>> = true;

const size_t dynamic_extent = ~0;

#if __cpp_lib_span

// use std::span if available
template<class T, size_t Extent = std::dynamic_extent>
using span = std::span<T, Extent>;

#else // __cpp_lib_span

// use our own if std::span is not available
template<class T, size_t Extent = dynamic_extent>
class span
{
public:
    using element_type = T;
    using value_type = std::remove_cv_t<T>;
    using reference = T&;
    using const_reference = const T&;
    using pointer = T*;
    using const_pointer = const T*;
    using iterator = pointer;
    using const_iterator = const_pointer;
    static constexpr size_t extent = Extent;

    constexpr span() = default;
    constexpr span(const span&) = default;
    constexpr span(span&&) = default;
    constexpr span& operator=(const span& v) = default;
    constexpr span& operator=(span&& v) = default;


    template<class Iter, fc_require(is_iterator_v<Iter, T>)>
    constexpr span(Iter first, size_t size) : data_(const_cast<T*>(&*first)) {}
    template<class Iter, fc_require(is_iterator_v<Iter, T>)>
    constexpr explicit span(Iter first, Iter last) : data_(const_cast<T*>(&*first)) {}

    template<size_t N>
    constexpr span(const T(&v)[N]) : data_(const_cast<T*>(v)) {}
    template<class U, size_t N>
    constexpr span(const std::array<U, N>& v) : data_(const_cast<T*>(v.data())) {}
    template<class Container, fc_require(is_sequential_container_v<Container, T>)>
    constexpr explicit span(const Container& v) : data_(const_cast<T*>(v.data())) {}

    constexpr bool empty() const { return size_ == 0; }
    constexpr size_t size() const { return size_; }
    constexpr size_t size_bytes() const { return sizeof(T) * size_; }
    constexpr pointer data() { return data_; }
    constexpr const_pointer data() const { return data_; }
    constexpr reference operator[](size_t i) { return data_[i]; }
    constexpr const_reference operator[](size_t i) const { return data_[i]; }
    constexpr reference front() { return data_[0]; }
    constexpr const_reference front() const { return data_[0]; }
    constexpr reference back() { return data_[size_ - 1]; }
    constexpr const_reference back() const { return data_[size_ - 1]; }
    constexpr iterator begin() { return data_; }
    constexpr const_iterator begin() const { return data_; }
    constexpr iterator end() { return data_ + size_; }
    constexpr const_iterator end() const { return data_ + size_; }

    template<size_t N>
    constexpr span<T, N> first() const
    {
        return { data_, N };
    }
    constexpr span<T, dynamic_extent> first(size_t n) const
    {
        return { data_, n };
    }

    template<size_t N>
    constexpr span<T, N> last() const
    {
        return { data_ + size_ - N, N };
    }
    constexpr span<T, dynamic_extent> last(size_t n) const
    {
        return { data_ + size_ - n, n };
    }

    template<size_t Offset, std::size_t N = dynamic_extent>
    constexpr span<T, N> subspan() const
    {
        return { data_ + Offset, N };
    }
    constexpr span<T, dynamic_extent> subspan(size_t offset, size_t n) const
    {
        return { data_ + offset, n };
    }

private:
    T* data_ = nullptr;
    static const size_t size_ = Extent;
};

template<class T>
class span<T, dynamic_extent>
{
public:
    using element_type = T;
    using value_type = std::remove_cv_t<T>;
    using reference = T&;
    using const_reference = const T&;
    using pointer = T*;
    using const_pointer = const T*;
    using iterator = pointer;
    using const_iterator = const_pointer;

    constexpr span() = default;
    constexpr span(const span&) = default;
    constexpr span(span&&) = default;
    constexpr span& operator=(const span& v) = default;
    constexpr span& operator=(span&& v) = default;

    template<class Iter, fc_require(is_iterator_v<Iter, T>)>
    constexpr span(Iter first, size_t size) : data_(const_cast<T*>(&*first)), size_(size) {}
    template<class Iter, fc_require(is_iterator_v<Iter, T>)>
    constexpr explicit span(Iter first, Iter last) : data_(const_cast<T*>(&*first)), size_(std::distance(first, last)) {}

    template<size_t N>
    constexpr span(const T(&v)[N]) : data_(const_cast<T*>(v)), size_(N) {}
    template<class U, size_t N>
    constexpr span(const std::array<U, N>& v) : data_(const_cast<T*>(v.data())), size_(N) {}
    template<class Container, fc_require(is_sequential_container_v<Container, T>)>
    constexpr explicit span(const Container& v) : data_(const_cast<T*>(v.data())), size_(v.size()) {}

    constexpr bool empty() const { return size_ == 0; }
    constexpr size_t size() const { return size_; }
    constexpr size_t size_bytes() const { return sizeof(T) * size_; }
    constexpr pointer data() { return data_; }
    constexpr const_pointer data() const { return data_; }
    constexpr reference operator[](size_t i) { return data_[i]; }
    constexpr const_reference operator[](size_t i) const { return data_[i]; }
    constexpr reference front() { return data_[0]; }
    constexpr const_reference front() const { return data_[0]; }
    constexpr reference back() { return data_[size_ - 1]; }
    constexpr const_reference back() const { return data_[size_ - 1]; }
    constexpr iterator begin() { return data_; }
    constexpr const_iterator begin() const { return data_; }
    constexpr iterator end() { return data_ + size_; }
    constexpr const_iterator end() const { return data_ + size_; }

    template<size_t N>
    constexpr span<T, N> first() const
    {
        return { data_, N };
    }
    constexpr span<T, dynamic_extent> first(size_t n) const
    {
        return { data_, n };
    }

    template<size_t N>
    constexpr span<T, N> last() const
    {
        return { data_ + size_ - N, N };
    }
    constexpr span<T, dynamic_extent> last(size_t n) const
    {
        return { data_ + size_ - n, n };
    }

    template<size_t Offset, size_t N = dynamic_extent>
    constexpr span<T, N> subspan() const
    {
        return { data_ + Offset, N };
    }
    constexpr span<T, dynamic_extent> subspan(size_t offset, size_t n) const
    {
        return { data_ + offset, n };
    }

private:
    T* data_ = nullptr;
    size_t size_ = 0;
};

#endif // __cpp_lib_span

} // namespace ist
