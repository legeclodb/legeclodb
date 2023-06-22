#pragma once
#include <vector>
#include <string>
#include <array>
#include <cstdint>
#include <span>
#include <type_traits>
#include <emscripten.h>
#include <emscripten/val.h>

namespace ldb {

template<class T, size_t N>
using Array = std::array<T, N>;

template<class T>
using Span = std::span<T>;

template<size_t N>
class FixedBitSet
{
public:
    using container = Array<uint32_t, N / 32>;

    bool get(size_t i) const {
        size_t byte = i / 32;
        size_t bit = i % 32;
        return data_[byte] & (1 << bit);
    }

    void set(size_t i, bool v) {
        size_t byte = i / 32;
        size_t bit = i % 32;
        if (v)
            data_[byte] |= 1 << bit;
        else
            data_[byte] &= ~(1 << bit);
    }

    template<class Host>
    struct Proxy {
        Host* host_;
        size_t index_;

        operator bool() const {
            return host_->get(index_);
        }
        template<std::enable_if_t<!std::is_const_v<Host>, bool> = true>
        void operator=(bool v) const {
            host_->set(index_, v);
        }
    };
    auto operator[](size_t n) { return Proxy<FixedBitSet>{ this, n }; }
    auto operator[](size_t n) const { return Proxy<const FixedBitSet>{ this, n }; }

    container& data() { return data_; }

private:
    container data_{};
};


template<class T, size_t N>
class FixedVector
{
public:
    using container = Array<T, N>;
    using iterator = typename container::iterator;
    using const_iterator = typename container::const_iterator;

    FixedVector() = default;
    FixedVector(const FixedVector&) = default;
    FixedVector(FixedVector&&) = default;
    FixedVector(size_t n) { resize(n); }

    static size_t capacity() { return N; }
    size_t size() const { return size_; }
    iterator begin() { return data_.begin(); }
    iterator end() { return data_.begin() + size_; }
    const_iterator begin() const { return data_.begin(); }
    const_iterator end() const { return data_.begin() + size_; }
    T& operator[](size_t i) { capacityCheck(i); return data_[i]; }
    const T& operator[](size_t i) const { capacityCheck(i); return data_[i]; }

    void resize(size_t n) { capacityCheck(n); size_ = n; }
    void push_back(const T& v) { capacityCheck(size_ + 1); data_[size_++] = v; }
    void push_back(T&& v) { capacityCheck(size_ + 1); data_[size_++] = std::move(v); }

private:
    void capacityCheck(size_t n)
    {
#ifdef _DEBUG
        if (n > capacity()) {
            throw std::out_of_range("FixedVector: out of range");
        }
#endif
    }

private:
    size_t size_ = 0;
    container data_{};
};

} // namespace ldb
