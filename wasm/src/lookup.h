#pragma once
#include "ldb.h"

namespace ldb::lookup {

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

    void setup(val data);
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
    SearchContext();
    size_t ptr() const;
    void setup(LookupContext* ctx, val data);
    bool isComplete() const;
    int getSearchCount() const;
    val getResult() const;
    void test();

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
    const LookupContext* lctx_{};
    Options opt_{};

    std::vector<const MainCharacter*> mainChrs_;
    std::vector<const SupportCharacter*> supChrs_;
    std::vector<const Item*> weapons_, armors_, helmets_, accessories_;

    ResultHolder* bestResult_{};
    ist::fixed_vector<ResultHolder, 10> bestTree_;
    bool isComplete_ = false;
    int searchCount_ = 0;
};

class LookupContext : public BaseContext
{
public:
    LookupContext(val data);
    val beginSearch(val option);
    void test(val v);

private:
};

} // namespace ldb::lookup

