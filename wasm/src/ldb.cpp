#include "ldb.h"
#include "util.h"

namespace ldb {

void BaseContext::processEntity(Entity& dst, val& src)
{
    dst.js_ = src;
    dst.index_ = to_int(src["uid"]);
    entityTable_[dst.index_] = &dst;

    //printf("%s\n", src["name"].as<std::string>().c_str());
}

void BaseContext::processEffects(Skill& dst, val& src)
{
    SkillEffect& tmp = dst.effects_.emplace_back();
    tmp.js_ = src;
    tmp.effectType_ = select_value<EffectType>({
        { "バフ", EffectType::Buff },
        { "デバフ", EffectType::Debuff },
        { "状態異常", EffectType::StatusEffect },
        { "無効化", EffectType::Immune },
        }, to_string(src["effectType"]));

    val target = src["target"];
    if (target.isString()) {
        std::string t = target.as<std::string>();
        tmp.isSelfTarget_ = t == "自身";
        tmp.isSingleTarget_ = t == "単体";
    }

    tmp.valueType_ = to_int(src["valueTypeIndex"]);
    tmp.value_ = to_int(src["value"]);
    tmp.duration_ = to_int(src["duration"]);
    tmp.maxStack_ = to_int(src["maxStack"], 1);
    tmp.slot_ = to_int(src["slotIndex"]);
}

void BaseContext::processSkill(Skill& dst, val& src)
{
    processEntity(dst, src);
    dst.entityType_ = EntityType::Skill;

    dst.skillType_ = select_value<SkillType>({
        { "アクティブ", SkillType::Active },
        { "パッシブ", SkillType::Passive },
        { "タレント", SkillType::Talent },
        }, to_string(src["skillType"]));

    if (to_bool(src["isMainSkill"])) {
        dst.ownerType_ = EntityType::Main;
    }
    if (to_bool(src["isSupportSkill"])) {
        dst.ownerType_ = EntityType::Support;
    }

    dst.hasReaction_ = to_bool(src["hasReaction"]);
    dst.isSymbolSkill_ = to_bool(src["isSymbolSkill"]);

    array_each(src["buff"], [&](val effect) { processEffects(dst, effect); });
    array_each(src["debuff"], [&](val effect) { processEffects(dst, effect); });
    array_each(src["statusEffect"], [&](val effect) { processEffects(dst, effect); });
    array_each(src["immune"], [&](val effect) { processEffects(dst, effect); });
}

static inline BaseStatus asBaseStatus(val src)
{
    BaseStatus ret{};
    array_each(src, [&](val v, int i) { ret[i] = to_float(v); });
    return ret;
}

void BaseContext::processMainChr(MainCharacter& dst, val& src)
{
    processEntity(dst, src);
    dst.entityType_ = EntityType::Main;

    dst.range_ = to_int(src["range"]);
    dst.move_ = to_int(src["move"]);
    dst.attackType_ = select_value<AttackType>({
        { "アタック", AttackType::Attack },
        { "マジック", AttackType::Magic }
        }, to_string(src["damageType"]));

    dst.classFlag_ = 1 << to_int(src["classId"]);
    dst.symbolFlag_ = 1 << to_int(src["symbolId"]);
    dst.rarityFlag_ = 1 << to_int(src["rarityId"]);

    dst.statusInit_ = asBaseStatus(src["statusInit"]);
    dst.statusLv_ = asBaseStatus(src["statusLv"]);
    dst.statusStar_ = asBaseStatus(src["statusStar"]);

    dst.skills_.emplace_back((Skill*)getEntity(src["talent"]));
    array_each(src["skills"], [&](val skill) { dst.skills_.emplace_back((Skill*)getEntity(skill)); });
}

void BaseContext::processSupChr(SupportCharacter& dst, val& src)
{
    processEntity(dst, src);
    dst.entityType_ = EntityType::Support;

    dst.range_ = to_int(src["range"]);
    dst.attackType_ = select_value<AttackType>({
        { "アタック", AttackType::Attack },
        { "マジック", AttackType::Magic }
        }, to_string(src["damageType"]));

    dst.classFlag_ = 1 << to_int(src["classId"]);
    dst.rarityFlag_ = 1 << to_int(src["rarityId"]);

    dst.statusInit_ = asBaseStatus(src["statusInit"]);
    dst.statusLv_ = asBaseStatus(src["statusLv"]);
    dst.statusStar_ = asBaseStatus(src["statusStar"]);

    array_each(src["skills"], [&](val skill) { dst.skills_.emplace_back((Skill*)getEntity(skill)); });
}

void BaseContext::processItem(Item& dst, val& src)
{
    processSkill(dst, src);
    dst.entityType_ = EntityType::Item;
    dst.ownerType_ = EntityType::Item;

    dst.itemType_ = select_value<ItemType>({
        { "武器", ItemType::Weapon },
        { "鎧", ItemType::Armor },
        { "兜", ItemType::Helmet },
        { "アクセサリ", ItemType::Accessory },
        { "アミュレット", ItemType::Amulet },
        }, to_string(src["slot"]));
    dst.classFlags_ = to_uint(src["classFlags"]);
    dst.statusInit_ = asBaseStatus(src["statusInit"]);
    dst.statusLv_ = asBaseStatus(src["statusLv"]);
}

Entity* BaseContext::getEntity(int id)
{
    return entityTable_[id];
}
Entity* BaseContext::getEntity(val v)
{
    return getEntity(to_int(v["index"]));
}

void BaseContext::setup(val data)
{
    if (!mainChrs_.empty()) {
        // テストで何度も setup() を呼ぶケース用。
        // production 環境では setup() は 1 度しか呼ばれない想定。
        *this = {};
    }

    data_ = data;
    val mainChrs = data["mainChrs"];
    val mainActive = data["mainActive"];
    val mainPassive = data["mainPassive"];
    val mainTalent = data["mainTalents"];

    val supChrs = data["supChrs"];
    val supActive = data["supActive"];
    val supPassive = data["supPassive"];

    val items = data["items"];

    mainChrs_.resize(array_length(mainActive));
    supChrs_.resize(array_length(supChrs));
    items_.resize(array_length(items));
    skills_.resize(array_length(mainActive) + array_length(mainPassive) + array_length(mainTalent) + array_length(supActive) + array_length(supPassive));
    entityTable_.resize(1 + mainChrs_.size() + supChrs_.size() + items_.size() + skills_.size());

    {
        auto* dst = &skills_[0];
        array_each(mainActive, [&](val src) { processSkill(*dst++, src); });
        array_each(mainPassive, [&](val src) { processSkill(*dst++, src); });
        array_each(mainTalent, [&](val src) { processSkill(*dst++, src); });
        array_each(supActive, [&](val src) { processSkill(*dst++, src); });
        array_each(supPassive, [&](val src) { processSkill(*dst++, src); });
    }
    {
        auto* dst = &mainChrs_[0];
        array_each(mainChrs, [&](val src) { processMainChr(*dst++, src); });
    }
    {
        auto* dst = &supChrs_[0];
        array_each(supChrs, [&](val src) { processSupChr(*dst++, src); });
    }
    {
        auto* dst = &items_[0];
        array_each(items, [&](val src) { processItem(*dst++, src); });
        for (auto& item : items_) {
            switch (item.itemType_) {
            case ItemType::Weapon: weapons_.push_back(&item); break;
            case ItemType::Armor: armors_.push_back(&item); break;
            case ItemType::Helmet: helmets_.push_back(&item); break;
            case ItemType::Accessory: accessories_.push_back(&item); break;
            default: break;
            }
        }
    }
}

} // namespace ldb
