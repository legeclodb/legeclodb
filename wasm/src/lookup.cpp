#include "lookup.h"
#include "util.h"

namespace ldb::lookup {

template<class T>
T& getTemporary()
{
    static thread_local T instance_;
    return instance_;
}

template<class T>
struct ScoreHolder
{
    float score = 0;
    T value {};

    bool operator<(const ScoreHolder& v) const { return score < v.score; }
};

template<class T, class ScoreFunc>
auto sortByScore(Span<T> span, ScoreFunc&& scoreF)
{
    auto& tmp = getTemporary<std::vector<ScoreHolder<T>>>();
    for (auto& obj : span) {
        tmp.push_back({ scoreF(obj), obj });
    }
    std::stable_sort(tmp.begin(), tmp.end());

    auto dst = span.data();
    for (auto& obj : tmp) {
        *dst++ = obj.value;
    }
    tmp.clear();
}

inline void eachSkill(Span<Skill*> skills, std::function<void(Skill&)>&& cb)
{
    for (auto s : skills)
        cb(*s);
}

inline void eachSkillEffect(Span<Skill*> skills, std::function<void(SkillEffect&, Skill&)>&& cb)
{
    for (auto s : skills) {
        for (auto e : s->effects_) {
            if (e.valueType_ == 0)
                break;
            cb(e, *s);
        }
    }
}



void LookupContext::test(em::val v)
{
    printf("GlobalContext::test()\n");

#ifdef _DEBUG
    {
        FixedBitSet<1024> fbs;
        for (int i = 0; i < 1024; ++i) {
            if (i % 2 == 0)
                fbs[i] = true;
        }
        for (int i = 0; i < 1024; ++i) {
            printf("%d ", (int)fbs[i]);
        }
        printf("\n");
    }

    {
        FixedVector<int, 32> fv;
        for (int i = 0; i < 16; ++i) {
            fv.push_back(i);
        }

        int tmp[4]{-1, -1, -1, -1};
        fv.insert(fv.begin() + 8, std::begin(tmp), std::end(tmp));
        for (auto& v : fv)
            printf("%d ", v);
        printf("\n");

        fv.erase(fv.begin() + 10, fv.begin() + 14);
        for (auto& v : fv)
            printf("%d ", v);
        printf("\n");
    }
    {
        printf("size of ResultHolder: %d\n", (int)sizeof(ResultHolder));
    }
    {
        struct Hoge { int data{}; };
        Hoge testData[5]{ {10}, {5}, {4}, {9}, {2} };
        Hoge* testPtr[5]{ &testData[0], &testData[1], &testData[2], &testData[3], &testData[4], };

        sortByScore(Span<Hoge*>(testPtr), [](Hoge* p){ return (float)p->data * 2; });
        printf("sortByScore: ");
        for (auto& v : testPtr)
            printf("%d ", v->data);
        printf("\n");
    }

    {
        struct Hoge
        {
            Hoge(int d = 0) : data_(d)
            {
                printf("Hoge(%d)\n", data_);
            }
            Hoge(const Hoge& v) noexcept
            {
                data_ = v.data_;
                printf("Hoge(const Hoge&) %d\n", data_);
            }
            Hoge(Hoge&& v) noexcept
            {
                data_ = v.data_;
                v.data_ = -v.data_;
                printf("Hoge(Hoge&&) %d\n", data_);
            }
            ~Hoge()
            {
                printf("~Hoge() %d\n", data_);
            }
            Hoge& operator=(const Hoge& v) noexcept
            {
                data_ = v.data_;
                printf("operator=(const Hoge&) %d\n", data_);
                return *this;
            }
            Hoge& operator=(Hoge&& v) noexcept {
                data_ = v.data_;
                v.data_ = -v.data_;
                printf("operator=(Hoge&&) %d\n", data_);
                return *this;
            }

            int data_ = 0;
        };

        {
            printf("erase test1\n");
            std::vector<Hoge> data;
            data.reserve(10);
            for (int i = 0; i < 4; ++i) {
                data.emplace_back(i);
            }
            printf("before insert\n");
            data.insert(data.begin() + 2, Hoge(10));
            printf("after insert\n");
        }
        {
            printf("erase test2\n");
            FixedVector<Hoge, 10> data;
            for (int i = 0; i < 4; ++i) {
                data.emplace_back(i);
            }
            printf("before insert\n");
            data.insert(data.begin() + 2, Hoge(10));
            printf("after insert\n");
        }


    }

    objectEach(v, [](em::val key, em::val val) {
        printf("%s: %d\n", key.as<std::string>().c_str(), val.as<int>());
        });
#endif // _DEBUG
}

void LookupContext::processEntity(Entity& dst, em::val& src)
{
    dst.js_ = src;
    dst.index_ = src["uid"].as<int>();
    entityTable_[dst.index_] = &dst;

    printf("%s\n", src["name"].as<std::string>().c_str());
}

void LookupContext::processSkill(Skill& dst, em::val& src)
{
    processEntity(dst, src);
}

void LookupContext::processMainChr(MainCharacter& dst, em::val& src)
{
    processEntity(dst, src);
}

void LookupContext::processSupChr(SupportCharacter& dst, em::val& src)
{
    processEntity(dst, src);
}

void LookupContext::processItem(Item& dst, em::val& src)
{
    processEntity(dst, src);
}

void LookupContext::setup(em::val data)
{
    em::val mainChrs = data["mainChrs"];
    em::val mainActive = data["mainActive"];
    em::val mainPassive = data["mainPassive"];
    em::val mainTalent = data["mainTalents"];

    em::val supChrs = data["supChrs"];
    em::val supActive = data["supActive"];
    em::val supPassive = data["supPassive"];

    em::val items = data["items"];

    mainChrs_.resize(arrayLength(mainActive));
    supChrs_.resize(arrayLength(supChrs));
    items_.resize(arrayLength(items));
    skills_.resize(arrayLength(mainActive) + arrayLength(mainPassive) + arrayLength(mainTalent) + arrayLength(supActive) + arrayLength(supPassive));
    entityTable_.resize(1 + mainChrs_.size() + supChrs_.size() + items_.size() + skills_.size());

    {
        auto* dst = &skills_[0];
        arrayEach(mainActive, [&](em::val src) { processSkill(*dst++, src); });
        arrayEach(mainPassive, [&](em::val src) { processSkill(*dst++, src); });
        arrayEach(mainTalent, [&](em::val src) { processSkill(*dst++, src); });
        arrayEach(supActive, [&](em::val src) { processSkill(*dst++, src); });
        arrayEach(supPassive, [&](em::val src) { processSkill(*dst++, src); });
    }
    {
        auto* dst = &mainChrs_[0];
        arrayEach(mainChrs, [&](em::val src) { processMainChr(*dst++, src); });
    }
    {
        auto* dst = &supChrs_[0];
        arrayEach(supChrs, [&](em::val src) { processSupChr(*dst++, src); });
    }
    {
        auto* dst = &items_[0];
        arrayEach(items, [&](em::val src) { processItem(*dst++, src); });
    }
}

em::val LookupContext::beginSearch(em::val option)
{
    return {};
}

} // namespace ldb::lookup


EMSCRIPTEN_BINDINGS(ldb_lookup)
{
    namespace ll = ldb::lookup;
    emscripten::class_<ll::LookupContext>("LookupContext")
        .constructor<>()
        .function("setup", &ll::LookupContext::setup)
        .function("beginSearch", &ll::LookupContext::beginSearch)
        .function("test", &ll::LookupContext::test);
}
