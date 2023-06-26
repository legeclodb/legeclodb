#pragma once
#include <vector>
#include <algorithm>
#include <initializer_list>
#include "fixed_vector.h"

namespace ist {

// flat set (aka sorted vector)
template <
    class Key,
    class Compare = std::less<>,
    class Container = std::vector<Key, std::allocator<Key>>
>
class flat_set
{
public:
    using key_type               = Key;
    using value_type             = Key;
    using size_type              = std::size_t;
    using difference_type        = std::ptrdiff_t;
    using key_compare            = Compare;
    using value_compare          = Compare;
    using reference              = Key&;
    using const_reference        = const Key&;
    using pointer                = Key*;
    using const_pointer          = const Key*;
    using container_type         = Container;
    using iterator               = typename container_type::iterator;
    using const_iterator         = typename container_type::const_iterator;


    flat_set() {}
    flat_set(const flat_set& v) { operator=(v); }
    flat_set(flat_set&& v) noexcept { operator=(std::move(v)); }

    template <class Iter, bool view = is_memory_view_v<container_type>, std::enable_if_t<!view, bool> = true>
    flat_set(Iter first, Iter last)
    {
        insert(first, last);
    }
    template <bool view = is_memory_view_v<container_type>, std::enable_if_t<!view, bool> = true>
    flat_set(std::initializer_list<value_type> list)
    {
        insert(list);
    }

    template<bool view = is_memory_view_v<container_type>, std::enable_if_t<view, bool> = true>
    flat_set(void* data, size_t capacity, size_t size = 0)
        : data_(data, capacity, size)
    {
    }

    flat_set& operator=(const flat_set& v)
    {
        data_ = v.data_;
        return *this;
    }
    flat_set& operator=(flat_set&& v) noexcept
    {
        swap(v);
        return *this;
    }

    void swap(flat_set& v) noexcept
    {
        data_.swap(v.data_);
    }
    // v must be sorted or call sort() after swap()
    void swap(container_type& v) noexcept
    {
        data_.swap(v);
    }

    // representation

    container_type& get() { return data_; }
    const container_type& get() const { return data_; }

    container_type&& extract() { return std::move(data_); }

    // compare

    bool operator==(const flat_set& v) const { return data_ == v.data_; }
    bool operator!=(const flat_set& v) const { return data_ != v.data_; }

    // resize & clear

    void reserve(size_type v) { data_.reserve(v); }

    // resize() may break the order. sort() should be called in that case.
    void resize(size_type v) { data_.resize(v); }

    void clear() { data_.clear(); }

    void shrink_to_fit() { data_.shrink_to_fit(); }

    // for the case m_data is directry modified (resize(), swap(), get(), etc)
    void sort() { std::sort(begin(), end(), key_compare()); }

    // size & data

    size_type empty() const { return data_.empty(); }

    size_type size() const { return data_.size(); }

    pointer data() { return data_.data(); }
    const_pointer data() const { return data_.data(); }

    // iterator

    iterator begin() noexcept { return data_.begin(); }
    const_iterator begin() const noexcept { return data_.begin(); }
    constexpr const_iterator cbegin() const noexcept { return data_.cbegin(); }

    iterator end() noexcept { return data_.end(); }
    const_iterator end() const noexcept { return data_.end(); }
    constexpr const_iterator cend() const noexcept { return data_.cend(); }

    // search

    iterator lower_bound(const value_type& v)
    {
        return std::lower_bound(begin(), end(), v, key_compare());
    }
    const_iterator lower_bound(const value_type& v) const
    {
        return std::lower_bound(begin(), end(), v, key_compare());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    iterator lower_bound(const V& v)
    {
        return std::lower_bound(begin(), end(), v, C());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    const_iterator lower_bound(const V& v) const
    {
        return std::lower_bound(begin(), end(), v, C());
    }

    iterator upper_bound(const value_type& v)
    {
        return std::upper_bound(begin(), end(), v, key_compare());
    }
    const_iterator upper_bound(const value_type& v) const
    {
        return std::upper_bound(begin(), end(), v, key_compare());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    iterator upper_bound(const V& v)
    {
        return std::upper_bound(begin(), end(), v, C());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    const_iterator upper_bound(const V& v) const
    {
        return std::upper_bound(begin(), end(), v, C());
    }

    std::pair<iterator, iterator> equal_range(const value_type& v)
    {
        return std::equal_range(begin(), end(), v, key_compare());
    }
    std::pair<const_iterator, const_iterator> equal_range(const value_type& v) const
    {
        return std::equal_range(begin(), end(), v, key_compare());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    std::pair<iterator, iterator> equal_range(const V& v)
    {
        return std::equal_range(begin(), end(), v, C());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    std::pair<const_iterator, const_iterator> equal_range(const V& v) const
    {
        return std::equal_range(begin(), end(), v, C());
    }

    iterator find(const value_type& v)
    {
        auto it = lower_bound(v);
        return (it != end() && equal(*it, v)) ? it : end();
    }
    const_iterator find(const value_type& v) const
    {
        auto it = lower_bound(v);
        return (it != end() && equal(*it, v)) ? it : end();
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    iterator find(const V& v)
    {
        auto it = lower_bound<V, C>(v);
        return (it != end() && equal<value_type, V, C>(*it, v)) ? it : end();
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    const_iterator find(const V& v) const
    {
        auto it = lower_bound<V, C>(v);
        return (it != end() && equal<value_type, V, C>(*it, v)) ? it : end();
    }

    size_t count(const value_type& v) const
    {
        return find(v) != end() ? 1 : 0;
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    size_t count(const V& v) const
    {
        return find<V, C>(v) != end() ? 1 : 0;
    }

    // insert & erase

    std::pair<iterator, bool> insert(const value_type& v)
    {
        auto it = lower_bound(v);
        if (it == end() || !equal(*it, v))
            return { data_.insert(it, v), true };
        else
            return { it, false };
    }
    std::pair<iterator, bool> insert(value_type&& v)
    {
        auto it = lower_bound(v);
        if (it == end() || !equal(*it, v))
            return { data_.insert(it, v), true };
        else
            return { it, false };
    }
    template <class Iter>
    void insert(Iter first, Iter last)
    {
        for (auto i = first; i != last; ++i)
            insert(*i);
    }
    void insert(std::initializer_list<value_type> list)
    {
        insert(list.begin(), list.end());
    }

    iterator erase(const value_type& v)
    {
        if (auto it = find(v); it != end())
            return data_.erase(it);
        else
            return end();
    }
    iterator erase(iterator pos)
    {
        return data_.erase(pos);
    }
    iterator erase(iterator first, iterator last)
    {
        return data_.erase(first, last);
    }

private:
    static bool equal(const value_type& a, const value_type& b)
    {
        return !Compare()(a, b) && !Compare()(b, a);
    }
    template <class V1, class V2, class C = Compare, class = typename C::is_transparent>
    static bool equal(const V1& a, const V2& b)
    {
        return !C()(a, b) && !C()(b, a);
    }

private:
    container_type data_;
};


template <
    class Key,
    size_t Capacity,
    class Compare = std::less<>
>
using fixed_set = flat_set<Key, Compare, fixed_vector<Key, Capacity>>;

template <
    class Key,
    class Compare = std::less<>
>
using set_view = flat_set<Key, Compare, vector_view<Key>>;

} // namespace ist
