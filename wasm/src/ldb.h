#pragma once
#include "types.h"

namespace ldb {

class SkillEffect;
class Skill;
class SummonCharacter;
class MainCharacter;
class SupportCharacter;
class Item;

enum class EntityType
{
    Unknown,
    Skill,
    Main,
    Support,
    Item,
    Summon,
};
enum class EffectType
{
    Unknown,
    Buff,
    Debuff,
    StatusEffect,
    Immune,
};
enum class SkillType
{
    Unknown,
    Active,
    Passive,
    Talent,
    Item,
};
enum class AttackType
{
    Unknown,
    Attack,
    Magic,
};
enum class ItemType
{
    Unknown,
    Weapon,
    Armor,
    Helmet,
    Accessory,
    Amulet,
};

struct BaseStatus
{
    float hp;
    float attack;
    float defense;
    float magic;
    float resist;
    float technic;

    constexpr size_t size() const { return 6; }
    float* data() { return (float*)this; }
    const float* data() const { return (float*)this; }
    float* begin() { return data(); }
    const float* begin() const { return data(); }
    float* end() { return data() + size(); }
    const float* end() const { return data() + size(); }
    float& operator[](size_t i) { return data()[i]; }
    const float& operator[](size_t i) const { return data()[i]; }
};

class Entity
{
public:
    val js_;
    uint32_t index_ = 0;
    EntityType entityType_{};
    std::string name_;
};

template<class T> T* cast(Entity* p);
template<class T> T& cast(Entity& p);

class SkillEffect
{
public:
    val js_;
    EffectType effectType_{};
    uint32_t isSelfTarget_ : 1 {};
    uint32_t isSingleTarget_ : 1 {};
    uint32_t onProbablity_ : 1 {};
    uint32_t onBattle_ : 1 {};
    uint32_t onKill_ : 1 {};
    int valueType_ = 0;
    int value_ = 0;
    int duration_ = 0;
    int maxStack_ = 0;
    int slot_ = 0;
};

class Skill : public Entity
{
public:
    SkillType skillType_{};
    EntityType ownerType_{};
    uint32_t isSymbolSkill_ : 1 {};
    uint32_t hasReaction_ : 1 {};
    ist::fixed_vector<SkillEffect, 12> effects_{};
    ist::fixed_vector<SummonCharacter*, 4> summon_{};
};


class MainCharacter : public Entity
{
public:
    int range_{};
    int move_{};
    AttackType attackType_{};
    uint32_t classFlag_{};
    uint32_t symbolFlag_{};
    uint32_t rarityFlag_{};
    ist::fixed_vector<Skill*, 7> skills_{};
    BaseStatus statusInit_{};
    BaseStatus statusLv_{};
    BaseStatus statusStar_{};
};

class SupportCharacter : public Entity
{
public:
    int range_{};
    AttackType attackType_{};
    uint32_t classFlag_{};
    uint32_t rarityFlag_{};
    ist::fixed_vector<Skill*, 3> skills_{};
    BaseStatus statusInit_{};
    BaseStatus statusLv_{};
    BaseStatus statusStar_{};
};

class SummonCharacter : public Entity
{
public:
    int range_{};
    int move_{};
    AttackType attackType_{};
    uint32_t classFlag_{};
    ist::fixed_vector<Skill*, 4> skills_{};
};

// 極めて微妙だが装備は Skill の派生ということにしておく
class Item : public Skill
{
public:
    uint32_t classFlags_{};
    uint32_t rarityFlag_{};
    ItemType itemType_{};
    BaseStatus statusInit_{};
    BaseStatus statusLv_{};
};


class BaseContext
{
public:
    void setup(val data);

    Entity* getEntity(int id);
    Entity* getEntity(val v);
    Entity* findEntity(const std::string& name);

private:
    void processEntity(Entity& dst, val& src);
    void processEffects(SkillEffect& dst, val& src);
    void processSkill(Skill& dst, val& src);
    void processSummonChr(SummonCharacter& dst, val& src);
    void processMainChr(MainCharacter& dst, val& src);
    void processSupChr(SupportCharacter& dst, val& src);
    void processItem(Item& dst, val& src);

public:
    val data_;
    std::vector<Entity*> entityTable_;
    std::vector<Skill> skills_;
    std::vector<SummonCharacter> summonChrs_;
    std::vector<MainCharacter> mainChrs_;
    std::vector<SupportCharacter> supChrs_;
    std::vector<Item> items_;
    std::vector<Item*> weapons_, armors_, helmets_, accessories_;
};

} // namespace ldb

