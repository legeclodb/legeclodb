#pragma once
#include <vector>
#include <algorithm>
#include <initializer_list>
#include "vector.h"

namespace ist {

// flat set (aka sorted vector)
template <
    class Key,
    class Compare = std::less<>,
    class Container = std::vector<Key, std::allocator<Key>>
>
class basic_set
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


    basic_set() {}
    basic_set(const basic_set& v) { operator=(v); }
    basic_set(basic_set&& v) noexcept { operator=(std::move(v)); }
    basic_set(const container_type& v) { operator=(v); }
    basic_set(container_type&& v) noexcept { operator=(std::move(v)); }

    template <class Iter, bool mapped = is_mapped_memory_v<container_type>, fc_require(!mapped), fc_require(is_iterator_v<Iter, value_type>)>
    basic_set(Iter first, Iter last)
    {
        insert(first, last);
    }
    template <bool mapped = is_mapped_memory_v<container_type>, fc_require(!mapped)>
    basic_set(std::initializer_list<value_type> list)
    {
        insert(list);
    }

    template<bool mapped = is_mapped_memory_v<container_type>, fc_require(mapped)>
    basic_set(void* data, size_t capacity, size_t size = 0)
        : data_(data, capacity, size)
    {
    }

    basic_set& operator=(const basic_set& v)
    {
        data_ = v.data_;
        return *this;
    }
    basic_set& operator=(basic_set&& v) noexcept
    {
        swap(v);
        return *this;
    }
    basic_set& operator=(const container_type& v)
    {
        data_ = v.data_;
        sort();
        return *this;
    }
    basic_set& operator=(container_type&& v) noexcept
    {
        swap(v);
        return *this;
    }

    void swap(basic_set& v) noexcept
    {
        data_.swap(v.data_);
    }
    void swap(container_type& v) noexcept
    {
        data_.swap(v);
        sort();
    }

    const container_type& get() const { return data_; }
    container_type&& extract() { return std::move(data_); }

    bool operator==(const basic_set& v) const { return data_ == v.data_; }
    bool operator!=(const basic_set& v) const { return data_ != v.data_; }


    void reserve(size_type v) { data_.reserve(v); }
    void clear() { data_.clear(); }
    void shrink_to_fit() { data_.shrink_to_fit(); }

    size_type empty() const noexcept { return data_.empty(); }
    size_type size() const noexcept { return data_.size(); }
    pointer data() noexcept { return data_.data(); }
    const_pointer data() const noexcept { return data_.data(); }
    iterator begin() noexcept { return data_.begin(); }
    const_iterator begin() const noexcept { return data_.begin(); }
    constexpr const_iterator cbegin() const noexcept { return data_.cbegin(); }
    iterator end() noexcept { return data_.end(); }
    const_iterator end() const noexcept { return data_.end(); }
    constexpr const_iterator cend() const noexcept { return data_.cend(); }

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
        if (it == end() || !equal(*it, v)) {
            return { data_.insert(it, v), true };
        }
        else {
            return { it, false };
        }
    }
    std::pair<iterator, bool> insert(value_type&& v)
    {
        auto it = lower_bound(v);
        if (it == end() || !equal(*it, v)) {
            return { data_.insert(it, v), true };
        }
        else {
            return { it, false };
        }
    }
    template<class Iter, fc_require(is_iterator_v<Iter, value_type>)>
    void insert(Iter first, Iter last)
    {
        for (auto i = first; i != last; ++i) {
            insert(*i);
        }
    }
    void insert(std::initializer_list<value_type> list)
    {
        insert(list.begin(), list.end());
    }

    iterator erase(const value_type& v)
    {
        if (auto it = find(v); it != end()) {
            return data_.erase(it);
        }
        else {
            return end();
        }
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
    void sort() { std::sort(begin(), end(), key_compare()); }

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

template<class K, class Comp, class Cont1, class Cont2>
bool operator==(const basic_set<K, Comp, Cont1>& l, const basic_set<K, Comp, Cont2>& r)
{
    return l.size() == r.size() && std::equal(l.begin(), l.end(), r.begin());
}
template<class K, class Comp, class Cont1, class Cont2>
bool operator!=(const basic_set<K, Comp, Cont1>& l, const basic_set<K, Comp, Cont2>& r)
{
    return l.size() != r.size() || !std::equal(l.begin(), l.end(), r.begin());
}
template<class K, class Comp, class Cont1, class Cont2>
bool operator<(const basic_set<K, Comp, Cont1>& l, const basic_set<K, Comp, Cont2>& r)
{
    return std::lexicographical_compare(l.begin(), l.end(), r.begin(), r.end());
}
template<class K, class Comp, class Cont1, class Cont2>
bool operator>(const basic_set<K, Comp, Cont1>& l, const basic_set<K, Comp, Cont2>& r)
{
    return r < l;
}
template<class K, class Comp, class Cont1, class Cont2>
bool operator<=(const basic_set<K, Comp, Cont1>& l, const basic_set<K, Comp, Cont2>& r)
{
    return !(r < l);
}
template<class K, class Comp, class Cont1, class Cont2>
bool operator>=(const basic_set<K, Comp, Cont1>& l, const basic_set<K, Comp, Cont2>& r)
{
    return !(l < r);
}


template <class Key, class Compare = std::less<>>
using flat_set = basic_set<Key, Compare, std::vector<Key, std::allocator<Key>>>;

template <class Key, size_t Capacity, class Compare = std::less<>>
using fixed_set = basic_set<Key, Compare, fixed_vector<Key, Capacity>>;

template <class Key, size_t Capacity, class Compare = std::less<>>
using sbo_set = basic_set<Key, Compare, sbo_vector<Key, Capacity>>;

template <class Key, class Compare = std::less<>>
using mapped_set = basic_set<Key, Compare, mapped_vector<Key>>;

} // namespace ist


namespace std {

template<class K, class Comp, class Cont>
void swap(ist::basic_set<K, Comp, Cont>& l, ist::basic_set<K, Comp, Cont>& r) noexcept
{
    l.swap(r);
}

} // namespace std
