#include "lookup.h"
#include "util.h"
#include <emscripten/bind.h>

namespace ldb::lookup {

SearchContext::SearchContext()
{
}

void SearchContext::setup(LookupContext* ctx, val data)
{
    lctx_ = ctx;
    opt_.setup(data);
}

void SearchContext::beginSearch()
{
    async_ = std::async(std::launch::async, [&]() {
        for (int i = 0; i < 10; ++i) {
            searchCount_ += 100;
            std::this_thread::sleep_for(std::chrono::milliseconds(1000));
        }
        isComplete_ = true;
        });
}

void SearchContext::wait()
{
    if (async_.valid()) {
        async_.wait();
        async_ = {};
    }
}

bool SearchContext::isComplete() const { return isComplete_; }
int SearchContext::getSearchCount() const { return searchCount_; }

val SearchContext::getResult() const
{
    return val::null();
}

void SearchContext::test()
{
    printf("SearchContext::test()\n");
}


void SearchContext::searchRecursive(SerarchState* pstate, ResultHolder* pr, int depth)
{
}

bool SearchContext::effectCondition(const SkillEffect& effect) const
{
    if (effect.onBattle_ && effect.duration_ == 0) {
        // 1 戦闘限りの効果は除外
        return false;
    }

    if (effect.effectType_ == EffectType::Buff) {
        return (!effect.isSelfTarget_) && // 自己バフ除外
            (opt_.allowSingleUnitBuff_ || !effect.isSingleTarget_) && // 単体バフ
            (opt_.allowOnBattle_ || !effect.onBattle_) && // 戦闘時バフ
            (opt_.allowProbability_ || !effect.onProbablity_); // 確率発動バフ
    }
    else if (effect.effectType_ == EffectType::Debuff) {
        return (opt_.allowOnBattle_ || !effect.onBattle_) && // 戦闘時バフ
            (opt_.allowProbability_ || !effect.onProbablity_); // 確率発動デバフ
    }
    return false;
}

bool SearchContext::skillCondition(const Skill& skill) const
{
    // シンボルスキル
    if (!opt_.allowSymbolSkill_ && skill.isSymbolSkill_)
        return false;
    // サポートアクティブ
    if (!opt_.allowSupportActive_ && skill.skillType_ == SkillType::Active && skill.ownerType_ == EntityType::Support)
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
            if (skill.skillType_ == SkillType::Active && state.usedSlots_[effect.slot_]) {
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


void Options::setup(val data)
{
    val options = data["options"];
    maxUnits_ = to_int(options["maxPickup"]["value"]);
    maxActive_ = to_int(options["maxActiveCount"]["value"]);
    allowOnBattle_ = to_bool(options["allowOnBattle"]["value"]);
    allowProbability_ = to_bool(options["allowProbability"]["value"]);
    allowSingleUnitBuff_ = to_bool(options["allowSingleUnitBuff"]["value"]);
    allowSymbolSkill_ = to_bool(options["allowSymbolSkill"]["value"]);
    allowSupportActive_ = to_bool(options["allowSupportActive"]["value"]);

    auto filterToFlags = [](val filter) {
        uint32_t flags = 0;
        array_each(filter, [&](val obj, int nth) {
            if (to_bool(obj["state"])) {
                flags |= 1 << nth;
            }
            });
        if (flags == 0) {
            flags = ~0;
        }
        return flags;
    };
    val filter = data["filter"];
    classFilter_ = filterToFlags(filter["class"]);
    symbolFilter_ = filterToFlags(filter["symbol"]);
    rarityFilter_ = filterToFlags(filter["rarity"]);

    auto handleTargetParam = [&](val& param) {
        auto& dst = targets_.emplace_back();
        dst.enabled_ = to_bool(param["enabled"]);
        dst.valueType_ = to_int(param["valueTypeIndex"]);
        dst.limit_ = to_float(param["limit"]);
        dst.weight_ = to_float(param["weight"]) * 0.1f;
        if (dst.limit_ <= 0.0f) {
            dst.limit_ = std::numeric_limits<float>::max();
        }
    };
    array_each(data["buffs"], [&](val param) { handleTargetParam(param); });
    array_each(data["debuffs"], [&](val param) { handleTargetParam(param); });

    auto handlePirorityItem = [](std::vector<PrioritizeParam>& cont, val& obj) {
        auto& dst = cont.emplace_back();
        val owner = obj["owner"];
        if (!owner.isUndefined()) {
            dst.item_ = to_int(obj["item"]["index"]);
            dst.owner_ = to_int(obj["owner"]["index"]);
        }
        else {
            dst.item_ = to_int(obj["index"]);
        }
    };
    array_each(data["excluded"], [&](val prio) { handlePirorityItem(excluded_, prio); });
    array_each(data["prioritized"], [&](val prio) { handlePirorityItem(prioritized, prio); });
}

LookupContext::LookupContext(val data)
{
    setup(data);
}

val LookupContext::beginSearch(val option)
{
    val ret = val::global("Module")["SearchContext"].new_();
    auto ptr = as_ptr<SearchContext>(ret);
    ptr->setup(this, option);
    ptr->beginSearch();

    return ret;
}

size_t self(SearchContext* obj)
{
    return (size_t)obj;
}

} // namespace ldb::lookup

EMSCRIPTEN_BINDINGS(ldb_lookup)
{
    using val = emscripten::val;
    namespace ll = ldb::lookup;

    emscripten::class_<ll::LookupContext>("LookupContext")
        .constructor<val>()
        .function("beginSearch", &ll::LookupContext::beginSearch)
        .function("test", &ll::LookupContext::test)
        ;

    emscripten::class_<ll::SearchContext>("SearchContext")
        .constructor<>()
        .function("isComplete", &ll::SearchContext::isComplete)
        .function("getSearchCount", &ll::SearchContext::getSearchCount)
        .function("getResult", &ll::SearchContext::getResult)
        .function("test", &ll::SearchContext::test)
        ;
}
