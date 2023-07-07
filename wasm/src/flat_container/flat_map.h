#pragma once
#include <vector>
#include <algorithm>
#include <utility>
#include <initializer_list>
#include "vector.h"

namespace ist {

// flat map (std::map-like sorted vector)
template <
    class Key,
    class Value,
    class Compare = std::less<>,
    class Container = std::vector<std::pair<Key, Value>, std::allocator<std::pair<Key, Value>>>
>
class basic_map
{
public:
    using key_type               = Key;
    using mapped_type            = Value;
    using value_type             = std::pair<const key_type, mapped_type>;
    using size_type              = std::size_t;
    using difference_type        = std::ptrdiff_t;
    using key_compare            = Compare;
    using reference              = value_type&;
    using const_reference        = const value_type&;
    using pointer                = value_type*;
    using const_pointer          = const value_type*;
    using container_type         = Container;
    using iterator               = typename container_type::iterator;
    using const_iterator         = typename container_type::const_iterator;

    basic_map() {}
    basic_map(const basic_map& v) { operator=(v); }
    basic_map(basic_map&& v) noexcept { operator=(std::move(v)); }
    basic_map(const container_type& v) { operator=(v); }
    basic_map(container_type&& v) noexcept { operator=(std::move(v)); }

    template <class Iter, bool mapped = is_mapped_memory_v<container_type>, fc_require(!mapped), fc_require(is_iterator_v<Iter, value_type>)>
    basic_map(Iter first, Iter last)
    {
        insert(first, last);
    }
    template <bool mapped = is_mapped_memory_v<container_type>, fc_require(!mapped)>
    basic_map(std::initializer_list<value_type> list)
    {
        insert(list);
    }

    template<bool mapped = is_mapped_memory_v<container_type>, fc_require(mapped)>
    basic_map(void* data, size_t capacity, size_t size = 0)
        : data_(data, capacity, size)
    {
    }

    basic_map& operator=(const basic_map& v)
    {
        data_ = v.data_;
        return *this;
    }
    basic_map& operator=(basic_map&& v) noexcept
    {
        swap(v);
        return *this;
    }
    basic_map& operator=(const container_type& v)
    {
        data_ = v.data_;
        sort();
        return *this;
    }
    basic_map& operator=(container_type&& v) noexcept
    {
        swap(v);
        return *this;
    }

    void swap(basic_map& v) noexcept
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

    bool operator==(const basic_map& v) const noexcept { return data_ == v.data_; }
    bool operator!=(const basic_map& v) const noexcept { return data_ != v.data_; }

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

    // search
    iterator lower_bound(const key_type& v)
    {
        return std::lower_bound(begin(), end(), v, cmp_first<>());
    }
    const_iterator lower_bound(const key_type& v) const
    {
        return std::lower_bound(begin(), end(), v, cmp_first<>());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    iterator lower_bound(const V& v)
    {
        return std::lower_bound(begin(), end(), v, cmp_first<C>());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    const_iterator lower_bound(const V& v) const
    {
        return std::lower_bound(begin(), end(), v, cmp_first<C>());
    }

    iterator upper_bound(const key_type& v)
    {
        return std::upper_bound(begin(), end(), v, cmp_first<>());
    }
    const_iterator upper_bound(const key_type& v) const
    {
        return std::upper_bound(begin(), end(), v, cmp_first<>());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    iterator upper_bound(const V& v)
    {
        return std::upper_bound(begin(), end(), v, cmp_first<C>());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    const_iterator upper_bound(const V& v) const
    {
        return std::upper_bound(begin(), end(), v, cmp_first<C>());
    }

    std::pair<iterator, iterator> equal_range(const key_type& v)
    {
        return std::equal_range(begin(), end(), v, cmp_first<>());
    }
    std::pair<const_iterator, const_iterator> equal_range(const key_type& v) const
    {
        return std::equal_range(begin(), end(), v, cmp_first<>());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    std::pair<iterator, iterator> equal_range(const V& v)
    {
        return std::equal_range(begin(), end(), v, cmp_first<C>());
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    std::pair<const_iterator, const_iterator> equal_range(const V& v) const
    {
        return std::equal_range(begin(), end(), v, cmp_first<C>());
    }

    iterator find(const key_type& v)
    {
        auto it = lower_bound(v);
        return (it != end() && equal(it->first, v)) ? it : end();
    }
    const_iterator find(const key_type& v) const
    {
        auto it = lower_bound(v);
        return (it != end() && equal(it->first, v)) ? it : end();
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    iterator find(const V& v)
    {
        auto it = lower_bound<V, C>(v);
        return (it != end() && equal<key_type, V, C>(it->first, v)) ? it : end();
    }
    template <class V, class C = Compare, class = typename C::is_transparent>
    const_iterator find(const V& v) const
    {
        auto it = lower_bound<V, C>(v);
        return (it != end() && equal<key_type, V, C>(it->first, v)) ? it : end();
    }

    size_t count(const key_type& v) const
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
        auto it = lower_bound(v.first);
        if (it == end() || !equal(it->first, v.first)) {
            return { data_.insert(it, v), true };
        }
        else {
            return { it, false };
        }
    }
    std::pair<iterator, bool> insert(value_type&& v)
    {
        auto it = lower_bound(v.first);
        if (it == end() || !equal(it->first, v.first)) {
            return { data_.insert(it, std::move(v)), true };
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

    iterator erase(const key_type& v)
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

    mapped_type& at(const key_type& v)
    {
        if (auto it = find(v); it != end()) {
            return it->second;
        }
        else {
            throw std::out_of_range("flat_map::at()");
        }
    }
    const mapped_type& at(const key_type& v) const
    {
        if (auto it = find(v); it != end()) {
            return it->second;
        }
        else {
            throw std::out_of_range("flat_map::at()");
        }
    }

    mapped_type& operator[](const key_type& v)
    {
        if (auto it = find(v); it != end()) {
            return it->second;
        }
        else {
            return insert(value_type{ v, {} }).first->second;
        }
    }
    mapped_type& operator[](key_type&& v)
    {
        if (auto it = find(v); it != end()) {
            return it->second;
        }
        else {
            return insert(value_type{ v, {} }).first->second;
        }
    }


private:
    void sort()
    {
        std::sort(begin(), end(), [](auto& a, auto& b) { return key_compare()(a.first, b.first); });
    }

    template<class C = Compare>
    struct cmp_first
    {
        template<class T>
        bool operator()(const value_type& a, const T& b) const
        {
            return C()(a.first, b);
        }
    };

    static bool equal(const key_type& a, const key_type& b)
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

template<class K, class V, class Comp, class Cont1, class Cont2>
bool operator==(const basic_map<K, V, Comp, Cont1>& l, const basic_map<K, V, Comp, Cont2>& r)
{
    return l.size() == r.size() && std::equal(l.begin(), l.end(), r.begin());
}
template<class K, class V, class Comp, class Cont1, class Cont2>
bool operator!=(const basic_map<K, V, Comp, Cont1>& l, const basic_map<K, V, Comp, Cont2>& r)
{
    return l.size() != r.size() || !std::equal(l.begin(), l.end(), r.begin());
}
template<class K, class V, class Comp, class Cont1, class Cont2>
bool operator<(const basic_map<K, V, Comp, Cont1>& l, const basic_map<K, V, Comp, Cont2>& r)
{
    return std::lexicographical_compare(l.begin(), l.end(), r.begin(), r.end());
}
template<class K, class V, class Comp, class Cont1, class Cont2>
bool operator>(const basic_map<K, V, Comp, Cont1>& l, const basic_map<K, V, Comp, Cont2>& r)
{
    return r < l;
}
template<class K, class V, class Comp, class Cont1, class Cont2>
bool operator<=(const basic_map<K, V, Comp, Cont1>& l, const basic_map<K, V, Comp, Cont2>& r)
{
    return !(r < l);
}
template<class K, class V, class Comp, class Cont1, class Cont2>
bool operator>=(const basic_map<K, V, Comp, Cont1>& l, const basic_map<K, V, Comp, Cont2>& r)
{
    return !(l < r);
}


template <class Key, class Value, class Compare = std::less<>>
using flat_map = basic_map<Key, Value, Compare, std::vector<std::pair<Key, Value>, std::allocator<std::pair<Key, Value>>>>;

template <class Key, class Value, size_t Capacity, class Compare = std::less<>>
using fixed_map = basic_map<Key, Value, Compare, fixed_vector<std::pair<Key, Value>, Capacity>>;

template <class Key, class Value, size_t Capacity, class Compare = std::less<>>
using sbo_map = basic_map<Key, Value, Compare, sbo_vector<std::pair<Key, Value>, Capacity>>;

template <class Key, class Value, class Compare = std::less<>>
using mapped_map = basic_map<Key, Value, Compare, mapped_vector<std::pair<Key, Value>>>;

} // namespace ist


namespace std {

template<class K, class V, class Comp, class Cont>
void swap(ist::basic_map<K, V, Comp, Cont>& l, ist::basic_map<K, V, Comp, Cont>& r) noexcept
{
    l.swap(r);
}

} // namespace std
