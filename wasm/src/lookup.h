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

    em::val js_;
    uint32_t index_ = 0;
    Type type_{};
};

class SkillEffect
{
public:
    struct Flags {
        uint32_t singleUnit : 1;
        uint32_t onProbablity: 1;
        uint32_t onBattle : 1;
        uint32_t onKill : 1;
    };

    em::val js_;
    Flags flags_ {};
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
    struct Flags {
        uint32_t isSymbolSkill : 1;
        uint32_t hasReaction : 1;
    };

    SkillType skillType_{};
    Entity::Type ownerType_{};
    Flags flags_{};
    FixedVector<SkillEffect, 10> effects_{};

    MainCharacter* summon_ = nullptr;
};


class MainCharacter : public Entity
{
public:
    FixedVector<Skill*, 7> skills_{};
    uint32_t classFlag_{};
    uint32_t symbolFlag_{};
    uint32_t rarityFlag_{};
};

class SupportCharacter : public Entity
{
public:
    FixedVector<Skill*, 3> skills_{};
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
    struct EffectParam {
        int valueType_ = 0;
        int limit = 0;
        float weight = 1.0f;
    };
    struct PrioritizeParam
    {
        int item_ = 0;
        int owner_ = 0;
    };

    int maxUnits_ = 5;
    int maxActive_ = 2;
    bool allowOnBattle_ = true;
    bool allowProbability_ = true;
    bool allowSingleUnitBuff_ = false;
    bool allowSymbolSkill_ = false;
    bool allowSupportActive_ = true;
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
    Array<int, 64> usedSlots_{};
    Array<int, 64> totalAmounts_{};
    FixedBitSet<2048> usedSkills_{};
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
    FixedVector<Skill*, 3> supSkills_{};

    FixedVector<Item*, 4> items_{};

    MainCharacter* mainChr_{};
    FixedVector<Skill*, 4> mainSkills_{};

    MainCharacter* summonChr_{};
    FixedVector<Skill*, 4> summonSkills_{};

    FixedVector<SkillEffect*, 32> usedEffects_{};
    FixedVector<SkillEffect*, 8> unusedEffects_{};

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
    void searchRecursive(SerarchState *pstate, ResultHolder* pr);
    bool submitResult(ResultHolder& result);

    float getScore(const SerarchState& state, const MainCharacter& obj);
    float getScore(const SerarchState& state, const SupportCharacter& obj);
    float getScore(const SerarchState& state, const Item& obj);

public:
    const LookupContext& lctx_;
    const Options opt_{};

    std::vector<const MainCharacter*> mainChrs_;
    std::vector<const SupportCharacter*> supChrs_;
    std::vector<const Item*> weapons_, armors_, helmets_, accessories_;

    ResultHolder* bestResult_{};
    FixedVector<ResultHolder, 10> bestTree_;
};

class LookupContext
{
public:
    void setup(em::val data);
    em::val beginSearch(em::val option);

    void test(em::val v);

private:
    void processEntity(Entity& dst, em::val& src);
    void processSkill(Skill& dst, em::val& src);
    void processMainChr(MainCharacter& dst, em::val& src);
    void processSupChr(SupportCharacter& dst, em::val& src);
    void processItem(Item& dst, em::val& src);

public:
    std::vector<Entity*> entityTable_;
    std::vector<Skill> skills_;
    std::vector<MainCharacter> mainChrs_;
    std::vector<SupportCharacter> supChrs_;
    std::vector<Item> items_;
};

} // namespace ldb::lookup

