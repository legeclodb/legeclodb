#include "ldb.h"
#include "util.h"

namespace ldb {

template<> Skill* cast(Entity* p) { return p->entityType_ == EntityType::Skill ? (Skill*)p : nullptr; }
template<> MainCharacter* cast(Entity* p) { return p->entityType_ == EntityType::Main ? (MainCharacter*)p : nullptr; }
template<> SupportCharacter* cast(Entity* p) { return p->entityType_ == EntityType::Support ? (SupportCharacter*)p : nullptr; }
template<> Item* cast(Entity* p) { return p->entityType_ == EntityType::Item ? (Item*)p : nullptr; }


void BaseContext::processEntity(Entity& dst, val& src)
{
    dst.js_ = src;
    dst.index_ = to_int(src["uid"]);
    dst.name_ = src["name"].as<std::string>();
    entityTable_[dst.index_] = &dst;
}

void BaseContext::processEffects(Skill& dst, val& src)
{
    SkillEffect& tmp = dst.effects_.emplace_back();
    tmp.js_ = src;
    tmp.effectType_ = select<EffectType>({
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

    dst.skillType_ = select<SkillType>({
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
    //array_each(src["statusEffect"], [&](val effect) { processEffects(dst, effect); });
    //array_each(src["immune"], [&](val effect) { processEffects(dst, effect); });
}

static BaseStatus asBaseStatus(val src)
{
    BaseStatus ret{};
    array_each(src, [&](val v, int i) { ret[i] = to_float(v); });
    return ret;
}

static AttackType toAttckType(val src)
{
    return select<AttackType>({
        { "アタック", AttackType::Attack },
        { "マジック", AttackType::Magic }
        }, to_string(src));
}

void BaseContext::processSummonChr(SummonCharacter& dst, val& src)
{
    processEntity(dst, src);
    dst.entityType_ = EntityType::Summon;

    dst.range_ = to_int(src["range"]);
    dst.move_ = to_int(src["move"]);
    dst.attackType_ = toAttckType(src["damageType"]);

    dst.classFlag_ = 1 << to_int(src["classId"]);

    dst.skills_.emplace_back((Skill*)getEntity(src["talent"]));
    array_each(src["skills"], [&](val skill) { dst.skills_.emplace_back((Skill*)getEntity(skill)); });
}

void BaseContext::processMainChr(MainCharacter& dst, val& src)
{
    processEntity(dst, src);
    dst.entityType_ = EntityType::Main;

    dst.range_ = to_int(src["range"]);
    dst.move_ = to_int(src["move"]);
    dst.attackType_ = toAttckType(src["damageType"]);

    dst.classFlag_ = 1 << to_int(src["classId"]);
    dst.symbolFlag_ = 1 << to_int(src["symbolId"]);
    dst.rarityFlag_ = 1 << to_int(src["rarityId"]);

    dst.statusInit_ = asBaseStatus(src["statusInit"]);
    dst.statusLv_ = asBaseStatus(src["statusLv"]);
    dst.statusStar_ = asBaseStatus(src["statusStar"]);

    dst.skills_.push_back(cast<Skill>(getEntity(src["talent"])));
    array_each(src["skills"], [&](val skill) {
        dst.skills_.push_back(cast<Skill>(getEntity(skill)));
        });

    val summon = src["summon"];
    if (summon.isArray()) {
        array_each(summon, [&](val s) {
            processSummonChr(summonChrs_.emplace_back(), s);
            });
    }

    dbg_info("%s: ", dst.name_.c_str());
    for (auto skill : dst.skills_) {
        dbg_info("%s, ", skill->name_.c_str());
    }
    dbg_info("\n");
}

void BaseContext::processSupChr(SupportCharacter& dst, val& src)
{
    processEntity(dst, src);
    dst.entityType_ = EntityType::Support;

    dst.range_ = to_int(src["range"]);
    dst.attackType_ = toAttckType(src["damageType"]);

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

    dst.itemType_ = select<ItemType>({
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
    return getEntity(to_int(v["uid"]));
}
Entity* BaseContext::findEntity(const std::string& name)
{
    return find_by_name(entityTable_, name);
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

        // 召喚キャラをスキルにも設定
        array_each(mainActive, [&](val active) {
            val summon = active["summon"];
            if (summon.isArray()) {
                Skill* skill = find_by_js(skills_, active);
                array_each(summon, [&](val chr) {
                    skill->summon_.push_back(find_by_js(summonChrs_, chr));
                    });

                dbg_info("%s: ", skill->name_.c_str());
                for (auto& so : skill->summon_) {
                    dbg_info("%s, ", so->name_.c_str());
                }
                dbg_info("\n");
            }
            });
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
