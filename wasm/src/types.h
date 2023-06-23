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

template<class T>
auto MakeSpan(T& v) { return std::span{v}; }

template<size_t N>
class FixedBitSet
{
public:
    using container = Array<uint32_t, N / 32>;

    constexpr bool get(size_t i) const {
        size_t byte = i / 32;
        size_t bit = i % 32;
        return data_[byte] & (1 << bit);
    }

    constexpr void set(size_t i, bool v) {
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

        constexpr operator bool() const {
            return host_->get(index_);
        }
        template<std::enable_if_t<!std::is_const_v<Host>, bool> = true>
        constexpr void operator=(bool v) const {
            host_->set(index_, v);
        }
    };
    constexpr Proxy<FixedBitSet> operator[](size_t n) { return { this, n }; }
    constexpr Proxy<const FixedBitSet> operator[](size_t n) const { return { this, n }; }

    constexpr container& data() { return data_; }

private:
    container data_{};
};


template<class T, size_t N>
class FixedVector
{
public:
    using container = Array<T, N>;
    using value_type = T;
    using reference = T&;
    using const_reference = const T&;
    using pointer = T*;
    using const_pointer = const T*;
    using iterator = pointer;
    using const_iterator = const_pointer;

    constexpr FixedVector() {}
    constexpr FixedVector(const FixedVector& r) noexcept { operator=(r); }
    constexpr FixedVector(FixedVector&& r) noexcept { operator=(std::move(r)); }
    constexpr FixedVector(size_t n) { resize(n); }
    constexpr ~FixedVector() { clear(); }

    constexpr static size_t capacity() { return N; }
    constexpr size_t size() const { return size_; }
    constexpr bool empty() const { return size_ > 0; }
    constexpr bool full() const { return size_ == N; }
    constexpr iterator begin() { return data(); }
    constexpr iterator end() { return data() + size_; }
    constexpr const_iterator begin() const { return data(); }
    constexpr const_iterator end() const { return data() + size_; }
    constexpr T& operator[](size_t i) { capacity_check(i); return data()[i]; }
    constexpr const T& operator[](size_t i) const { capacity_check(i); return data()[i]; }
    constexpr T* data() { return (T*)buffer_; }
    constexpr const T* data() const { return (T*)buffer_; }
    constexpr T& front() { return data()[0]; }
    constexpr const T& front() const { return data()[0]; }
    constexpr T& back() { return data()[size_ - 1]; }
    constexpr const T& back() const { return data()[size_ - 1]; }

    constexpr void swap(FixedVector& r)
    {
        // メモリブロックの交換はできないので、要素一つ一つを交換または move する必要がある
        size_t size1 = size();
        size_t size2 = r.size();
        size_t min = std::min(size1, size2);
        for (size_t i = 0; i < min; ++i) {
            std::swap(data()[i], r[i]);
        }
        if (size1 < size2) {
            for (size_t i = size1; i < size2; ++i) {
                new (data() + i) T(std::move(r[i]));
            }
            size_ = size2;
            r.resize(size1);
        }
        if (size2 < size1) {
            for (size_t i = size2; i < size1; ++i) {
                new (r.data() + i) T(std::move(data()[i]));
            }
            r.size_ = size1;
            resize(size2);
        }
    }
    constexpr FixedVector& operator=(const FixedVector& r) noexcept
    {
        clear();
        T* dst = data();
        for (auto& v : r) {
            new (dst++) T(v);
        }
        size_ = r.size_;
        return *this;
    }
    constexpr FixedVector& operator=(FixedVector&& r) noexcept
    {
        clear();
        T* dst = data();
        for (auto& v : r) {
            new (dst++) T(std::move(v));
        }
        size_ = r.size_;
        r.clear();
        return *this;
    }

    constexpr void clear()
    {
        resize(0);
    }
    constexpr void resize(size_t n)
    {
        capacity_check(n);
        size_t old_size = size();
        for (size_t i = n; i < old_size; ++i) {
            data()[i].~T();
        }
        for (size_t i = old_size; i < n; ++i) {
            new (data() + i) T();
        }
        size_ = n;
    }
    constexpr void push_back(const T& v)
    {
        capacity_check(size_ + 1);
        new (data() + size_) T(v);
        ++size_;
    }
    constexpr void push_back(T&& v)
    {
        capacity_check(size_ + 1);
        new (data() + size_) T(std::move(v));
        ++size_;
    }
    template< class... Args >
    constexpr T& emplace_back(Args&&... args)
    {
        capacity_check(size_ + 1);
        T* ret = new (data() + size_) T(std::forward<Args>(args)...);
        ++size_;
        return *ret;
    }
    constexpr void pop_back()
    {
        capacity_check(size_ - 1);
        back().~T();
        --size_;
    }

    template<class ForwardIter>
    constexpr void insert(iterator pos, ForwardIter first, ForwardIter last)
    {
        size_t old_size = size();
        size_t d = std::distance(begin(), pos);
        size_t s = std::distance(first, last);
        size_ += s;
        if (d != old_size) {
            std::move_backward(begin() +  d, begin() + old_size, end());
        }
        std::copy(first, last, begin() + d);
    }
    constexpr void insert(iterator pos, const T& v)
    {
        insert(pos, &v, &v + 1);
    }
    constexpr void insert(iterator pos, T&& v)
    {
        size_t old_size = size();
        size_t d = std::distance(begin(), pos);
        size_ += 1;
        if (d != old_size) {
            std::move_backward(begin() + d, begin() + old_size, end());
        }
        data()[d] = std::move(v);
    }

    constexpr void erase(iterator first, iterator last)
    {
        for (auto i = first; i != last; ++i) {
            i->~T();
        }
        size_t s = std::distance(first, last);
        std::move(last, end(), first);
        size_ -= s;
    }
    constexpr void erase(iterator pos)
    {
        erase(pos, pos + 1);
    }

private:
    constexpr void capacity_check(size_t n)
    {
#ifdef _DEBUG
        if (n > capacity()) {
            throw std::out_of_range("FixedVector: out of range");
        }
#endif
    }

private:
    size_t size_ = 0;
    std::byte buffer_[sizeof(T) * N]{};
};


} // namespace ldb
