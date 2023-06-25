#pragma once
#include <memory>
#include <array>
#include <vector>
#include <bitset>
#include <functional>
#include <cstdint>
#include <span>

#include <emscripten.h>
#include <emscripten/val.h>
#include <emscripten/bind.h>

#include "types.h"


namespace ldb::lookup {
namespace em = emscripten;

class SkillEffect;
class Skill;
class MainCharacter;
class SupportCharacter;
class Item;


class Entity
{
public:
    enum class Type
    {
        Unknown,
        Skill,
        Main,
        Support,
        Item,
    };

    val js_;
    uint32_t index_ = 0;
    Type type_{};
};

class SkillEffect
{
public:
    enum class EffectType {
        Unknwon,
        Buff,
        Debuff,
        Immune,
    };
    val js_;
    EffectType effectType_{};
    uint32_t selfTarget_ : 1 {};
    uint32_t singleTarget_ : 1 {};
    uint32_t onProbablity_ : 1 {};
    uint32_t onBattle_ : 1 {};
    uint32_t onKill_ : 1 {};
    int valueType_ = 0;
    int value_ = 0;
    int duration_ = 0;
    int slot_ = 0;
};

class Skill : public Entity
{
public:
    enum class SkillType
    {
        Unknown,
        Active,
        Passive,
        Talent,
        Item,
    };
    SkillType skillType_{};
    Entity::Type ownerType_{};

    uint32_t isSymbolSkill : 1 {};
    uint32_t hasReaction : 1 {};

    ist::fixed_vector<SkillEffect, 10> effects_{};

    MainCharacter* summon_ = nullptr;
};


class MainCharacter : public Entity
{
public:
    ist::fixed_vector<Skill*, 7> skills_{};
    uint32_t classFlag_{};
    uint32_t symbolFlag_{};
    uint32_t rarityFlag_{};
};

class SupportCharacter : public Entity
{
public:
    ist::fixed_vector<Skill*, 3> skills_{};
    uint32_t classFlag_{};
    uint32_t rarityFlag_{};
};

// 極めて微妙だが装備は Skill の派生ということにしておく
class Item : public Skill
{
public:
    enum class SlotType
    {
        Weapon,
        Armor,
        Helmet,
        Accessory,
    };
    uint32_t classFlags_{};
    uint32_t rarityFlag_{};
    SlotType slot_{};
};


class Options
{
public:
    struct EffectParam {
        bool enabled_ = false;
        int valueType_ = 0;
        int limit_ = 0;
        float weight_ = 1.0f;
    };
    struct PrioritizeParam
    {
        int item_ = 0;
        int owner_ = 0;
    };

    int maxUnits_ = 5;
    int maxActive_ = 2;

    uint32_t allowOnBattle_ : 1 { true };
    uint32_t allowProbability_ : 1 { true };
    uint32_t allowSingleUnitBuff_ : 1 { false };
    uint32_t allowSymbolSkill_ : 1 { false };
    uint32_t allowSupportActive_ : 1 { true };

    uint32_t classFilter_ = 0xffff;
    uint32_t symbolFilter_ = 0xffff;
    uint32_t rarityFilter_ = 0xffff;
    std::vector<EffectParam> targets_;
    std::vector<PrioritizeParam> excluded_;
    std::vector<PrioritizeParam> prioritized;
};

class SerarchState
{
public:
    SerarchState* parent_{};
    std::array<int, 64> usedSlots_{};
    std::array<int, 64> totalAmounts_{};
    std::bitset<2048> usedSkills_{};
};

class ResultHolder
{
public:
    bool operator<(const ResultHolder& v) const;

    // root -> current
    void each(const std::function<void(ResultHolder&)>& cb) {
        if (parent_)
            parent_->each(cb);
        cb(*this);
    }

public:
    ResultHolder* parent_{};

    SupportCharacter* supChr_{};
    ist::fixed_vector<Skill*, 3> supSkills_{};

    ist::fixed_vector<Item*, 4> items_{};

    MainCharacter* mainChr_{};
    ist::fixed_vector<Skill*, 4> mainSkills_{};

    MainCharacter* summonChr_{};
    ist::fixed_vector<Skill*, 4> summonSkills_{};

    ist::fixed_vector<SkillEffect*, 32> usedEffects_{};
    ist::fixed_vector<SkillEffect*, 8> unusedEffects_{};

    int unitCount_ = 0;     // 
    int skillCount_ = 0;    // 
    float scoreTotal_ = 0;  // 親階層含む全合計

    float scoreMain_ = 0;    // 
    float scoreSupport_ = 0; // 
    float scoreItems_ = 0;   // 現在の階層のみのスコア
};


class LookupContext;

class SearchContext
{
public:
    SearchContext(const LookupContext& lctx, const Options& opt);
    void beginSearch();

public:
    void searchRecursive(SerarchState *pstate, ResultHolder* pr, int depth = 0);
    bool submitResult(const ResultHolder& result);

    bool effectCondition(const SkillEffect& effect) const;
    bool skillCondition(const Skill& skill) const;

    float getScore(const SerarchState& state, const SkillEffect& obj) const;
    float getScore(const SerarchState& state, const Skill& skill) const;
    float getScoreEst(const SerarchState& state, const MainCharacter& obj) const;
    float getScoreEst(const SerarchState& state, const SupportCharacter& obj) const;
    float getScoreEst(const SerarchState& state, const Item& obj) const;

    float getScore(ResultHolder& dst, SerarchState& state, const MainCharacter& obj);
    float getScore(ResultHolder& dst, SerarchState& state, const SupportCharacter& obj);
    float getScore(ResultHolder& dst, SerarchState& state, const Item& obj);
    void updateState(SerarchState& state, const ResultHolder& result);

public:
    const LookupContext& lctx_;
    const Options opt_{};

    std::vector<const MainCharacter*> mainChrs_;
    std::vector<const SupportCharacter*> supChrs_;
    std::vector<const Item*> weapons_, armors_, helmets_, accessories_;

    ResultHolder* bestResult_{};
    ist::fixed_vector<ResultHolder, 10> bestTree_;
};

class LookupContext
{
public:
    void setup(val data);
    val beginSearch(val option);

    void test(val v);

private:
    void processEntity(Entity& dst, val& src);
    void processSkill(Skill& dst, val& src);
    void processMainChr(MainCharacter& dst, val& src);
    void processSupChr(SupportCharacter& dst, val& src);
    void processItem(Item& dst, val& src);

public:
    std::vector<Entity*> entityTable_;
    std::vector<Skill> skills_;
    std::vector<MainCharacter> mainChrs_;
    std::vector<SupportCharacter> supChrs_;
    std::vector<Item> items_;
};

} // namespace ldb::lookup

