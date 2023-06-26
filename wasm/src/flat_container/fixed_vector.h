#pragma once
#include <initializer_list>
#include <type_traits>
#include <cstddef>

#ifdef _DEBUG
#   if !defined(FC_ENABLE_CAPACITY_CHECK)
#       define FC_ENABLE_CAPACITY_CHECK
#   endif
#endif


namespace ist {

template<class T, size_t Capacity>
class fixed_memory
{
public:
    // suppress warning for uninitialized members
#pragma warning(disable:26495)
    fixed_memory() {}
#pragma warning(default:26495)
    ~fixed_memory() {}
    constexpr static size_t capacity() { return capacity_; }
    constexpr size_t size() const { return size_; }
    constexpr T* data() { return (T*)buffer_; }
    constexpr const T* data() const { return (T*)buffer_; }

public:
    static const size_t capacity_ = Capacity;
    size_t size_ = 0;
    union {
        T data_[0]; // for debug
        std::byte buffer_[sizeof(T) * Capacity]; // uninitialized in intention
    };
};

template<class T>
class memory_view
{
public:
    static const bool is_memory_view = true;
    static const bool is_trivially_swappable = true;

    memory_view() {}
    memory_view(void* data, size_t capacity, size_t size = 0) : capacity_(capacity), size_(size), data_((T*)data) {}
    constexpr size_t capacity() { return capacity_; }
    constexpr size_t size() const { return size_; }
    constexpr T* data() { return data_; }
    constexpr const T* data() const { return data_; }

public:
    size_t capacity_ = 0;
    size_t size_ = 0;
    T* data_ = nullptr;
};

template <typename T, typename = void>
constexpr bool is_memory_view_v = false;
template <typename T>
constexpr bool is_memory_view_v<T, std::enable_if_t<T::is_memory_view>> = true;

template <typename T, typename = void>
constexpr bool is_trivially_swappable_v = false;
template <typename T>
constexpr bool is_trivially_swappable_v<T, std::enable_if_t<T::is_trivially_swappable>> = true;


template<class T, class Memory>
class basic_fixed_vector : public Memory
{
using super = Memory;
public:
    using value_type = T;
    using reference = T&;
    using const_reference = const T&;
    using pointer = T*;
    using const_pointer = const T*;
    using iterator = pointer;
    using const_iterator = const_pointer;

    constexpr basic_fixed_vector() {}
    constexpr basic_fixed_vector(basic_fixed_vector&& r) noexcept { operator=(std::move(r)); }

    template<bool view = is_memory_view_v<super>, std::enable_if_t<!view, bool> = true>
    constexpr basic_fixed_vector(const basic_fixed_vector& r) noexcept { operator=(r); }

    template<bool view = is_memory_view_v<super>, std::enable_if_t<!view, bool> = true>
    constexpr explicit basic_fixed_vector(size_t n) { resize(n); }

    template<bool view = is_memory_view_v<super>, std::enable_if_t<!view, bool> = true>
    constexpr basic_fixed_vector(size_t n, const T& v) { resize(n, v); }

    template<bool view = is_memory_view_v<super>, std::enable_if_t<!view, bool> = true>
    constexpr basic_fixed_vector(std::initializer_list<T> r) { assign(r); }

    template<class ForwardIter, bool view = is_memory_view_v<super>, std::enable_if_t<!view, bool> = true>
    constexpr basic_fixed_vector(ForwardIter first, ForwardIter last) { assign(first, last); }

    template<bool view = is_memory_view_v<super>, std::enable_if_t<view, bool> = true>
    constexpr basic_fixed_vector(void* data, size_t capacity, size_t size = 0)
        : super(data, capacity, size)
    {
    }

    ~basic_fixed_vector() { clear(); }

    constexpr void swap(basic_fixed_vector& r)
    {
        if constexpr (is_trivially_swappable_v<super>) {
            std::swap(capacity_, r.capacity_);
            std::swap(size_, r.size_);
            std::swap(data_, r.data_);
        }
        else {
            size_t size1 = size_;
            size_t size2 = r.size_;
            size_t swap_count = std::min(size1, size2);
            for (size_t i = 0; i < swap_count; ++i) {
                std::swap(data_[i], r[i]);
            }
            if (size1 < size2) {
                for (size_t i = size1; i < size2; ++i) {
                    new (data_ + i) T(std::move(r[i]));
                    r[i].~T();
                }
            }
            if (size2 < size1) {
                for (size_t i = size2; i < size1; ++i) {
                    new (r.data_ + i) T(std::move(data_[i]));
                    data_[i].~T();
                }
            }
            std::swap(size_, r.size_);
        }
    }

    constexpr basic_fixed_vector& operator=(const basic_fixed_vector& r) noexcept
    {
        if constexpr (!is_memory_view_v<super>) {
            assign(r.begin(), r.end());
        }
        else {
            // forbid copy if memory view
            static_assert(!is_memory_view_v<super>);
        }
        return *this;
    }
    constexpr basic_fixed_vector& operator=(basic_fixed_vector&& r) noexcept
    {
        if constexpr (is_trivially_swappable_v<super>) {
            swap(r);
        }
        else {
            assign_impl(r.size(), [&](T* dst) { move_construct(dst, r.begin(), r.end()); });
            r.clear();
        }
        return *this;
    }

    using super::capacity;
    using super::size;
    using super::data;

    constexpr bool empty() const { return size_ > 0; }
    constexpr bool full() const { return size_ == capacity_; }
    constexpr iterator begin() { return data_; }
    constexpr iterator end() { return data_ + size_; }
    constexpr const_iterator begin() const { return data_; }
    constexpr const_iterator end() const { return data_ + size_; }
    constexpr T& operator[](size_t i) { capacity_check(i); return data_[i]; }
    constexpr const T& operator[](size_t i) const { capacity_check(i); return data_[i]; }
    constexpr T& front() { return data_[0]; }
    constexpr const T& front() const { return data_[0]; }
    constexpr T& back() { return data_[size_ - 1]; }
    constexpr const T& back() const { return data_[size_ - 1]; }

    // just for compatibility
    constexpr void reserve(size_t n) {}
    constexpr void shrink_to_fit() {}

    constexpr void clear()
    {
        shrink(size_);
    }

    constexpr void resize(size_t n)
    {
        resize_impl(n, [&](T* addr) { new (addr) T(); });
    }
    constexpr void resize(size_t n, const T& v)
    {
        resize_impl(n, [&](T* addr) { new (addr) T(v); });
    }

    constexpr void push_back(const T& v)
    {
        expand(1, [&](T* addr) { new (addr) T(v); });
    }
    constexpr void push_back(T&& v)
    {
        expand(1, [&](T* addr) { new (addr) T(std::move(v)); });
    }

    template< class... Args >
    constexpr T& emplace_back(Args&&... args)
    {
        expand(1, [&](T* addr) { new (addr) T(std::forward<Args>(args)...); });
        return back();
    }

    constexpr void pop_back()
    {
        shrink(1);
    }

    template<class ForwardIter>
    constexpr void assign(ForwardIter first, ForwardIter last)
    {
        size_t n = std::distance(first, last);
        assign_impl(n, [&](T* dst) { copy_construct(dst, first, last); });
    }
    constexpr void assign(std::initializer_list<value_type> list)
    {
        assign_impl(list.size(), [&](T* dst) { copy_construct(dst, list.begin(), list.end()); });
    }
    constexpr void assign(size_t n, const T& v)
    {
        assign_impl(n, [&](T* dst) { copy_construct(dst, v); });
    }

    template<class ForwardIter>
    constexpr iterator insert(iterator pos, ForwardIter first, ForwardIter last)
    {
        size_t n = std::distance(first, last);
        return insert_impl(pos, n, [&](T* addr) { copy_construct(addr, first, last); });
    }
    constexpr iterator insert(iterator pos, const T& v)
    {
        return insert_impl(pos, 1, [&](T* addr) { copy_construct(addr, v); });
    }
    constexpr iterator insert(iterator pos, T&& v)
    {
        return insert_impl(pos, 1, [&](T* addr) { move_construct(addr, std::move(v)); });
    }
    constexpr iterator insert(iterator pos, std::initializer_list<value_type> list)
    {
        return insert_impl(pos, list.size(), [&](T* addr) { copy_construct(addr, list.begin(), list.end()); });
    }

    constexpr iterator erase(iterator first, iterator last)
    {
        size_t s = std::distance(first, last);
        std::move(last, end(), first);
        shrink(s);
        return first;
    }
    constexpr iterator erase(iterator pos)
    {
        return erase(pos, pos + 1);
    }

private:
    using super::capacity_;
    using super::size_;
    using super::data_;

    constexpr void copy_construct(iterator pos, const T& v)
    {
        if (pos >= data_ + size_) {
            new (pos) T(v);
        }
        else {
            *pos = v;
        }
    }
    template<class ForwardIter>
    constexpr void copy_construct(iterator dst, ForwardIter first, ForwardIter last)
    {
        size_t n = std::distance(first, last);
        T* end_assign = std::min(dst + n, data_ + size_);
        T* end_new = dst + n;
        while (dst < end_assign) {
            *dst++ = *first++;
        }
        while (dst < end_new) {
            new (dst++) T(*first++);
        }
    }

    constexpr void move_construct(iterator pos, T&& v)
    {
        if (pos >= data_ + size_) {
            new (pos) T(std::move(v));
        }
        else {
            *pos = std::move(v);
        }
    }
    template<class ForwardIter>
    constexpr void move_construct(iterator dst, ForwardIter first, ForwardIter last)
    {
        size_t n = std::distance(first, last);
        T* end_assign = std::min(dst + n, data_ + size_);
        T* end_new = dst + n;
        while (dst < end_assign) {
            *dst++ = std::move(*first++);
        }
        while (dst < end_new) {
            new (dst++) T(std::move(*first++));
        }
    }

    template<class Construct>
    constexpr void assign_impl(size_t n, Construct&& construct) noexcept
    {
        capacity_check(n);
        T* dst = data_;
        T* end_dtor = data_ + size_;
        construct(dst);
        dst += n;
        while (dst < end_dtor) {
            (dst++)->~T();
        }
        size_ = n;
    }

    constexpr void shrink(size_t n)
    {
        size_t new_size = size_ - n;
        capacity_check(new_size);
        for (size_t i = new_size; i < size_; ++i) {
            data_[i].~T();
        }
        size_ = new_size;
    }

    template<class Construct>
    constexpr void expand(size_t n, Construct&& construct)
    {
        size_t new_size = size_ + n;
        capacity_check(new_size);
        for (size_t i = size_; i < new_size; ++i) {
            construct(data_ + i);
        }
        size_ = new_size;
    }

    template<class Construct>
    constexpr void resize_impl(size_t n, Construct&& construct)
    {
        if (n < size_) {
            shrink(size_ - n);
        }
        else if (n > size_) {
            expand(n - size_, std::move(construct));
        }
    }

    template<class Construct>
    constexpr iterator insert_impl(iterator pos, size_t s, Construct&& construct)
    {
        move_backward(pos, data_ + size_, data_ + size_ + s);
        construct(pos);
        size_ += s;
        return pos;
    }

    constexpr iterator move_backward(iterator first, iterator last, iterator dst)
    {
        size_t n = std::distance(first, last);
        if (n == 0) {
            return dst;
        }
        T* end_new = data_ + size_;
        T* end_assign = dst - n;
        while (dst > end_new) {
            new (--dst) T(std::move(*(--last)));
        }
        while (dst > end_assign) {
            *(--dst) = std::move(*(--last));
        }
        return dst;
    }

    constexpr void capacity_check(size_t n) const
    {
#ifdef FC_ENABLE_CAPACITY_CHECK
        if (n > capacity()) {
            throw std::out_of_range("fixed_vector: out of range");
        }
#endif
    }
};


template<class T, size_t Capacity>
using fixed_vector = basic_fixed_vector<T, fixed_memory<T, Capacity>>;

template<class T>
using vector_view = basic_fixed_vector<T, memory_view<T>>;

} // namespace ist
