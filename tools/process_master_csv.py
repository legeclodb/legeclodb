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
    27: "移動コストを1にする",
    28: "範囲",
    29: "ディフェンスとレジストのどちらか高い方",
    30: "ディフェンスとレジストのどちらか低い方",
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
            for j in range(min(len(line), len(header))):
                tmp[header[j]] = line[j]
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

def findByField(ls, fieldName, fieldValue):
    for a in ls:
        if a[fieldName] == fieldValue:
            return a
    return None

def filterByField(ls, fieldName, fieldValue):
    for a in ls:
        if a[fieldName] == fieldValue:
            yield a

def findByUid(ls, uid):
    return findByField(ls, "uid", uid)

def findByCid(csv, cid):
    if "CharacterID" in csv[0]:
        return findByField(csv, "CharacterID", cid)
    elif "CharacterId" in csv[0]:
        return findByField(csv, "CharacterId", cid)

def filterByCid(csv, cid):
    if "CharacterID" in csv[0]:
        for a in csv:
            if a["CharacterID"] == cid:
                yield a
    elif "CharacterId" in csv[0]:
        for a in csv:
            if a["CharacterId"] == cid:
                yield a


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

engageCsv          = readCsvTable(f"{csvDir}/Engage/Engage.csv")
engageSkillCsv     = readCsvTable(f"{csvDir}/Engage/EngageSkill.csv")

enemyMainLvStatusCsv    = readCsvTable(f"{csvDir}/Character/EnemyMainLevelStatus.csv")
enemySupportLvStatusCsv = readCsvTable(f"{csvDir}/Character/EnemySupportLevelStatus.csv")



skillTable = {**mainActiveCsv, **mainPassiveCsv, **mainTalentCsv, **supActiveCsv, **supPassiveCsv, **itemEffectCsv}
itemTable = equipmentsCsv + amuletsCsv

imageTable = {}



# エンゲージ情報
engageInfo = {}
engageSkillTable = {}
def processEngageData():
    for e in engageCsv:
        cid = e["CharacterID"]
        engageInfo[cid] = { "cid": cid, "date": re.sub(r' \d{2}:\d{2}', '', e["ReleaseDate"]), "skills": [] }
    for e in engageSkillCsv:
        cid = e["CharacterID"]
        before = e["BeforeSkillGroupID"]
        after = e["AfterSkillGroupID"]

        desc = e["EffectDescription"]
        desc = re.sub(r'<color=[^>]+>＿+</color>', '', desc)
        desc = re.sub(r'<color=[^>]+>(.+?)</color>', '[b]\\1[/b]', desc)
        skillTable[after]["desc"] = desc

        if not cid in engageSkillTable:
            engageSkillTable[cid] = {}
        engageSkillTable[cid][before] = after

    #print(engageInfo)



# キャラ情報
def processCharacters(args):
    isMain = args.talentJson != None
    isSupport = args.talentJson == None
    isEnemy = args.lvStatusCsv != None
    chrSkills = {}
    engageSkills = {}
    skillIds = set()

    def getStatusValues(t):
        return [int(t["HP"]), int(t["ATK"]), int(t["DEF"]), int(t["MATK"]), int(t["MDEF"]), int(t["DEX"])]

    def getStatusUpValues(t):
        return [float(t["UpHP"]), float(t["UpATK"]), float(t["UpDEF"]), float(t["UpMATK"]), float(t["UpMDEF"]), float(t["UpDEX"])]

    # ここで各キャラを処理
    for ch in args.chrJson:
        cid = ch["uid"]
        l = findByCid(chrCsv, cid)

        name = l["CharacterName"].replace('（', '(').replace('）', ')')
        if not "name" in ch:
            ch["name"] = name
            if not isEnemy:
                ch["date"] = datetime.datetime.now().strftime("%Y/%m/%d")

        icon = l["ThumbnailResourceID"]
        ch["icon"] = icon
        if not icon in imageTable:
            imageTable[icon] = f"Default_{re.sub(r'^Ch', '', icon)}.png"

        ch["class"] = classTable[int(l["SoldierType"])]
        if l["ForceType"]:
            ch["symbol"] = symbolTable[int(l["ForceType"])]
        if l["SupportType"] != "0":
            ch["supportType"] = supportTypeTable[int(l["SupportType"])]
        rarity = rarityTable[min(int(l["Rarity"]), 4)]
        if rarity:
            ch["rarity"] = rarity
        ch["damageType"] = attackTypeTable[int(l["CharacterAttackType"])]
        ch["range"] = int(l["AttackRange"])
        if isMain:
            ch["move"] = int(l["MovingValue"])

        # スキルは chrSkills に突っ込んで後で別途処理
        if not isEnemy:
            chrSkills[cid] = []
            if isMain:
                rec = findByCid(talentSkillCsv, cid)
                talent = skillTable[ rec["TalentSkillGroupId"] ]
                chrSkills[cid].append(talent)
                chrSkills[cid].append(skillTable[l["InitialSkillId"]])
            elif isSupport:
                rec = findByCid(supSkillCsv, cid)
                active = skillTable[ rec["AbilitySkillGroupId"] ]
                chrSkills[cid].append(active)
            
            ch["statusInit"] = getStatusValues(findByCid(initStatusCsv, cid))

        # エンゲージ情報
        if cid in engageInfo:
            ei = engageInfo[cid]
            if not "engage" in ch:
                ch["engage"] = {}
            engage = ch["engage"]
            engage["date"] = ei["date"]

        # 召喚ユニット
        if "summon" in ch:
            summons = ch["summon"]
            for su in summons:
                sid = su["uid"]

                # 基礎データ
                l = findByCid(chrCsv, sid)
                su["name"] = l["CharacterName"]
                su["class"] = classTable[int(l["SoldierType"])]
                su["damageType"] = attackTypeTable[int(l["CharacterAttackType"])]
                su["range"] = int(l["AttackRange"])
                su["move"] = int(l["MovingValue"])

                # ステータス
                # 召喚ユニットや敵ユニットは 初期値 と 10　レベル刻みの数値になっている
                stats = {}
                stats[1] = getStatusValues(findByCid(initStatusCsv, sid))
                for v in filterByCid(enemyMainLvStatusCsv, sid):
                    stats[int(v["Lv"])] = getStatusValues(v)
                su["statusLvs"] = stats

                # スキル
                sec = findByCid(summonEffectCsv, sid)
                chrSkills[sid] = []
                for k in ["TalentSkillGroupId", "FirstSkillGroupId", "SecondSkillGroupId", "ThirdSkillGroupId"]:
                    sk = sec[k]
                    if sk in skillTable:
                        skill = skillTable[sk]
                        chrSkills[sid].append(skill)
                sids = list(map(lambda a: a["id"], chrSkills[sid]))
                su["talent"] = sids.pop(0)
                su["skills"] = sids

    # レベル上昇値 & ☆上昇値
    if args.lvCsv and args.starCsv:
        for ch in args.chrJson:
            cid = ch["uid"]
            ch["statusLv"] = getStatusUpValues(findByCid(args.lvCsv, cid))
            ch["statusStar"] = getStatusUpValues(findByCid(args.starCsv, cid))
    elif args.lvStatusCsv:
        for ch in args.chrJson:
            cid = ch["uid"]
            stats = {}
            stats[1] = getStatusValues(findByCid(initStatusCsv, cid))
            for v in filterByCid(args.lvStatusCsv, cid):
                stats[int(v["Lv"])] = getStatusValues(v)
            ch["statusLvs"] = stats

    # スキルシートから各キャラのスキル取得
    if not isEnemy:
        for cid in chrSkills:
            for l in skillSettingCsv:
                if l["CharacterID"] == cid:
                    sid = l["SkillGroupID"]
                    skill = skillTable.get(sid)
                    if skill:
                        chrSkills[cid].append(skill)

        if isMain:
            for ch in args.chrJson:
                cid = ch["uid"]
                skills = list(map(lambda a: a["id"], chrSkills[cid]))
                ch["talent"] = skills[0]
                ch["skills"] = skills[1:7]

                if cid in engageSkillTable:
                    table = engageSkillTable[cid]
                    eskills = ch["skills"].copy()
                    for idx, sid in enumerate(eskills):
                        if sid in table:
                            esid = table[sid]
                            eskills[idx] = esid
                            skillIds.add(esid)
                    ch["engage"]["skills"] = eskills
        elif isSupport:
            for ch in args.chrJson:
                cid = ch["uid"]
                skills = list(map(lambda a: a["id"], chrSkills[cid]))
                ch["skills"] = skills
                chrSkills[cid][0]["cid"] = cid

        # 使用されているスキルを抽出してデータをセットアップ
        for cid in chrSkills:
            for skill in chrSkills[cid]:
                skillIds.add(skill["id"])
        addSkills(args, skillIds)


def addSkills(args, skillIds):
    isMain = args.talentJson != None
    isSupport = args.talentJson == None
    iconTable = {}

    def getBaseSkillLevel(cid):
        l = findByCid(chrCsv, cid)
        return int(l["Rarity"]) - 2

    for sid in skillIds:
        skill = skillTable[sid]
        skillType = skill["skillType"]
        name = re.sub(r'<color=[^>]+>(.+?)</color>', '\\1', skill["name"]) 

        # ここでアイコン取得
        iconName = skill["icon"]
        if not iconName in imageTable:
            downloadSkillIcon(iconName)
            imageTable[iconName] = f"{skill['icon']}.png"

        js = None
        if skillType == "アクティブ":
            js = findByUid(args.activeJson, sid);
            if not js:
                js = {}
                args.activeJson.append(js);

            js["name"] = name
            if isMain:
                updateDesc(js, skill["desc"])
            elif isSupport:
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
            if "cost" in skill and isMain:
                js["cost"] = int(skill["cost"])
        elif skillType == "パッシブ":
            js = findByUid(args.passiveJson, sid);
            if not js:
                js = {"name": name}
                args.passiveJson.append(js);
            updateDesc(js, skill["desc"])
            if "cost" in skill and isSupport:
                js["cost"] = int(skill["cost"])
        elif skillType == "タレント":
            js = findByUid(args.talentJson, sid);
            if not js:
                js = {"name": name}
                args.talentJson.append(js);

            # 召喚ユニットのタレント説明文は 1 つだけだったりレベル別に用意されていたりする
            if "descs" in skill:
                descs = {}
                for (lv, desc) in enumerate(skill["descs"]):
                    if desc=="未使用" or desc=="使用しない":
                        continue
                    descs[f"Lv {lv + 1}"] = desc
                updateDescs(js, descs)
            elif "desc" in skill:
                updateDesc(js, skill["desc"])

        js["uid"] = skill["id"]
        js["icon"] = skill["icon"]


# アイテム情報
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
        if not iid in imageTable:
            imageTable[iid] = f"{resourceId}.png"

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


class ChrArgs:
  def __init__(self):
      self.chrJson = None
      self.activeJson = None
      self.passiveJson = None
      self.talentJson = None
      self.lvCsv = None
      self.starCsv = None
      self.lvStatusCsv = None
      self.additionalSkills = None


def proceccMainChr():
    args = ChrArgs()
    args.chrJson = readJson(f"{assetsDir}/main_characters.json")
    args.activeJson = readJson(f"{assetsDir}/main_active.json")
    args.passiveJson = readJson(f"{assetsDir}/main_passive.json")
    args.talentJson = readJson(f"{assetsDir}/main_talents.json")
    args.lvCsv = mainLvStatusCsv
    args.starCsv = mainStarStatusCsv
    processCharacters(args)
    writeJson(f"{outDir}/main_characters.json", args.chrJson)
    writeJson(f"{outDir}/main_active.json", args.activeJson)
    writeJson(f"{outDir}/main_passive.json", args.passiveJson)
    writeJson(f"{outDir}/main_talents.json", args.talentJson)

def processSupChr():
    args = ChrArgs()
    args.chrJson = readJson(f"{assetsDir}/support_characters.json")
    args.activeJson = readJson(f"{assetsDir}/support_active.json")
    args.passiveJson = readJson(f"{assetsDir}/support_passive.json")
    args.lvCsv = supLvStatusCsv
    args.starCsv = supStarStatusCsv
    processCharacters(args)
    writeJson(f"{outDir}/support_characters.json", args.chrJson)
    writeJson(f"{outDir}/support_active.json", args.activeJson)
    writeJson(f"{outDir}/support_passive.json", args.passiveJson)


def processEquipments():
    items = readJson(f"{assetsDir}/items.json")
    processItems(items)
    writeJson(f"{outDir}/items.json", items)



def proceccEnemyMainChr():
    args = ChrArgs()
    args.chrJson = readJson(f"{assetsDir}/enemy_main_characters.json")
    args.activeJson = readJson(f"{assetsDir}/main_active.json")
    args.passiveJson = readJson(f"{assetsDir}/main_passive.json")
    args.talentJson = readJson(f"{assetsDir}/main_talents.json")
    args.lvStatusCsv = enemyMainLvStatusCsv
    processCharacters(args)
    writeJson(f"{outDir}/enemy_main_characters.json", args.chrJson)
    writeJson(f"{outDir}/main_active.json", args.activeJson)
    writeJson(f"{outDir}/main_passive.json", args.passiveJson)
    writeJson(f"{outDir}/main_talents.json", args.talentJson)

def processEnemySupChr():
    args = ChrArgs()
    args.chrJson = readJson(f"{assetsDir}/enemy_support_characters.json")
    args.activeJson = readJson(f"{assetsDir}/support_active.json")
    args.passiveJson = readJson(f"{assetsDir}/support_passive.json")
    args.lvStatusCsv = enemySupportLvStatusCsv
    processCharacters(args)
    writeJson(f"{outDir}/enemy_support_characters.json", args.chrJson)
    writeJson(f"{outDir}/support_active.json", args.activeJson)
    writeJson(f"{outDir}/support_passive.json", args.passiveJson)

def proceccBattleCsv():
    battleCsv = readCsvTable(f"{csvDir}/Battle/Battle_Guild_Ex02.csv")
    eventCsv = readCsvTable(f"{csvDir}/SimulationEvent/SimulationEvent.csv")
    writeJson(f"{outDir}/guild_ex2.json", battleCsv)

    mainJson = readJson(f"{assetsDir}/enemy_main_characters.json")
    mainActiveJson = readJson(f"{assetsDir}/main_active.json")
    mainPassiveJson = readJson(f"{assetsDir}/main_passive.json")
    mainTalentJson = readJson(f"{assetsDir}/main_talents.json")

    supJson = readJson(f"{assetsDir}/enemy_support_characters.json")
    supActiveJson = readJson(f"{assetsDir}/support_active.json")
    supPassiveJson = readJson(f"{assetsDir}/support_passive.json")

    corKeys = ["HPCorrection", "ATKCorrection", "DEFCorrection", "MATKCorrection", "MDEFCorrection", "DEXCorrection"]
    skillKeys = ["TalentSkillGroupId", "FirstSkillGroupId", "SecondSkillGroupId", "ThirdSkillGroupId"]
    mainSkillIds = set()
    supSkillIds = set()

    def makeBattle(uid):
        return {
            "uid": uid,
            "leftTop": [0, 0],
            "rightDown": [0, 0],
            "allies": [],
            "enemies": [],
            }

    def massToInt2(mass):
        m = re.match(r'(\d+),(\d+)', mass)
        return [int(m.group(1)) - 1, int(m.group(2)) - 1]

    battleList = readJson(f"{assetsDir}/battle.json")
    battle = None

    for line in battleCsv:
        bid = line["BattleID"]
        if bid and line["VerID"] != "dummy":
            battle = findByUid(battleList, bid)
            if not battle:
                battle = makeBattle(bid)
                battleList.append(battle)
            battle["leftTop"] = massToInt2(line["MapRangeLeftTop"])
            battle["rightDown"] = massToInt2(line["MapRangeRightDown"])
            battle["allies"] = []
            battle["enemies"] = []

        coord = massToInt2(line["MassData"])
        fid = line["FormationId"]
        if fid and re.match(r'A\d+', fid):
            battle["allies"].append({
                "fid": fid,
                "coord": coord,
                "phase": "0",
            })
        elif fid and re.match(r'E\d+', fid):
            unit = findByField(battle["enemies"], "fid", fid)
            if not unit:
                unit = {
                    "fid": fid,
                    "coord": coord,
                    "phase": "0",
                }
                battle["enemies"].append(unit)

            cid = line["CharacterId"]
            if cid:
                mainOrSupport = line["CharacterType"] # 1: メイン 2: サポート
                dst = None

                def fillCommonData():
                    dst["cid"] = cid
                    dst["level"] = int(line["Level"])
                    dst["statusRate"] = list(map(lambda k: int(line[k]), corKeys))

                if mainOrSupport == "1":
                    dst = {}
                    unit["main"] = dst
                    fillCommonData()
                    if not findByUid(mainJson, cid):
                        mainJson.append({"uid": cid})
                    dst["skills"] = []
                    for k in skillKeys:
                        sid = line[k]
                        if sid:
                            mainSkillIds.add(sid)
                            if k == skillKeys[0]:
                                dst["talent"] = sid
                            else:
                                dst["skills"].append(sid)

                elif mainOrSupport == "2":
                    dst = {}
                    unit["support"] = dst
                    fillCommonData()
                    if not findByUid(supJson, cid):
                        supJson.append({"uid": cid})
                    for k in skillKeys:
                        sid = line[k]
                        if sid:
                            supSkillIds.add(sid)

    #eventContent = {
    #    0: None,
    #    1: "コマ劇発生",
    #    2: "指定の敵ユニット出現",
    #    3: "指定のNPCユニット出現",
    #    4: "ランダム敵ユニット出現",
    #    5: "ランダムNPCユニット出現",
    #    6: "指定の敵ユニット退場",
    #    7: "指定のNPCユニット退場",
    #    8: "指定のイベント発生",
    #    9: "指定バトルBGMに切り替え",
    #}
    #eventTrigger = {
    #    0: None,
    #    1: "指定ターンの味方フェーズ開始時",
    #    2: "指定のターン開始時",
    #    3: "指定のユニット戦闘不能",
    #    4: "味方ユニットの指定の目標移動",
    #    5: "敵ユニットの指定の目標移動",
    #    6: "指定のチュートリアル終了時",
    #    7: "対象パーティ全滅",
    #    8: "指定ターンの敵フェーズ開始時",
    #    9: "味方NPCユニットの指定マス到達",
    #    10: "味方ユニット（NPC含む）が指定エリアに到達",
    #}
    for battle in battleList:
        for event in filterByField(eventCsv, "BattleId", battle["uid"]):
            content = event["ContentType"]
            contentVal = event["ContentValue"]
            trigger = event["TriggerType"]
            triggerVal = event["ConditionValue"]
            if content == "2":
                unit = findByField(battle["enemies"], "fid", contentVal)
                if unit:
                    if trigger == "1" or trigger == "2":
                        unit["phase"] = triggerVal + "A"
                    if trigger == "8":
                        unit["phase"] = triggerVal + "E"

    writeJson(f"{outDir}/battle.json", battleList)

    def writeChrAndSkillData():
        args = ChrArgs()
        args.chrJson = mainJson
        args.activeJson = mainActiveJson
        args.passiveJson = mainPassiveJson
        args.talentJson = mainTalentJson
        addSkills(args, mainSkillIds)
        writeJson(f"{outDir}/enemy_main_characters.json", args.chrJson)
        writeJson(f"{outDir}/main_active.json", args.activeJson)
        writeJson(f"{outDir}/main_passive.json", args.passiveJson)
        writeJson(f"{outDir}/main_talents.json", args.talentJson)
        proceccEnemyMainChr()

        args = ChrArgs()
        args.chrJson = supJson
        args.activeJson = supActiveJson
        args.passiveJson = supPassiveJson
        addSkills(args, supSkillIds)
        writeJson(f"{outDir}/enemy_support_characters.json", args.chrJson)
        writeJson(f"{outDir}/support_active.json", args.activeJson)
        writeJson(f"{outDir}/support_passive.json", args.passiveJson)
        processEnemySupChr()

    writeChrAndSkillData()







os.makedirs("tmp/icon", exist_ok = True)
imageTable = readJson(f"{assetsDir}/image_table.json")

#dumpSkillData()

processEngageData()
proceccMainChr()
processSupChr()
processEquipments()

#proceccBattleCsv()

writeJson(f"{outDir}/image_table.json", imageTable)
