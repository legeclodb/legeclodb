#pragma once
#include <string>
#include <string_view>
#include <charconv>
#include <iterator>
#include "vector_base.h"

namespace ist {

template<class T, class = void>
constexpr bool is_from_chars_available_v = false;
template<class T>
constexpr bool is_from_chars_available_v<T, std::void_t<decltype(std::from_chars((const char*)nullptr, (const char*)nullptr, std::declval<T&>()))>> = true;

template<class Container, class Char, class = void>
constexpr bool is_string_like_v = false;
template<class Container, class Char>
constexpr bool is_string_like_v<Container, Char, std::enable_if_t<
    std::is_same_v<std::decay_t<decltype(*std::declval<Container>().data())>, Char>>> = true;


template<class T, class Memory, class Traits = std::char_traits<T>>
class basic_string : public vector_base<Memory>
{
using super = vector_base<Memory>;
public:
    using traits_type = Traits;
    using typename super::value_type;
    using typename super::pointer;
    using typename super::const_pointer;
    using typename super::reference;
    using typename super::const_reference;
    using typename super::iterator;
    using typename super::const_iterator;

    static const size_t npos = ~0;

    constexpr basic_string()
    {
        if (capacity() != 0) {
            _null_terminate();
        }
    }
    basic_string(const basic_string& r) { operator=(r); }
    basic_string(basic_string&& r) noexcept { operator=(std::move(r)); }

    template<bool mapped = is_mapped_memory_v<super>, fc_require(!mapped)>
    constexpr basic_string(size_t n, value_type ch) { assign(n, ch); }

    template<bool mapped = is_mapped_memory_v<super>, fc_require(!mapped)>
    constexpr basic_string(const_pointer v) { assign(v); }
    template<bool mapped = is_mapped_memory_v<super>, fc_require(!mapped)>
    constexpr basic_string(const_pointer v, size_t n) { assign(v, n); }

    template<bool mapped = is_mapped_memory_v<super>, fc_require(!mapped)>
    constexpr basic_string(std::initializer_list<value_type> r) { assign(r); }

    template<class Iter, bool mapped = is_mapped_memory_v<super>, fc_require(!mapped), fc_require(is_iterator_v<Iter, value_type>)>
    constexpr basic_string(Iter first, Iter last) { assign(first, last); }

    template<class String, bool mapped = is_mapped_memory_v<super>, fc_require(!mapped), fc_require(is_string_like_v<String, value_type>)>
    constexpr basic_string(const String& str) { assign(str); }

    template<bool mapped = is_mapped_memory_v<super>, fc_require(mapped)>
    constexpr basic_string(void* data, size_t capacity, size_t size = 0)
        : super(data, capacity, size)
        , basic_string()
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

    constexpr const_pointer c_str() const { return data(); }
    constexpr size_t length() const { return size(); }

    constexpr basic_string& operator=(const basic_string& r)
    {
        return assign(r);
    }
    constexpr basic_string& operator=(basic_string&& r) noexcept
    {
        swap(r);
        return *this;
    }

    constexpr void resize(size_t n)
    {
        _resize(n, [&](pointer) {}); // new elements are uninitialized
        _null_terminate();
    }
    constexpr void resize(size_t n, value_type v)
    {
        _resize(n, [&](pointer addr) { *addr = v; });
        _null_terminate();
    }

    constexpr void push_back(const_reference v)
    {
        _expand(1, [&](pointer addr) { *addr = v; });
        _null_terminate();
    }

    constexpr void pop_back()
    {
        _shrink(1);
        _null_terminate();
    }


    // assign

    constexpr basic_string& assign(const_pointer str, size_t n)
    {
        _assign(n, [&](pointer dst) { _copy_range(dst, str, str + n); });
        _null_terminate();
        return *this;
    }
    constexpr basic_string& assign(const_pointer str)
    {
        return assign(str, Traits::length(str));
    }
    constexpr basic_string& assign(size_t n, value_type ch)
    {
        _assign(n, [&](pointer dst) { _copy_n(dst, ch, n); });
        _null_terminate();
        return *this;
    }
    constexpr basic_string& assign(std::initializer_list<value_type> list)
    {
        _assign(list.size(), [&](pointer dst) { _copy_range(dst, list.begin(), list.end()); });
        _null_terminate();
        return *this;
    }
    template<class Iter, fc_require(is_iterator_v<Iter, value_type>)>
    constexpr basic_string& assign(Iter first, Iter last)
    {
        size_t n = std::distance(first, last);
        _assign(n, [&](pointer dst) { _copy_range(dst, first, last); });
        _null_terminate();
        return *this;
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr basic_string& assign(const String& str, size_t offset, size_t count = npos)
    {
        size_t n = count == npos ? str.size() - offset : count;
        auto first = str.begin() + offset;
        auto last = str.begin() + offset + n;
        return assign(first, last);
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr basic_string& assign(const String& str)
    {
        return assign(str, 0, npos);
    }


    // insert

    constexpr iterator insert(iterator pos, pointer str, size_t n)
    {
        auto r = _insert(pos, n, [&](pointer addr) { _copy_range(addr, str, str + n); });
        _null_terminate();
        return r;
    }
    constexpr iterator insert(iterator pos, pointer str)
    {
        return insert(pos, str, Traits::length(str));
    }
    constexpr iterator insert(iterator pos, value_type ch)
    {
        return insert(pos, &ch, 1);
    }
    constexpr iterator insert(iterator pos, size_t n, value_type v)
    {
        auto r = _insert(pos, n, [&](pointer addr) { _copy_n(addr, v, n); });
        _null_terminate();
        return r;
    }
    template<class Iter, fc_require(is_iterator_v<Iter, value_type>)>
    constexpr iterator insert(iterator pos, Iter first, Iter last)
    {
        size_t n = std::distance(first, last);
        auto r = _insert(pos, n, [&](pointer addr) { _copy_range(addr, first, last); });
        _null_terminate();
        return r;
    }
    constexpr iterator insert(iterator pos, std::initializer_list<value_type> list)
    {
        auto r = _insert(pos, list.size(), [&](pointer addr) { _copy_range(addr, list.begin(), list.end()); });
        _null_terminate();
        return r;
    }

    constexpr basic_string& insert(size_t pos, const_pointer str, size_t offset, size_t count = npos)
    {
        size_t n = count == npos ? Traits::length(str) - offset : count;
        auto first = str;
        auto last = str + n;
        _insert(begin() + pos, n, [&](pointer addr) { _copy_range(addr, first, last); });
        _null_terminate();
        return *this;
    }
    constexpr basic_string& insert(size_t pos, const_pointer str)
    {
        return insert(pos, str, 0, Traits::length(str));
    }
    constexpr basic_string& insert(size_t pos, size_t count, value_type ch)
    {
        return insert(pos, &ch, 0, 1);
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr basic_string& insert(size_t pos, const String& str, size_t offset, size_t count = npos)
    {
        size_t n = count == npos ? str.size() - offset : count;
        auto first = str.begin() + offset;
        auto last = str.begin() + offset + n;
        insert(begin() + pos, first, last);
        return *this;
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr basic_string& insert(size_t pos, const String& str)
    {
        return insert(pos, str, 0, npos);
    }


    // append

    constexpr basic_string& append(const_pointer str, size_t count)
    {
        return insert(size(), str, 0, count);
    }
    constexpr basic_string& append(const_pointer str)
    {
        return insert(size(), str);
    }
    constexpr basic_string& append(value_type ch)
    {
        return insert(size(), 1, ch);
    }
    template<class Iter, fc_require(is_iterator_v<Iter, value_type>)>
    constexpr basic_string& append(Iter first, Iter last)
    {
        insert(end(), first, last);
        return *this;
    }
    constexpr basic_string& append(std::initializer_list<value_type> list)
    {
        insert(end(), list.begin(), list.end());
        return *this;
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr basic_string& append(const String& str)
    {
        return insert(size(), str);
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr basic_string& append(const String& str, size_t offset, size_t count = npos)
    {
        return insert(size(), str, offset, count);
    }

    constexpr basic_string& operator+=(value_type ch) { return append(ch); }
    constexpr basic_string& operator+=(const_pointer str) { return append(str); }
    constexpr basic_string& operator+=(std::initializer_list<value_type> list) { return append(list); }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr basic_string& operator+=(const String& str) { return append(str); }


    // erase

    constexpr iterator erase(iterator first, iterator last)
    {
        _copy_range(first, last, end());
        _shrink(std::distance(first, last));
        _null_terminate();
        return first;
    }
    constexpr iterator erase(iterator pos)
    {
        return erase(pos, pos + 1);
    }
    constexpr basic_string& erase(size_t offset = 0, size_t count = npos)
    {
        size_t n = count == npos ? size() - offset : count;
        auto first = begin() + offset;
        auto last = begin() + offset + n;
        erase(first, last);
        return *this;
    }


    // replace

    template<class Iter, fc_require(is_iterator_v<Iter, value_type>)>
    constexpr basic_string& replace(iterator first, iterator last, Iter first2, Iter last2)
    {
        size_t count = std::distance(first2, last2);
        return _replace(first, last, count, [&](pointer addr) { _copy_range(addr, first2, last2); });
    }
    constexpr basic_string& replace(iterator first, iterator last, const_pointer str, size_t count)
    {
        return replace(first, last, str, str + count);
    }
    constexpr basic_string& replace(iterator first, iterator last, const_pointer str)
    {
        return replace(first, last, str, str + Traits::length(str));
    }
    constexpr basic_string& replace(iterator first, iterator last, size_t count, value_type ch)
    {
        return _replace(first, last, count, [&](pointer addr) { _copy_n(addr, ch, count); });
    }

    constexpr basic_string& replace(size_t pos, size_t count, const_pointer str, size_t count2)
    {
        auto first = begin() + pos;
        auto last = begin() + pos + count;
        return replace(first, last, str, str + count2);
    }
    constexpr basic_string& replace(size_t pos, size_t count, const_pointer str)
    {
        return replace(pos, count, str, Traits::length(str));
    }
    constexpr basic_string& replace(size_t pos, size_t count, std::initializer_list<value_type> list)
    {
        auto first = begin() + pos;
        auto last = begin() + pos + count;
        return replace(first, last, list.begin(), list.end());
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr basic_string& replace(size_t pos, size_t count, const String& str, size_t pos2, size_t count2 = npos)
    {
        auto first = begin() + pos;
        auto last = begin() + pos + count;
        size_t n = count2 == npos ? str.size() - pos2 : count2;
        auto first2 = str.begin() + pos2;
        auto last2 = str.begin() + pos2 + n;
        return replace(first, last, first2, last2);
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr basic_string& replace(size_t pos, size_t count, const String& str)
    {
        return replace(pos, count, str, 0, str.size());
    }


    // find

    constexpr size_t find(const_pointer str, size_t pos, size_t count) const noexcept
    {
        return _find_str(str, count, pos);
    }
    constexpr size_t find(const_pointer str, size_t pos = 0) const noexcept
    {
        return _find_str(str, Traits::length(str), pos);
    }
    constexpr size_t find(value_type ch, size_t pos = 0) const noexcept
    {
        return _find_ch(ch, pos);
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr size_t find(const String& str, size_t pos = 0) const noexcept
    {
        return _find_str(str.data(), str.size(), pos);
    }


    // starts_with

    constexpr bool starts_with(value_type ch) const noexcept
    {
        return size() >= 1 && Traits::compare(data(), &ch, 1) == 0;
    }
    constexpr bool starts_with(const_pointer str) const noexcept
    {
        size_t n = Traits::length(str);
        return size() >= n && Traits::compare(data(), str, n) == 0;
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr bool starts_with(const String& str) const noexcept
    {
        size_t n = str.size();
        return size() >= n && Traits::compare(data(), str.data(), n) == 0;
    }


    // ends_with

    constexpr bool ends_with(value_type ch) const noexcept
    {
        return size() >= 1 && Traits::compare(data() + size() - 1, &ch, 1) == 0;
    }
    constexpr bool ends_with(const_pointer str) const noexcept
    {
        size_t n = Traits::length(str);
        return size() >= n && Traits::compare(data() + size() - n, str, n) == 0;
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr bool ends_with(const String& str) const noexcept
    {
        size_t n = str.size();
        return size() >= n && Traits::compare(data() + size() - n, str.data(), n) == 0;
    }


    // compare

    constexpr int compare(size_t pos1, size_t count1, const_pointer str, size_t pos2, size_t count2) const noexcept
    {
        return Traits::compare(data() + pos1, str + pos2, std::min(count1, count2));
    }
    constexpr int compare(size_t pos1, size_t count1, const_pointer str) const noexcept
    {
        return compare(pos1, count1, str, 0, Traits::length(str));
    }
    constexpr int compare(const_pointer str) const noexcept
    {
        return compare(0, size(), str, 0, Traits::length(str));
    }

    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr int compare(size_t pos1, size_t count1, const String& str, size_t pos2, size_t count2 = npos) const noexcept
    {
        count2 = count2 == npos ? str.size() - pos2 : count2;
        return compare(pos1, count1, str.data(), pos2, count2);
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr int compare(size_t pos1, size_t count1, const String& str) const noexcept
    {
        return compare(pos1, count1, str, 0, str.size());
    }
    template<class String, fc_require(is_string_like_v<String, value_type>)>
    constexpr int compare(const String& str) const noexcept
    {
        return compare(0, size(), str, 0, str.size());
    }


    // substr

    constexpr basic_string substr(size_t pos = 0, size_t count = npos) const
    {
        count = count == npos ? size() - pos : count;
        return basic_string{ data() + pos, count };
    }


    // copy

    constexpr size_t copy(pointer dest, size_t count, size_t pos = 0)
    {
        count = count == npos ? size() - pos : count;
        Traits::copy(dest, data() + pos, count);
        return count;
    }


    // std::string_view

    constexpr operator std::basic_string_view<value_type, Traits>() const noexcept
    {
        return { data(), size() };
    }

public:
    template<class Number, fc_require(std::is_integral_v<Number>)>
    inline Number to_number(size_t* idx, int base) const
    {
        auto first = begin();
        auto last = end();
        while (std::isspace(*first)) {
            ++first;
        }

        Number tmp;
        auto res = std::from_chars(first, last, tmp, base);
        if (res.ec == std::errc{}) {
            if (idx) {
                *idx = std::distance(begin(), res.ptr);
            }
            return tmp;
        }
        else {
            throw std::invalid_argument("to_number()");
            return {};
        }
    }

    template<class Number, fc_require(std::is_floating_point_v<Number>)>
    inline Number to_number(size_t* idx) const
    {
        auto first = begin();
        auto last = end();
        while (std::isspace(*first)) {
            ++first;
        }

        // note: std::from_chars with floating point types are not implementen on emscripten (as of 2023/07).
        // in that case, fallback to std::atof(). so, 0.0 is returned on error instead of throwing std::invalid_argument.
        if constexpr (is_from_chars_available_v<Number>) {
            Number tmp;
            auto res = std::from_chars(first, last, tmp);
            if (res.ec == std::errc{}) {
                if (idx) {
                    *idx = std::distance(begin(), res.ptr);
                }
                return tmp;
            }
            else {
                throw std::invalid_argument("to_number()");
                return {};
            }
        }
        else {
            return std::atof(first);
        }
    }

    constexpr size_t hash() const
    {
        return _hash(data(), size_bytes());
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

    constexpr void _null_terminate()
    {
        reserve(size() + 1);
        data()[size()] = 0;
    }

    constexpr size_t _find_ch(value_type ch, size_t offset) const noexcept
    {
        const_pointer str1 = data();
        const size_t size1 = size();
        if (offset < size1) {
            const auto found = Traits::find(str1 + offset, size1 - offset, ch);
            if (found) {
                return static_cast<size_t>(found - str1);
            }
        }
        return static_cast<size_t>(-1);
    }
    constexpr size_t _find_str(const_pointer str2, size_t size2, size_t offset) const noexcept
    {
        const_pointer str1 = data();
        const size_t size1 = size();
        if (size2 > size1 || offset > size1 - size2) {
            return static_cast<size_t>(-1);
        }
        if (size2 == 0) {
            return offset;
        }

        const auto end = str1 + (size1 - size2) + 1;
        for (auto s = str1 + offset;; ++s) {
            s = Traits::find(s, static_cast<size_t>(end - s), *str2);
            if (!s) {
                return static_cast<size_t>(-1);
            }
            if (Traits::compare(s, str2, size2) == 0) {
                return static_cast<size_t>(s - str1);
            }
        }
    }

    template<class Copy>
    constexpr basic_string& _replace(iterator first, iterator last, size_t n, Copy&& do_copy)
    {
        size_t d = std::distance(begin(), first);
        size_t del_count = std::distance(first, last);
        if (del_count > n) {
            erase(first, first + (del_count - n));
        }
        else if (del_count < n) {
            insert(first, n - del_count, value_type(0));
        }
        // data_ changes if insert() causes allocation. in that case, first is no longer valid.
        do_copy(begin() + d);
        return *this;
    }

    static inline size_t _hash(const void* _data, size_t size)
    {
        constexpr size_t _basis = size_t(14695981039346656037U);
        constexpr size_t _prime = size_t(1099511628211U);
        auto data = (const std::byte*)_data;
        size_t v = _basis;
        for (size_t i = 0; i < size; ++i) {
            v ^= static_cast<size_t>(data[i]);
            v *= _prime;
        }
        return v;
    }
};


// operator +

template<class T, class M, class Tr>
inline basic_string<T, M, Tr> operator+(const basic_string<T, M, Tr>& l, T r)
{
    basic_string<T, M, Tr> tmp{l};
    tmp += r;
    return tmp;
}
template<class T, class M, class Tr>
inline basic_string<T, M, Tr> operator+(T l, const basic_string<T, M, Tr>& r)
{
    return basic_string<T, M, Tr>{l} + r;
}

template<class T, class M, class Tr>
inline basic_string<T, M, Tr> operator+(const basic_string<T, M, Tr>& l, const T* r)
{
    basic_string<T, M, Tr> tmp{l};
    tmp += r;
    return tmp;
}
template<class T, class M, class Tr>
inline basic_string<T, M, Tr> operator+(const T* l, const basic_string<T, M, Tr>& r)
{
    return basic_string<T, M, Tr>{l} + r;
}

template<class T, class M, class Tr, class String, fc_require(is_string_like_v<String, T>)>
inline basic_string<T, M, Tr> operator+(const basic_string<T, M, Tr>& l, const String& r)
{
    basic_string<T, M, Tr> tmp{l};
    tmp += r;
    return tmp;
}
template<class T, class M, class Tr, class String, fc_require(is_string_like_v<String, T>)>
inline basic_string<T, M, Tr> operator+(const String& l, const basic_string<T, M, Tr>& r)
{
    return basic_string<T, M, Tr>{l} + r;
}

template<class T, class M, class Tr>
inline basic_string<T, M, Tr> operator+(basic_string<T, M, Tr>&& l, T r)
{
    l += r;
    return l;
}
template<class T, class M, class Tr>
inline basic_string<T, M, Tr> operator+(basic_string<T, M, Tr>&& l, const T* r)
{
    l += r;
    return l;
}
template<class T, class M, class Tr, class String, fc_require(is_string_like_v<String, T>)>
inline basic_string<T, M, Tr> operator+(basic_string<T, M, Tr>&& l, const String& r)
{
    l += r;
    return l;
}


// operator ==, !=, <, <=, >, >=

template<class T, class M1, class M2, class Tr>
inline bool operator==(const basic_string<T, M1, Tr>& l, const basic_string<T, M2, Tr>& r)
{
    return l.compare(r) == 0;
}
template<class T, class M1, class M2, class Tr>
inline bool operator!=(const basic_string<T, M1, Tr>& l, const basic_string<T, M2, Tr>& r)
{
    return l.compare(r) != 0;
}
template<class T, class M1, class M2, class Tr>
inline bool operator<(const basic_string<T, M1, Tr>& l, const basic_string<T, M2, Tr>& r)
{
    return l.compare(r) < 0;
}
template<class T, class M1, class M2, class Tr>
inline bool operator>(const basic_string<T, M1, Tr>& l, const basic_string<T, M2, Tr>& r)
{
    return r < l;
}
template<class T, class M1, class M2, class Tr>
inline bool operator<=(const basic_string<T, M1, Tr>& l, const basic_string<T, M2, Tr>& r)
{
    return !(r < l);
}
template<class T, class M1, class M2, class Tr>
inline bool operator>=(const basic_string<T, M1, Tr>& l, const basic_string<T, M2, Tr>& r)
{
    return !(l < r);
}

template<class T, class M, class Tr>
inline bool operator==(const basic_string<T, M, Tr>& l, const T* r)
{
    return l.compare(r) == 0;
}
template<class T, class M, class Tr>
inline bool operator!=(const basic_string<T, M, Tr>& l, const T* r)
{
    return l.compare(r) != 0;
}
template<class T, class M, class Tr>
inline bool operator<(const basic_string<T, M, Tr>& l, const T* r)
{
    return l.compare(r) < 0;
}
template<class T, class M, class Tr>
inline bool operator>(const basic_string<T, M, Tr>& l, const T* r)
{
    return r < l;
}
template<class T, class M, class Tr>
inline bool operator<=(const basic_string<T, M, Tr>& l, const T* r)
{
    return !(r < l);
}
template<class T, class M, class Tr>
inline bool operator>=(const basic_string<T, M, Tr>& l, const T* r)
{
    return !(l < r);
}

template<class T, class M, class Tr>
inline bool operator==(const T* l, const basic_string<T, M, Tr>& r)
{
    return r.compare(l) == 0;
}
template<class T, class M, class Tr>
inline bool operator!=(const T* l, const basic_string<T, M, Tr>& r)
{
    return r.compare(l) != 0;
}
template<class T, class M, class Tr>
inline bool operator<(const T* l, const basic_string<T, M, Tr>& r)
{
    return r.compare(l) > 0;
}
template<class T, class M, class Tr>
inline bool operator>(const T* l, const basic_string<T, M, Tr>& r)
{
    return r < l;
}
template<class T, class M, class Tr>
inline bool operator<=(const T* l, const basic_string<T, M, Tr>& r)
{
    return !(r < l);
}
template<class T, class M, class Tr>
inline bool operator>=(const T* l, const basic_string<T, M, Tr>& r)
{
    return !(l < r);
}


using string = basic_string<char, dynamic_memory<char>, std::char_traits<char>>;
using wstring = basic_string<wchar_t, dynamic_memory<wchar_t>, std::char_traits<wchar_t>>;
using u16string = basic_string<char16_t, dynamic_memory<char16_t>, std::char_traits<char16_t>>;
using u32string = basic_string<char32_t, dynamic_memory<char32_t>, std::char_traits<char32_t>>;

template<size_t Capacity> using fixed_string = basic_string<char, fixed_memory<char, Capacity>, std::char_traits<char>>;
template<size_t Capacity> using fixed_wstring = basic_string<wchar_t, fixed_memory<wchar_t, Capacity>, std::char_traits<wchar_t>>;
template<size_t Capacity> using fixed_u16string = basic_string<char16_t, fixed_memory<char16_t, Capacity>, std::char_traits<char16_t>>;
template<size_t Capacity> using fixed_u32string = basic_string<char32_t, fixed_memory<char, Capacity>, std::char_traits<char>>;

template<size_t Capacity> using sbo_string = basic_string<char, sbo_memory<char, Capacity>, std::char_traits<char>>;
template<size_t Capacity> using sbo_wstring = basic_string<wchar_t, sbo_memory<wchar_t, Capacity>, std::char_traits<wchar_t>>;
template<size_t Capacity> using sbo_u16string = basic_string<char16_t, sbo_memory<char16_t, Capacity>, std::char_traits<char16_t>>;
template<size_t Capacity> using sbo_u32string = basic_string<char32_t, sbo_memory<char32_t, Capacity>, std::char_traits<char32_t>>;

using mapped_string_view = basic_string<char, mapped_memory<char>, std::char_traits<char>>;
using mapped_wstring_view = basic_string<wchar_t, mapped_memory<wchar_t>, std::char_traits<wchar_t>>;
using mapped_u16string_view = basic_string<char16_t, mapped_memory<char16_t>, std::char_traits<char16_t>>;
using mapped_u32string_view = basic_string<char32_t, mapped_memory<char32_t>, std::char_traits<char32_t>>;

#if __cpp_char8_t
using u8string = basic_string<char8_t, dynamic_memory<char8_t>, std::char_traits<char8_t>>;
template<size_t Capacity> using fixed_u8string = basic_string<char8_t, fixed_memory<char, Capacity>, std::char_traits<char8_t>>;
template<size_t Capacity> using sbo_u8string = basic_string<char8_t, sbo_memory<char8_t, Capacity>, std::char_traits<char8_t>>;
using mapped_u8string = basic_string<char8_t, mapped_memory<char32_t>, std::char_traits<char8_t>>;
#endif // __cpp_char8_t

} // namespace ist


namespace std {

template<class T, class M, class Traits>
void swap(ist::basic_string<T, M, Traits>& l, ist::basic_string<T, M, Traits>& r) noexcept
{
    l.swap(r);
}

template<class T, class M, class Traits>
int stoi(ist::basic_string<T, M, Traits>& v, size_t* pos = nullptr, int base = 10) { return v.template to_number<int>(pos, base); }
template<class T, class M, class Traits>
long stol(ist::basic_string<T, M, Traits>& v, size_t* pos = nullptr, int base = 10) { return v.template to_number<long>(pos, base); }
template<class T, class M, class Traits>
long long stoll(ist::basic_string<T, M, Traits>& v, size_t* pos = nullptr, int base = 10) { return v.template to_number<long long>(pos, base); }
template<class T, class M, class Traits>
unsigned long stoul(ist::basic_string<T, M, Traits>& v, size_t* pos = nullptr, int base = 10) { return v.template to_number<unsigned long>(pos, base); }
template<class T, class M, class Traits>
unsigned long long stoull(ist::basic_string<T, M, Traits>& v, size_t* pos = nullptr, int base = 10) { return v.template to_number<unsigned long long>(pos, base); }
template<class T, class M, class Traits>
float stof(ist::basic_string<T, M, Traits>& v, size_t* pos = nullptr) { return v.template to_number<float>(pos); }
template<class T, class M, class Traits>
double stod(ist::basic_string<T, M, Traits>& v, size_t* pos = nullptr) { return v.template to_number<double>(pos); }
template<class T, class M, class Traits>
long double stold(ist::basic_string<T, M, Traits>& v, size_t* pos = nullptr) { return v.template to_number<long double>(pos); }

template<class T, class M, class Traits>
struct hash<ist::basic_string<T, M, Traits>>
{
    size_t operator()(const ist::basic_string<T, M, Traits>& r) const noexcept {
        return r.hash();
    }
};

} // namespace std
