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


namespace ldb::lookup {
namespace em = emscripten;

class SkillEffect;
class Skill;


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
    SkillEffect effects_[16]{};
};


class MainCharacter : public Entity
{
public:
    std::array<Skill*, 7> skills_;
    uint32_t classFlag_{};
    uint32_t symbolFlag_{};
    uint32_t rarityFlag_{};
};

class SupportCharacter : public Entity
{
public:
    std::array<Skill*, 3> skills_;
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


template<size_t N>
class FixedBitSet
{
public:
    bool get(int i) const {
        int byte = i / 32;
        int bit = i % 32;
        return data_[byte] & (1 << bit);
    }

    void set(int i, bool v) {
        int byte = i / 32;
        int bit = i % 32;
        if (v)
            data_[byte] |= 1 << bit;
        else
            data_[byte] &= ~(1 << bit);
    }

private:
    uint32_t data_[N / 32]{};
};


class Options
{
    struct EffectParam {
        int valueType_ = 0;
        int limit = 0;
        float weight = 1.0f;
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
};

class SerarchState
{
public:
    std::array<int, 64> usedSlots_{};
    std::array<int, 64> totalAmounts_{};
    FixedBitSet<2048> usedSkills_{};
};


class LookupContext
{
public:
    void test(em::val v);

    void setData(em::val data);

    em::val beginSearch(em::val option);

public:
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

