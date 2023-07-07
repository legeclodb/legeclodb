#pragma once
#include "vector_base.h"

namespace ist {

template<class T, class Memory>
class basic_vector : public vector_base<Memory>
{
using super = vector_base<Memory>;
public:
    using typename super::value_type;
    using typename super::pointer;
    using typename super::const_pointer;
    using typename super::reference;
    using typename super::const_reference;
    using typename super::iterator;
    using typename super::const_iterator;

    constexpr basic_vector() = default;
    constexpr basic_vector(const basic_vector& r) = default;
    constexpr basic_vector(basic_vector&& r) noexcept = default;
    constexpr basic_vector& operator=(const basic_vector& r) = default;
    constexpr basic_vector& operator=(basic_vector&& r) noexcept = default;

    template<bool mapped = is_mapped_memory_v<super>, fc_require(!mapped)>
    constexpr explicit basic_vector(size_t n) { resize(n); }

    template<bool mapped = is_mapped_memory_v<super>, fc_require(!mapped)>
    constexpr basic_vector(size_t n, const_reference v) { resize(n, v); }

    template<bool mapped = is_mapped_memory_v<super>, fc_require(!mapped)>
    constexpr basic_vector(std::initializer_list<value_type> r) { assign(r); }

    template<class Iter, bool mapped = is_mapped_memory_v<super>, fc_require(!mapped), fc_require(is_iterator_v<Iter, value_type>)>
    constexpr basic_vector(Iter first, Iter last) { assign(first, last); }

    template<bool mapped = is_mapped_memory_v<super>, fc_require(mapped)>
    constexpr basic_vector(void* data, size_t capacity, size_t size = 0)
        : super(data, capacity, size)
    {
    }

    using super::capacity;
    using super::size;
    using super::size_bytes;
    using super::data;
    using super::reserve;
    using super::shrink_to_fit;
    using super::clear;

    using super::empty;
    using super::begin;
    using super::cbegin;
    using super::end;
    using super::cend;
    using super::at;
    using super::operator[];
    using super::front;
    using super::back;

    constexpr void resize(size_t n)
    {
        _resize(n, [&](pointer addr) { _construct_at(addr); });
    }
    constexpr void resize(size_t n, const_reference v)
    {
        _resize(n, [&](pointer addr) { _construct_at(addr, v); });
    }

    constexpr void push_back(const_reference v)
    {
        _expand(1, [&](pointer addr) { _construct_at(addr, v); });
    }
    constexpr void push_back(value_type&& v)
    {
        _expand(1, [&](pointer addr) { _construct_at(addr, std::move(v)); });
    }

    template< class... Args >
    constexpr reference emplace_back(Args&&... args)
    {
        _expand(1, [&](pointer addr) { _construct_at(addr, std::forward<Args>(args)...); });
        return back();
    }

    constexpr void pop_back()
    {
        _shrink(1);
    }

    template<class Iter, fc_require(is_iterator_v<Iter, value_type>)>
    constexpr void assign(Iter first, Iter last)
    {
        size_t n = std::distance(first, last);
        _assign(n, [&](pointer dst) { _copy_range(dst, first, last); });
    }
    constexpr void assign(std::initializer_list<value_type> list)
    {
        _assign(list.size(), [&](pointer dst) { _copy_range(dst, list.begin(), list.end()); });
    }
    constexpr void assign(size_t n, const_reference v)
    {
        _assign(n, [&](pointer dst) { _copy_n(dst, v, n); });
    }

    template<class Iter, fc_require(is_iterator_v<Iter, value_type>)>
    constexpr iterator insert(iterator pos, Iter first, Iter last)
    {
        size_t n = std::distance(first, last);
        return _insert(pos, n, [&](pointer addr) { _copy_range(addr, first, last); });
    }
    constexpr iterator insert(iterator pos, std::initializer_list<value_type> list)
    {
        return _insert(pos, list.size(), [&](pointer addr) { _copy_range(addr, list.begin(), list.end()); });
    }
    constexpr iterator insert(iterator pos, const_reference v)
    {
        return _insert(pos, 1, [&](pointer addr) { _copy_n(addr, v, 1); });
    }
    constexpr iterator insert(iterator pos, value_type&& v)
    {
        return _insert(pos, 1, [&](pointer addr) { _move_one(addr, std::move(v)); });
    }
    template< class... Args >
    constexpr iterator emplace(iterator pos, Args&&... args)
    {
        return _insert(pos, 1, [&](pointer addr) { _emplace_one(addr, std::forward<Args>(args)...); });
    }

    constexpr iterator erase(iterator first, iterator last)
    {
        size_t s = std::distance(first, last);
        std::move(last, end(), first);
        _shrink(s);
        return first;
    }
    constexpr iterator erase(iterator pos)
    {
        return erase(pos, pos + 1);
    }

protected:
    using super::_copy_range;
    using super::_copy_n;
    using super::_move_range;
    using super::_move_one;
    using super::_emplace_one;

    using super::_shrink;
    using super::_expand;
    using super::_resize;
    using super::_insert;
    using super::_assign;
};

template<class T, class M1, class M2>
inline bool operator==(const basic_vector<T, M1>& l, const basic_vector<T, M2>& r)
{
    return l.size() == r.size() && std::equal(l.begin(), l.end(), r.begin());
}
template<class T, class M1, class M2>
inline bool operator!=(const basic_vector<T, M1>& l, const basic_vector<T, M2>& r)
{
    return l.size() != r.size() || !std::equal(l.begin(), l.end(), r.begin());
}
template<class T, class M1, class M2>
inline bool operator<(const basic_vector<T, M1>& l, const basic_vector<T, M2>& r)
{
    return std::lexicographical_compare(l.begin(), l.end(), r.begin(), r.end());
}
template<class T, class M1, class M2>
inline bool operator>(const basic_vector<T, M1>& l, const basic_vector<T, M2>& r)
{
    return r < l;
}
template<class T, class M1, class M2>
inline bool operator<=(const basic_vector<T, M1>& l, const basic_vector<T, M2>& r)
{
    return !(r < l);
}
template<class T, class M1, class M2>
inline bool operator>=(const basic_vector<T, M1>& l, const basic_vector<T, M2>& r)
{
    return !(l < r);
}


template<class T>
using vector = basic_vector<T, dynamic_memory<T>>;

template<class T, size_t Capacity>
using fixed_vector = basic_vector<T, fixed_memory<T, Capacity>>;

template<class T, size_t Capacity>
using sbo_vector = basic_vector<T, sbo_memory<T, Capacity>>;

template<class T>
using mapped_vector = basic_vector<T, mapped_memory<T>>;

} // namespace ist


namespace std {

template<class T, class M>
void swap(ist::basic_vector<T, M>& l, ist::basic_vector<T, M>& r) noexcept
{
    l.swap(r);
}

} // namespace std
