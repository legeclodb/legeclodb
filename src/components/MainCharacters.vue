<template>
  <div class="root">
    <div class="menu" :class="{ 'hidden': !showMenu }">
      <div class="menu-content">
        <div class="menu-widgets flex">
          <div class="widget">
            <b-button-group size="sm" id="class_selector">
              <b-button v-for="(c, i) in classFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                <b-img-lazy :src="iconTable[classes[i]]" height="25" />
              </b-button>
            </b-button-group>
          </div>
          <div class="widget">
            <b-button-group size="sm" id="symbol_selector">
              <b-button v-for="(c, i) in symbolFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                <b-img-lazy :src="iconTable[symbols[i]]" height="25" />
              </b-button>
            </b-button-group>
          </div>
          <div class="widget">
            <b-button-group size="sm" id="attack_type_selector">
              <b-button v-for="(c, i) in damageTypeFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                <b-img-lazy :src="iconTable[damageTypes[i]]" height="25" />
              </b-button>
            </b-button-group>
          </div>
          <div class="widget">
            <b-button-group size="sm" id="rareiry_selector">
              <b-button v-for="(c, i) in rarityFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                <b-img-lazy :src="iconTable[rarities[i]]" height="25" />
              </b-button>
            </b-button-group>
          </div>
        </div>
        <div class="menu-widgets flex">
          <div class="widget">
            <span>タレント / スキル検索</span>
          </div>
          <div class="widget">
            <b-button-group size="sm" id="skill_type_selector">
              <b-button v-for="(c, i) in skillTypeFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                {{ bufTypes[i] }}
              </b-button>
            </b-button-group>
          </div>
          <div class="widget">
            <input v-model="tagSearchPattern" type="text" size="sm" placeholder="パターン (正規表現可)" />
          </div>
          <div class="widget">
            <b-button variant="secondary" size="sm" @click="tagSearchPattern='^バフ:.+'">バフ系</b-button>
            <b-button variant="secondary" size="sm" @click="tagSearchPattern='^デバフ:.+'">デバフ系</b-button>
          </div>
          <div class="widget">
            <span>表示</span>
            <b-dropdown right :text="showDetailTypes[showDetail]" size="sm" id="detail_selector">
              <b-dropdown-item v-for="(c, i) in showDetailTypes" :key="i" @click="showDetail=i">
                {{ showDetailTypes[i] }}
              </b-dropdown-item>
            </b-dropdown>
          </div>
        </div>
      </div>
    </div>
    <div class="content">
      <template v-for="chr in mainCharactersFiltered">
        <div class="character" :id="'mainchar_'+chr.id" :key="chr.id">
          <div class="flex">
            <div class="portrait">
              <b-img-lazy :src="chr.icon" />
            </div>
            <div class="detail" v-show="showDetail >= 1">
              <div class="info" v-show="showDetail >= 1">
                <h5>{{ chr.name }}</h5>
                <b-img-lazy :src="iconTable[chr.class]" height="25" />
                <b-img-lazy :src="iconTable[chr.symbol]" height="25" />
                <b-img-lazy :src="iconTable[chr.damageType]" height="25" />
                <b-img-lazy :src="iconTable[chr.rarity]" height="25" />
                <b-link :href="'https://legeclo.wikiru.jp/?' + chr.name">Wiki</b-link>
              </div>
              <div class="talent" :class="{ 'highlighted': isTalentHighlighted(chr) }" v-show="showDetail >= 1">
                <div class="flex">
                  <div class="icon">
                    <b-img-lazy :src="chr.talent.icon" with="50" height="50" />
                  </div>
                  <div class="desc">
                    <h5>{{ chr.talent.name }}</h5>
                    <p v-html="descToHtml(chr.talent.desc)"></p>
                  </div>
                </div>
                <div class="tags" v-show="showDetail >= 3">
                  <b-badge class="tag" :key="i" v-for="(tag, i) in chr.tags" variant="info" pill @click="setTagSearchPattern(tag)">{{ tag }}</b-badge>
                </div>
              </div>
              <div class="skills" v-show="showDetail >= 2">
                <template v-for="(skill, si) in chr.skills">
                  <div class="skill" :class="{'active': skill.skillType == 'アクティブ', 'passive': skill.skillType == 'パッシブ', 'highlighted': isSkillHighlighted(skill) }" :key="si">
                    <div class="flex">
                      <div class="icon">
                        <b-img-lazy :src="skill.icon" with="40" height="40" />
                      </div>
                      <div class="desc">
                        <h6>{{ skill.name }}</h6>
                        <p v-html="descToHtml(skill.desc)"></p>
                      </div>
                    </div>
                    <div class="tags" v-show="showDetail >= 3">
                      <b-badge class="tag" :key="i" v-for="(tag, i) in skill.tags" variant="info" pill @click="setTagSearchPattern(tag)">{{ tag }}</b-badge>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainCharacters',
  props: {
    msg: String
  },

  data() {
    return {
      mainSkills: [],
      mainCharacters: [],
      supportSkills: [],
      supportCharacters: [],
      equipments: [],
      setupCompleted: false,
      
      symbols: [
        "ゼニス",
        "オリジン",
        "ナディア",
      ],
      classes: [
        "ソルジャー",
        "ランサー",
        "ライダー",
        "エアリアル",
        "ソーサラー",
        "セイント",
        "シューター",
        "アサシン",
      ],
      rarities: [
        "SSR",
        "SR",
        "R",
      ],
      damageTypes: [
        "アタック",
        "マジック",
      ],
      bufTypes: [
        "タレント",
        "パッシブ",
        "アクティブ",
      ],
      showDetailTypes: [
        "アイコン",
        "簡易",
        "詳細",
        "完全",
      ],

      iconTable: {
        "ゼニス": "https://legeclo.wikiru.jp/attach2/696D67_61705F7A656E6974682E706E67.png",
        "オリジン": "https://legeclo.wikiru.jp/attach2/696D67_61705F6F726967696E2E706E67.png",
        "ナディア": "https://legeclo.wikiru.jp/attach2/696D67_61705F6E616469612E706E67.png",

        "ソルジャー": "https://legeclo.wikiru.jp/attach2/696D67_73695F736F6C646965722E706E67.png",
        "ランサー": "https://legeclo.wikiru.jp/attach2/696D67_73695F6C616E6365722E706E67.png",
        "ライダー": "https://legeclo.wikiru.jp/attach2/696D67_73695F72696465722E706E67.png",
        "エアリアル": "https://legeclo.wikiru.jp/attach2/696D67_73695F77696E672E706E67.png",
        "ソーサラー": "https://legeclo.wikiru.jp/attach2/696D67_73695F736F7263657265722E706E67.png",
        "セイント": "https://legeclo.wikiru.jp/attach2/696D67_73695F7361696E742E706E67.png",
        "シューター": "https://legeclo.wikiru.jp/attach2/696D67_73695F73686F6F7465722E706E67.png",
        "アサシン": "https://legeclo.wikiru.jp/attach2/696D67_73695F617373617373696E2E706E67.png",

        "R": "https://legeclo.wikiru.jp/attach2/696D67_522E706E67.png",
        "SR": "https://legeclo.wikiru.jp/attach2/696D67_53522E706E67.png",
        "SSR": "https://legeclo.wikiru.jp/attach2/696D67_5353522E706E67.png",

        "アタック": "https://legeclo.wikiru.jp/attach2/696D67_7374695F61747461636B2E706E67.png",
        "マジック": "https://legeclo.wikiru.jp/attach2/696D67_7374695F6D616769632E706E67.png",
      },

      showMenu: true,
      lastScrollPosition: 0,

      showDetail: 3,
      
      symbolFilter: [
        { state: false },
        { state: false },
        { state: false },
      ],
      classFilter: [
        { state: false },
        { state: false },
        { state: false },
        { state: false },
        { state: false },
        { state: false },
        { state: false },
        { state: false },
      ],
      rarityFilter: [
        { state: false },
        { state: false },
        { state: false },
      ],
      damageTypeFilter: [
        { state: false },
        { state: false },
      ],
      
      skillTypeFilter: [
        { state: false },
        { state: false },
        { state: false },
      ],
      tagSearchPattern: "",
    };
  },

  computed: {
    mainCharactersFiltered() {
      if (!this.setupCompleted) {
        return null;
      }
      return this.mainCharacters.filter(chr => this.filterMainCharacter(chr));
    }
  },

  mounted () {
    window.addEventListener('scroll', this.onScroll);

    Promise.all([
      this.fetchJson("./main_skills.json"),
      this.fetchJson("./main_characters.json"),
      this.fetchJson("./support_skills.json"),
      this.fetchJson("./support_characters.json"),
      this.fetchJson("./equipments.json")
    ]).then((values) => {
      this.mainSkills = values[0];
      this.mainCharacters = values[1];
      this.supportSkills = values[2];
      this.supportCharacters = values[3];
      this.equipments = values[4];
      this.onLoadDB();
    });
  },
  
  beforeDestroy () {
    window.removeEventListener('scroll', this.onScroll);
  },

  methods: {
    onScroll () {
      const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScrollPosition < 0) {
        return;
      }
      if (Math.abs(currentScrollPosition - this.lastScrollPosition) < 60) {
        return;
      }
      this.showMenu = currentScrollPosition < this.lastScrollPosition;
      this.lastScrollPosition = currentScrollPosition;
    },

    setTagSearchPattern(txt) {
      txt = txt.replace('(', '\\(');
      txt = txt.replace(')', '\\)');
      txt = "^" + txt;
      this.tagSearchPattern = this.tagSearchPattern == txt ? "" : txt;
      this.showMenu = true;
    },
    
    compareDate(a, b) {
      return a.date == b.date ? 0 : (a.date < b.date ? -1 : 1);
    },

    fetchJson(uri) {
      return fetch(uri, { cache: "no-cache" }).then(res => res.json());
    },

    addUser(skill, chr) {
      if (!skill.users) {
        skill.users = [];
      }
      skill.users.push(chr.name);
    },

    filterEnabled(filter) {
      for (const v of filter)
        if (v.state)
          return true;
      return false;
    },
    matchTags(tags, re) {
        for (const tag of tags) {
          if (tag.match(re)) {
            return true;
          }
        }
        return false;
    },
    getTagMatchPattern() {
      if (this.tagSearchPattern.length == 0) {
        return null;
      }
      else {
        return new RegExp(this.tagSearchPattern);
      }
    },
    isTalentHighlighted(chr) {
      let re = this.getTagMatchPattern();
      if (!re) {
        return false;
      }
      if (!this.filterEnabled(this.skillTypeFilter) || this.skillTypeFilter[0].state) {
        if (this.matchTags(chr.tags, re)) {
          return true;
        }
      }
      return false;
    },
    isSkillHighlighted(skill) {
      let re = this.getTagMatchPattern();
      if (!re) {
        return false;
      }
      if (!this.filterEnabled(this.skillTypeFilter) ||
        (skill.skillType == "パッシブ" && this.skillTypeFilter[1].state) ||
        (skill.skillType == "アクティブ" && this.skillTypeFilter[2].state)) {
        if (this.matchTags(skill.tags, re)) {
          return true;
        }
      }
      return false;
    },
    applytagMatchPattern(chr) {
      if (this.isTalentHighlighted(chr)) {
        return true;
      }
      for (let skill of chr.skills) {
        if (this.isSkillHighlighted(skill)) {
          return true;
        }
      }
      return false;
    },
    filterMainCharacter(chr) {
      let ok = (!this.filterEnabled(this.symbolFilter) || this.symbolFilter[chr.symbolId].state) &&
        (!this.filterEnabled(this.classFilter) || this.classFilter[chr.classId].state) &&
        (!this.filterEnabled(this.rarityFilter) || this.rarityFilter[chr.rarityId].state) &&
        (!this.filterEnabled(this.damageTypeFilter) || this.damageTypeFilter[chr.damageTypeId].state);

      if (ok && this.getTagMatchPattern()) {
        ok = this.applytagMatchPattern(chr);
      }
      return ok;
    },

    descToHtml(desc) {
      return desc.replaceAll("\n", "<br/>");
    },

    setupDB() {
      // 最後の要素は追加用のテンプレになっているので取り除く
      if (this.mainCharacters[this.mainCharacters.length - 1].name.length == 0) {
        this.mainCharacters.pop();
      }
      if (this.supportCharacters[this.supportCharacters.length - 1].name.length == 0) {
        this.supportCharacters.pop();
      }

      //this.mainCharacters.sort(compareDate);
      //this.supportCharacters.sort(compareDate);

      let tmpSkillMap = new Map();
      for (let skill of this.mainSkills) {
        tmpSkillMap.set(skill.name, skill);
      }
      this.mainSkills = tmpSkillMap;

      let idSeed = 0;
      for (let chr of this.mainCharacters) {
        chr.id = ++idSeed;
        chr.symbolId = this.symbols.findIndex(v => v == chr.symbol);
        chr.classId = this.classes.findIndex(v => v == chr.class);
        chr.rarityId = this.rarities.findIndex(v => v == chr.rarity);
        chr.damageTypeId = this.damageTypes.findIndex(v => v == chr.damageType);

        chr.tags = new Set(chr.tags);
        for (let i = 0; i < chr.skills.length; ++i) {
          let skill = this.mainSkills.get(chr.skills[i]);
          if (!skill) {
            console.log("不明なスキル: " + chr.name + ":" + chr.skills[i]);
          }
          this.addUser(skill, chr);
          chr.skills[i] = skill;

          //for (let tag of skill.tags) {
          //  chr.tags.add(tag);
          //}
        }
      }
      this.setupCompleted = true;
    },

    debugDB() {
      let skillMap = new Map();
      for (let skill of this.mainSkills) {
        skillMap.set(skill.name, skill);
      }

      for (let chr of this.mainCharacters) {
        if (chr.name.length == 0) {
          continue;
        }
        if (!this.symbols.find(e => e == chr.symbol)) {
          console.log("無効なシンボル: " + chr.name);
        }
        if (!this.classes.find(e => e == chr.class)) {
          console.log("無効なクラス: " + chr.name);
        }
        if (!this.rarities.find(e => e == chr.rarity)) {
          console.log("無効なレアリティ: " + chr.name);
        }
        if (!this.damageTypes.find(e => e == chr.damageType)) {
          console.log("無効なアタックタイプ: " + chr.name);
        }

        for (let skill of chr.skills) {
          if (typeof skill == "object" && typeof skill.icon == "string" && skill.icon.startsWith("https://")) {
            skillMap.set(skill.name, skill);
          }
        }
      }

      let orderdSkills = new Set();
      for (let chr of this.mainCharacters) {
        if (chr.name.length == 0) {
          continue;
        }
        for (let i = 0; i < chr.skills.length; ++i) {
          let skill = chr.skills[i];
          if (typeof skill == "object") {
            if (skillMap.has(skill.name)) {
              chr.skills[i] = skill.name;
            }
          }
          orderdSkills.add(skillMap.get(chr.skills[i]));
        }
      }

      console.log(JSON.stringify(Array.from(orderdSkills)));
      console.log(JSON.stringify(this.mainCharacters));
    },
    
    onLoadDB() {
      //this.debugDB();
      this.setupDB();
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

.btn {
  font-size: small;
}

div.root {
  display: flex;
  font-size: small;
}
div.menu {
  height: 200px;
  width: 100vw;
  background: rgb(240, 240, 240);
  position: fixed;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
  transform: translate3d(0, 0, 0);
  transition: 0.1s all ease-out;
}
div.menu.hidden {
  box-shadow: none;
  transform: translate3d(0, -100%, 0);
}

div.menu-content {
  width: 1000px;
  margin-left: auto;
  margin-right: auto;
  align-items: center;
}

.menu-widgets {
  margin: 5px;
  padding: 5px;

  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  background: white;
}

.widget {
  margin-left: 5px;
  margin-right: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
}

div.content {
  margin-top: 210px;
  margin-left: auto;
  margin-right: auto;
  width: 1000px;
}

div.content p {
  margin: 0;
}

div.character {
  padding: 3px;
  margin: 10px 0px 10px 0px;

  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  background: rgb(245, 245, 245);
}
div.character h5 {
  margin: 0;
}
div.character h6 {
  margin: 0;
}

div.portrait {
  text-align: left;
  width: 110px;
  padding: 3px;
  margin: 3px;

  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  background: white;
}

div.detail {
  flex: 2;
}

div.flex {
  display: flex;
}

div.info {
  text-align: left;
  padding: 3px;
  margin: 3px;

  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  background: white;
}

div.talent {
  text-align: left;
  padding: 3px;
  margin: 3px;

  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  background: white;
}
div.skill {
  text-align: left;
  padding: 3px;
  margin: 3px;

  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
}
.skill.active {
  background: rgb(255, 246, 222);
}
.skill.passive {
  background: rgb(234, 234, 234);
}

.tag {
  cursor: pointer;
}

.highlighted {
  border: 3px solid rgba(255, 0, 0, 0.7) !important;
}
</style>
