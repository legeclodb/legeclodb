#include "lookup.h"
#include "util.h"

namespace ldb::lookup {

inline void eachSkill(std::span<Skill*> skills, std::function<void(Skill&)>&& cb)
{
    for (auto s : skills)
        cb(*s);
}

inline void eachSkillEffect(std::span<Skill*> skills, std::function<void(SkillEffect&, Skill&)>&& cb)
{
    for (auto s : skills) {
        for (auto e : s->effects_) {
            if (e.valueType_ == 0)
                break;
            cb(e, *s);
        }
    }
}

void SearchContext::searchRecursive(SerarchState* pstate, ResultHolder* pr, int depth)
{
}

bool SearchContext::effectCondition(const SkillEffect& effect) const
{
    if (effect.onBattle_ && effect.duration_ == 0)
        return false;

    if (effect.effectType_ == SkillEffect::EffectType::Buff) {
        return (!effect.selfTarget_) &&
            (opt_.allowSingleUnitBuff_ || !effect.singleTarget_) &&
            (opt_.allowOnBattle_ || !effect.onBattle_) &&
            (opt_.allowProbability_ || !effect.onProbablity_);
    }
    else if (effect.effectType_ == SkillEffect::EffectType::Debuff) {
        return (opt_.allowOnBattle_ || !effect.onBattle_) &&
            (opt_.allowProbability_ || !effect.onProbablity_);
    }
    return false;
}

bool SearchContext::skillCondition(const Skill& skill) const
{
    if (!opt_.allowSymbolSkill_ && skill.isSymbolSkill)
        return false;
    if (!opt_.allowSupportActive_ && skill.skillType_ == Skill::SkillType::Active && skill.ownerType_ == Entity::Type::Support)
        return false;
    return true;
}

float SearchContext::getScore(const SerarchState& state, const SkillEffect& obj) const
{
    return 0;
}

float SearchContext::getScore(const SerarchState& state, const Skill& skill) const
{
    if (state.usedSkills_[skill.index_] || !skillCondition(skill))
        return 0;

    float score = 0.0f;
    for (auto& effect : skill.effects_) {
        auto& param = opt_.targets_[effect.valueType_];
        if (param.enabled_ && effectCondition(effect)) {
            if (skill.skillType_ == Skill::SkillType::Active && state.usedSlots_[effect.slot_]) {
                continue; // アクティブ枠競合
            }

            score += effect.value_ * param.weight_;
        }
    }
    return 0;
}

float SearchContext::getScoreEst(const SerarchState& state, const MainCharacter& obj) const
{
    return 0;
}
float SearchContext::getScoreEst(const SerarchState& state, const SupportCharacter& obj) const
{
    return 0;
}
float SearchContext::getScoreEst(const SerarchState& state, const Item& obj) const
{
    return 0;
}

float SearchContext::getScore(ResultHolder& dst, SerarchState& state, const MainCharacter& obj)
{
    return 0;
}
float SearchContext::getScore(ResultHolder& dst, SerarchState& state, const SupportCharacter& obj)
{
    return 0;
}
float SearchContext::getScore(ResultHolder& dst, SerarchState& state, const Item& obj)
{
    return 0;
}

void SearchContext::updateState(SerarchState& state, const ResultHolder& result)
{

}



void LookupContext::processEntity(Entity& dst, val& src)
{
    dst.js_ = src;
    dst.index_ = src["uid"].as<int>();
    entityTable_[dst.index_] = &dst;

    printf("%s\n", src["name"].as<std::string>().c_str());
}

void LookupContext::processSkill(Skill& dst, val& src)
{
    processEntity(dst, src);
}

void LookupContext::processMainChr(MainCharacter& dst, val& src)
{
    processEntity(dst, src);
}

void LookupContext::processSupChr(SupportCharacter& dst, val& src)
{
    processEntity(dst, src);
}

void LookupContext::processItem(Item& dst, val& src)
{
    processEntity(dst, src);
}

void LookupContext::setup(val data)
{
    val mainChrs = data["mainChrs"];
    val mainActive = data["mainActive"];
    val mainPassive = data["mainPassive"];
    val mainTalent = data["mainTalents"];

    val supChrs = data["supChrs"];
    val supActive = data["supActive"];
    val supPassive = data["supPassive"];

    val items = data["items"];

    mainChrs_.resize(arrayLength(mainActive));
    supChrs_.resize(arrayLength(supChrs));
    items_.resize(arrayLength(items));
    skills_.resize(arrayLength(mainActive) + arrayLength(mainPassive) + arrayLength(mainTalent) + arrayLength(supActive) + arrayLength(supPassive));
    entityTable_.resize(1 + mainChrs_.size() + supChrs_.size() + items_.size() + skills_.size());

    {
        auto* dst = &skills_[0];
        arrayEach(mainActive, [&](val src) { processSkill(*dst++, src); });
        arrayEach(mainPassive, [&](val src) { processSkill(*dst++, src); });
        arrayEach(mainTalent, [&](val src) { processSkill(*dst++, src); });
        arrayEach(supActive, [&](val src) { processSkill(*dst++, src); });
        arrayEach(supPassive, [&](val src) { processSkill(*dst++, src); });
    }
    {
        auto* dst = &mainChrs_[0];
        arrayEach(mainChrs, [&](val src) { processMainChr(*dst++, src); });
    }
    {
        auto* dst = &supChrs_[0];
        arrayEach(supChrs, [&](val src) { processSupChr(*dst++, src); });
    }
    {
        auto* dst = &items_[0];
        arrayEach(items, [&](val src) { processItem(*dst++, src); });
    }
}

val LookupContext::beginSearch(val option)
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
