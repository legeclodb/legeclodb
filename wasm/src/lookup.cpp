#include "lookup.h"
#include "util.h"

namespace ldb::lookup {

inline void eachSkillImpl(std::span<Skill*> skills, std::function<void(Skill&)>&& cb)
{
    for (auto s : skills)
        cb(*s);
}

inline void eachSkillEffectImpl(std::span<Skill*> skills, std::function<void(SkillEffect&, Skill&)>&& cb)
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

    objectEach(v, [](em::val key, em::val val) {
        printf("%s: %d\n", key.as<std::string>().c_str(), val.as<int>());
        });
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

void LookupContext::setData(em::val data)
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
        .function("setData", &ll::LookupContext::setData)
        .function("beginSearch", &ll::LookupContext::beginSearch)
        .function("test", &ll::LookupContext::test);
}