#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os, json, jsbeautifier, csv, requests, datetime, re

OverrideJson = True

csvDir = "./masterdata/"
projDir = "./"
assetsDir = f"{projDir}/src/assets/"
outDir = assetsDir if OverrideJson else "./tmp/"


classTable = {0: None, 1: "ソルジャー", 2: "ランサー", 3: "ライダー", 4: "セイント", 5: "ソーサラー", 6: "シューター", 7: "エアリアル", 8: "アサシン", 99: "ヴォイド"}
symbolTable = [None, "ゼニス", "オリジン", "ナディア"]
supportTypeTable = [None, "支援", "攻撃", "妨害"]
rarityTable = [None, "N", "R", "SR", "SSR"]
attackTypeTable = [None, "アタック", "マジック"]

rangeTypeTable = [None, "自身", "射程", "全体"]
areaTypeTable = [None, "単体", "全体", "範囲", "直線"]

equipTypeTable = [None, "武器", "鎧", "兜", "アクセサリ"]
amuletTypeTable = [None, "月", "太陽"]

timingTypeTable = {
    0: None,
    1: "ターン開始時",
    2: "範囲効果",
    3: "戦闘前",
    4: "サポート同時攻撃",
    5: "戦闘時",
    6: "戦闘後",
    7: "行動終了時",
    9: "敵撃破時",
}

statusTypeTable = {
    0: None,
    1: "HP",
    2: "アタック",
    3: "ディフェンス",
    4: "マジック",
    5: "レジスト",
    6: "テクニック",
    7: "クリティカル率",
    8: "クリティカル率耐性",
    9: "与ダメージ",
    10: "与ダメージ(物理)",
    11: "与ダメージ(魔法)",
    12: "クリティカルダメージ倍率",
    13: "ダメージ耐性",
    14: "ダメージ耐性(物理)",
    15: "ダメージ耐性(魔法)",
    16: "治療効果",
    17: "射程(通常攻撃)",
    18: "移動",
    19: "与ダメージ(範囲スキル)",
    20: "ランダムデバフ？",
    21: "ダメージ耐性(範囲)",
    22: "射程(スキル)",
    23: "与ダメージ(スキル)",
    24: "被治療効果",
    25: "ディフェンス無視",
    26: "レジスト無視",
    27: "???",
    28: "範囲",
    29: "???",
    30: "???",
    31: "与ダメージ(通常攻撃)",
}


def download(url, dir="tmp"):
    outpath = dir + os.path.basename(url)
    if os.path.exists(outpath):
        #print(f"skipped: {url}")
        return False
    with open(outpath, mode='wb') as f:
        f.write(requests.get(url).content)
        print("downloaded: " + url)
        return True

def downloadSkillIcon(name):
    baseURL = "https://asset.legend-clover.net/pcr/ui/icon/skillicon/"
    return download(f"{baseURL}{name}.png", "tmp/icon/")

def downloadEquipIcon(name):
    baseURL = "https://asset.legend-clover.net/pcr/ui/thumbnail/baggage/equip/"
    return download(f"{baseURL}{name}.png", "tmp/icon/")


def insertAfter(dic, posKey, additional):
    keysToDel = {}
    partitioning = False
    for k in dic:
        if partitioning:
            keysToDel.append(k)
        elif k == posKey:
            partitioning = True
    partitioned = {}
    for k in keysToDel:
        partitioned[k] = dic.pop(k)
    for k in additional:
        dic[k] = additional[k]
    for k in partitioned:
        dic[k] = partitioned[k]
    return dic

def fileToCsvLines(path):
    with open(path, 'r', encoding="utf-8") as file:
        content = file.read()
    line = ''
    i = 0
    quoted = False
    while i < len(content):
        if content[i] == '"':
            quoted = not quoted
        if quoted:
            line += content[i]
        else:
            if content[i] == '\n':
                yield line
                line = ''
            else:
                line += content[i]
        i += 1
    if line:
        yield line

def csvToTable(csv):
    header = None
    ret = []
    for i, line in enumerate(csv):
        if i==1:
           header = line
        elif i>=2:
            tmp = {}
            for j, field in enumerate(line):
                tmp[header[j]] = field
            ret.append(tmp)
    return ret

def readCsv(path):
    return csv.reader(fileToCsvLines(path))

def readCsvTable(path):
    return csvToTable(csv.reader(fileToCsvLines(path)))


def find(ls, cond):
    for a in ls:
        if cond(a):
            return a;
    return None;

def findByUid(ls, uid):
    for a in ls:
        if a["uid"] == uid:
            return a
    return None

def findByName(ls, name):
    for a in ls:
        if a["name"] == name:
            return a
    return None

def findByCid(csv, cid):
    if "CharacterID" in csv[0]:
        for a in csv:
            if a["CharacterID"] == cid:
                return a
    elif "CharacterId" in csv[0]:
        for a in csv:
            if a["CharacterId"] == cid:
                return a
    return None


def cleanupDesc(desc):
    # マスターデータの説明文の誤字や表記揺れを矯正
    desc = desc.rstrip()
    for pattern in [
        ['％', '%'],
        ['ｰ', '-'],
        ['\)\)', ')'],
        ['\(/', '('],
        ['クームタイム', 'クールタイム'],
        ['%\n行動終了時', '%。\n行動終了時'],
        ['\)敵ユニット', ')。敵ユニット'],
        [r'。 +', '。'],
    ]:
        desc = re.sub(pattern[0], pattern[1], desc)
    return desc

def compareDesc(desc1, desc2):
    # [b] などのマークアップを除去した内容と比較
    return re.sub(r'\[[^]]+\]', r'', desc1) == desc2

def updateDesc(dst, desc):
    if "desc" in dst:
        if compareDesc(dst["desc"], desc):
            return
    dst["desc"] = desc

def updateDescs(dst, descs):
    if "descs" in dst:
        eq = True
        prev = ""
        vals = []
        for k in descs:
            if not compareDesc(dst["descs"][k], descs[k]):
                #print(f"{dst['descs'][k]} : {descs[k]}")
                eq = False
                break

            # マークアップされていない変数を探して通知
            def cb(mo):
                vals.append(mo.group(2))
                return "[variable]"
            desc = re.sub(r'\[([^]]+)\](.+?)\[/\1\]', cb, dst['descs'][k])
            if prev and desc != prev and not '100%' in vals:
                print(f"!! {desc} {vals}")
            prev = desc
        if eq:
            return
    dst["descs"] = descs

def getOrAdd(dic, key, val):
    ret = dic.get(key)
    if not ret:
        ret = dic[key] = val
    return ret

def parseSkillCsv(csv, skillType = None):
    ret = {}
    for l in csv:
        sid = l["SkillGroupId"]
        idx = int(l["SkillSettingType"])

        value = l["MainSettingValue"]
        values = list(map(lambda a: l[a],  ["FirstSettingValue", "SecondSettingValue", "ThirdSettingValue", "FourthSettingValue", "FifthSettingValue", "SixthSettingValue"]))
        value1 = values[0]

        def getEffectRecord():
            efgid = int(l["SkillEffectGroupingId"])
            effects = getOrAdd(r, "effects", {})
            ret = getOrAdd(effects, efgid, {})
            return ret;

        if not sid in ret:
            ret[sid] = {"id": sid}
        r = ret[sid]
        if idx == 2:
            if skillType:
                r["skillType"] = skillType
            r["name"] = value
        elif idx == 3:
            r["icon"] = value.lower()
        elif idx == 4:
            if l["SecondSettingValue"]:
                r["descs"] = list(map(lambda a: cleanupDesc(a), values))
            else:
                r["desc"] = cleanupDesc(value1)
        elif idx == 7 and (value or value1):
            r["rangeType"] = value
            r["range"] = value1
        elif idx == 8 and (value or value1):
            r["areaType"] = value
            r["area"] = value1
        elif idx == 9 and value1:
            r["ct"] = value1
        elif idx == 10 and value1:
            r["cost"] = value1
        elif idx >= 20:
            er = getEffectRecord()

            efi = l["SkillEffectIndex"]
            efi = int(efi) if efi else 0

            data = getOrAdd(er, "data", {})
            rr = getOrAdd(data, efi, {})
            rr[idx] = [value, value1]

            if idx == 20:
                er["desc"] = value1
            elif idx == 28:
                er["valueType"] = value
                er["value"] = value1
            elif idx == 29:
                if value:
                    c = int(value)
                    if c < len(classTable):
                        er["antiClass"] = classTable[c]
                        er["antiValue"] = value1
    return ret



chrCsv             = readCsvTable(f"{csvDir}/Character/Character.csv")
initStatusCsv      = readCsvTable(f"{csvDir}/Character/CharacterInitStatus.csv")
mainLvStatusCsv    = readCsvTable(f"{csvDir}/Character/MainCharacterLevelStatus.csv")
mainStarStatusCsv  = readCsvTable(f"{csvDir}/Character/MainCharacterBreakLimitStatus.csv")
supLvStatusCsv     = readCsvTable(f"{csvDir}/Character/SupportCharacterLevelStatus.csv")
supStarStatusCsv   = readCsvTable(f"{csvDir}/Character/SupportCharacterBreakLimitStatus.csv")
talentSkillCsv     = readCsvTable(f"{csvDir}/Character/CharacterTalentSkill.csv")
supSkillCsv        = readCsvTable(f"{csvDir}/Character/SupportCharacterAbilitySkill.csv")
skillSettingCsv    = readCsvTable(f"{csvDir}/TrainingBoard/SkillSetting.csv")
itemListCsv        = readCsvTable(f"{csvDir}/Item/ItemList.csv")
equipmentsCsv      = readCsvTable(f"{csvDir}/Item/EquipmentList.csv")
amuletsCsv         = readCsvTable(f"{csvDir}/Item/AmuletList.csv")

mainActiveCsv      = parseSkillCsv(readCsvTable(f"{csvDir}/Skill/SkillListActive.csv"), "アクティブ")
mainPassiveCsv     = parseSkillCsv(readCsvTable(f"{csvDir}/Skill/SkillListPassive.csv"), "パッシブ")
mainTalentCsv      = parseSkillCsv(readCsvTable(f"{csvDir}/Skill/SkillListTalent.csv" ), "タレント")
supActiveCsv       = parseSkillCsv(readCsvTable(f"{csvDir}/Skill/SkillListSupportAbility.csv"), "アクティブ")
supPassiveCsv      = parseSkillCsv(readCsvTable(f"{csvDir}/Skill/SkillListSupportPassive.csv"), "パッシブ")
itemEffectCsv      = parseSkillCsv(readCsvTable(f"{csvDir}/Skill/SkillListEquipment.csv"))
summonEffectCsv    = readCsvTable(f"{csvDir}/Skill/SummonEffect.csv")

skillTable = {**mainActiveCsv, **mainPassiveCsv, **mainTalentCsv, **supActiveCsv, **supPassiveCsv, **itemEffectCsv}
itemTable = equipmentsCsv + amuletsCsv

imageTable = {}


def processCharacters(chrJson, activeJson, passiveJson, talentJson = None):
    mainOrSupport = 0
    chrSkills = {}

    for ch in chrJson:
        cid = ch["uid"]

        l = findByCid(chrCsv, cid)

        name = l["CharacterName"].replace('（', '(').replace('）', ')')
        if not "name" in ch:
            ch["name"] = name
            ch["date"] = datetime.datetime.now().strftime("%Y/%m/%d")

        ch["class"] = classTable[int(l["SoldierType"])]
        if l["ForceType"]:
            ch["symbol"] = symbolTable[int(l["ForceType"])]
            mainOrSupport = 1
        if l["SupportType"] != "0":
            ch["supportType"] = supportTypeTable[int(l["SupportType"])]
            mainOrSupport = 2
        ch["rarity"] = rarityTable[min(int(l["Rarity"]), 4)]
        ch["damageType"] = attackTypeTable[int(l["CharacterAttackType"])]
        ch["range"] = int(l["AttackRange"])
        chrSkills[cid] = []
        if mainOrSupport == 1:
            ch["move"] = int(l["MovingValue"])
            talent = skillTable[ findByCid(talentSkillCsv, cid)["TalentSkillGroupId"] ]
            talent["cid"] = cid
            chrSkills[cid].append(talent)
            chrSkills[cid].append(skillTable[l["InitialSkillId"]])
        elif mainOrSupport == 2:
            active = skillTable[ findByCid(supSkillCsv, cid)["AbilitySkillGroupId"] ]
            active["cid"] = cid
            chrSkills[cid].append(active)

        l = findByCid(initStatusCsv, cid)
        ch["statusInit"] = list(map(lambda s: int(s), [l["HP"], l["ATK"], l["DEF"], l["MATK"], l["MDEF"], l["DEX"]]))

        if "summon" in ch:
            summons = ch["summon"]
            for su in summons:
                sid = su["uid"]

                l = findByCid(chrCsv, sid)
                su["name"] = l["CharacterName"]
                su["class"] = classTable[int(l["SoldierType"])]
                su["damageType"] = attackTypeTable[int(l["CharacterAttackType"])]
                su["range"] = int(l["AttackRange"])
                su["move"] = int(l["MovingValue"])

                sec = findByCid(summonEffectCsv, sid)
                chrSkills[sid] = []
                for k in ["TalentSkillGroupId", "FirstSkillGroupId", "SecondSkillGroupId", "ThirdSkillGroupId"]:
                    sk = sec[k]
                    if sk in skillTable:
                        skill = skillTable[sk]
                        print(skill)
                        chrSkills[sid].append(skill)
                skillNames = list(map(lambda a: a["name"], chrSkills[sid]))
                print(l)
                print(sec)
                print(skillNames)
                su["talent"] = skillNames.pop(0)
                su["skills"] = skillNames


    lvCsv = None
    starCsv = None
    if mainOrSupport == 1:
        lvCsv = mainLvStatusCsv
        starCsv = mainStarStatusCsv
    elif mainOrSupport == 2:
        lvCsv = supLvStatusCsv
        starCsv = supStarStatusCsv

    for ch in chrJson:
        cid = ch["uid"]
        l = findByCid(lvCsv, cid)
        ch["statusLv"] = list(map(lambda s: float(s), [l["UpHP"], l["UpATK"], l["UpDEF"], l["UpMATK"], l["UpMDEF"], l["UpDEX"]]))
        l = findByCid(starCsv, cid)
        ch["statusStar"] = list(map(lambda s: float(s), [l["UpHP"], l["UpATK"], l["UpDEF"], l["UpMATK"], l["UpMDEF"], l["UpDEX"]]))

    for cid in chrSkills:
        for l in skillSettingCsv:
            if l["CharacterID"] == cid:
                sid = l["SkillGroupID"]
                skill = skillTable.get(sid)
                if skill:
                    chrSkills[cid].append(skill)

    if mainOrSupport == 1:
        for ch in chrJson:
            cid = ch["uid"]
            skills = list(map(lambda a: a["name"], chrSkills[cid]))
            ch["talent"] = skills[0]
            ch["skills"] = skills[1:7]
    elif mainOrSupport == 2:
        for ch in chrJson:
            cid = ch["uid"]
            skills = list(map(lambda a: a["name"], chrSkills[cid]))
            ch["skills"] = skills


    def getBaseSkillLevel(cid):
        l = findByCid(chrCsv, cid)
        return int(l["Rarity"]) - 2

    skillIds = set()
    for cid in chrSkills:
        for skill in chrSkills[cid]:
            skillIds.add(skill["id"])
    for sid in skillIds:
        skill = skillTable[sid]
        skillType = skill["skillType"]
        name = skill["name"]

        downloadSkillIcon(skill["icon"])
        if not name in imageTable:
            imageTable[name] = f"{skill['icon']}.png"

        if skillType == "アクティブ":
            js = findByName(activeJson, name);
            if not js:
                js = {"name": name}
                activeJson.append(js);

            if mainOrSupport == 1:
                updateDesc(js, skill["desc"])
            elif mainOrSupport == 2:
                descs = {}
                baseSkillLevel = getBaseSkillLevel(skill["cid"])
                for (lv, desc) in enumerate(skill["descs"]):
                    if lv >= baseSkillLevel:
                        descs[f"Lv {lv + 1}"] = desc
                updateDescs(js, descs)

            if "ct" in skill:
                ct = int(skill["ct"])
                js["ct"] = ct if ct != 0 else "-"
            if True:
                areaType = int(skill["areaType"])
                if areaType == 1:
                    js["area"] = "単体"
                elif areaType == 2:
                    js["area"] = "全体"
                elif areaType == 3:
                    js["area"] = int(skill["area"])
                elif areaType == 4:
                    js["area"] = f"直線{skill['area']}マス"
            if True:
                rangeType = int(skill["rangeType"])
                if rangeType == 1:
                    js["range"] = "自ユニット"
                elif rangeType == 2:
                    js["range"] = int(skill["range"])
                elif rangeType == 3:
                    js["range"] = "全体"
            if "cost" in skill and mainOrSupport == 1:
                js["cost"] = int(skill["cost"])
        elif skillType == "パッシブ":
            js = findByName(passiveJson, name);
            if not js:
                js = {"name": name}
                passiveJson.append(js);
            updateDesc(js, skill["desc"])
            if "cost" in skill and mainOrSupport == 1:
                js["cost"] = int(skill["cost"])
        elif skillType == "タレント":
            js = findByName(talentJson, name);
            if not js:
                js = {"name": name}
                talentJson.append(js);

            if "descs" in skill:
                descs = {}
                for (lv, desc) in enumerate(skill["descs"]):
                    if desc=="未使用" or desc=="使用しない":
                        continue
                    descs[f"Lv {lv + 1}"] = desc
                updateDescs(js, descs)
            elif "desc" in skill:
                updateDesc(js, skill["desc"])


def processItems(itemJson):
    for item in itemJson:
        iid = item["uid"]

        il = find(itemListCsv, lambda a: a["ItemId"] == iid)
        el = find(itemTable, lambda a: a["ItemId"] == iid)
        if not il or not el:
            print(f"item not found : {iid}")
            continue

        name = il["Name"].replace('（', '(').replace('）', ')')
        if not "name" in item:
            item["name"] = name
            item["date"] = datetime.datetime.now().strftime("%Y/%m/%d")

        resourceId = il["ResourceId"].lower()
        downloadEquipIcon(resourceId)
        if not name in imageTable:
            imageTable[name] = f"{resourceId}.png"

        if "PartsType" in el:
            item["slot"] = equipTypeTable[int(el["PartsType"])]
        if "AmuletType" in el:
            item["amuletType"] = amuletTypeTable[int(el["AmuletType"])]
        item["rarity"] = rarityTable[int(il["Rarity"])]

        if "SoldierTypeCondition" in el:
            classes = el["SoldierTypeCondition"]
            if classes:
                item["classes"] = list(map(lambda i: classTable[int(i)] , classes.split("\n")))

        if "SkillGroupId" in el:
            sid = el["SkillGroupId"]
            skill = skillTable.get(sid)
            updateDesc(item, skill["descs"][4])

        item["statusInit"] = [0, 0, 0, 0, 0, 0]
        item["statusLv"] = [0, 0, 0, 0, 0, 0]
        for sv in [
            [int(el["StatusType1"]) - 1, float(el["InitStatus1"]), float(el["UpStatus1"])],
            [int(el["StatusType2"]) - 1, float(el["InitStatus2"]), float(el["UpStatus2"])] ]:
            item["statusInit"][sv[0]] = sv[1]
            item["statusLv"][sv[0]] = sv[2]

        #for f in ["EquipmentType", "SoldierTypeCondition", "CharacterCondition", "AmuletType", "AbilityGroupId1", "AbilityGroupId2"]:
        #    if f in el:
        #        item[f] = el[f]


def readJson(path):
    return json.load(open(path, encoding="utf-8"))

def writeJson(path, obj):
    with open(path, 'w', encoding="utf-8") as f:
        options = jsbeautifier.default_options()
        options.indent_size = 2
        f.write(jsbeautifier.beautify(json.dumps(obj, ensure_ascii=False), options))

def dumpSkillData():
    writeJson(f"{outDir}/main_active_raw.json", mainActiveCsv)
    writeJson(f"{outDir}/main_passive_raw.json", mainPassiveCsv)
    writeJson(f"{outDir}/main_talent_raw.json", mainTalentCsv)
    writeJson(f"{outDir}/support_active_raw.json", supActiveCsv)
    writeJson(f"{outDir}/support_passive_raw.json", supPassiveCsv)
    writeJson(f"{outDir}/item_skills_raw.json", itemEffectCsv)


def proceccMainChr():
    chr = readJson(f"{assetsDir}/main_characters.json")
    active = readJson(f"{assetsDir}/main_active.json")
    passive = readJson(f"{assetsDir}/main_passive.json")
    talent = readJson(f"{assetsDir}/main_talents.json")
    processCharacters(chr, active, passive, talent)
    writeJson(f"{outDir}/main_characters.json", chr)
    writeJson(f"{outDir}/main_active.json", active)
    writeJson(f"{outDir}/main_passive.json", passive)
    writeJson(f"{outDir}/main_talents.json", talent)


def processSupChr():
    chr = readJson(f"{assetsDir}/support_characters.json")
    active = readJson(f"{assetsDir}/support_active.json")
    passive = readJson(f"{assetsDir}/support_passive.json")
    processCharacters(chr, active, passive)
    writeJson(f"{outDir}/support_characters.json", chr)
    writeJson(f"{outDir}/support_active.json", active)
    writeJson(f"{outDir}/support_passive.json", passive)


def processEquipments():
    items = readJson(f"{assetsDir}/items.json")
    processItems(items)
    writeJson(f"{outDir}/items.json", items)

        

os.makedirs("tmp/icon", exist_ok = True)
imageTable = readJson(f"{assetsDir}/image_table.json")

#dumpSkillData()
proceccMainChr()
processSupChr()
processEquipments()

writeJson(f"{outDir}/image_table.json", imageTable)
