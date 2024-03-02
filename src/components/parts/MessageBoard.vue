<template>
  <div class="message-board">
    <div v-if="fetching" style="position: absolute; padding: 10px;">
      <b-spinner small label="Spinning"></b-spinner>
    </div>
    <ul :class="['message-ul', messageClass]" ref="messageUl">
      <li v-for="(m, i) of messages" :key="i" class="message-li">
        <span class="user-name">{{m.name}} : </span>
        <span class="message" style="margin-left: 0.25em" v-html="m.message"></span>
        <span class="date" style="margin-left: 0.5em">{{m.date}}</span>
      </li>
    </ul>
    <div class="flex inputs">
      <div><b-form-input size="sm" v-model="userName" placeholder="お名前" style="width: 8em"></b-form-input></div>
      <div style="margin-left: 0.25em; flex: 1;"><b-form-textarea size="sm" v-model="message" placeholder="メッセージ" style=""></b-form-textarea></div>
      <div style="margin-left: 0.25em;"><b-button size="sm" @click="sendMessage()" style="min-width: 4em;">送信</b-button></div>
      <div style="margin-left: 0.25em;"><b-button size="sm" :title="`投稿があった時通知 (現在 ${subscribed ? 'On' : 'Off'})`" @click="subscribed=!subscribed"><b-icon :icon="subscribed ? 'bell-fill' : 'bell'" /></b-button></div>
    </div>
  </div>
</template>

<script>
import * as lut from "../utils.js";

export default {
  name: 'MessageBoard',
  props: {
    thread: {
      type: String,
      required: true,
    },
    messageClass: {
      type: String,
      default: "",
    },
    fetchCallback: {
      type: Function,
      default: null,
    },
  },

  data() {
    return {
      subscribed: false,
      userName: "",
      message: "",

      fetching: false,
      messages: [],
      anchors: [],
    }
  },

  mounted() {
    this.userName = localStorage.getItem(`userName`) ?? "";
    this.subscribed = localStorage.getItem(`subscribe.${this.thread}`) != null;
    this.reload();
  },

  destroyed() {
    this.discard();
  },

  methods: {
    reload() {
      this.fetching = true;
      fetch(`${lut.MessageServer}?mode=getm&thread=${this.thread}`)
        .then(a => a.json())
        .then(mesages => {
          this.fetching = false;
          this.messages = mesages;
          for (let m of this.messages) {
            m.message = this.sanitizeText(m.message);
          }

          this.$nextTick(() => {
            let ul = this.$refs.messageUl;
            if (ul) {
              ul.scrollTo(0, ul.scrollHeight);
            }

            this.discard();
            for (let m of ul.getElementsByClassName("message")) {
              for (let a of m.children) {
                this.anchors.push(a);
              }
            }
            this.$emit('change', this);
          });
        });
    },

    discard() {
      this.$emit('discard', this);
      this.anchors = [];
    },

    sendMessage() {
      const thread = this.thread;
      const name = encodeURIComponent(this.userName);
      const message = encodeURIComponent(this.message);
      if (message.length > 0) {
        fetch(`${lut.MessageServer}?mode=putm&thread=${thread}&name=${name}&message=${message}`)
          .then(a => a.json())
          .then(obj => {
            this.message = "";
            this.subscribed = true;
            this.reload();
            lut.updateSubscribeLastCheck();
          });
      }
    },

    sanitizeText(str) {
      const callback = (c) => {
        const table = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '\n': '<br />',
        };
        return table[c] || c;
      };
      str = str.replace(/[&<>\n]/g, callback);
      // [[スキル名]] を anchor 化、ItemPopovers で popover 化
      str = str.replace(/\[\[(.+?)\]\]/g, "<a href='javascript:void(0);'>$1</a>");
      return str;
    }
  },

  watch: {
    userName: function (v) {
      localStorage.setItem(`userName`, v);
    },
    subscribed: function (v) {
      const key = `subscribe.${this.thread}`;
      if (v) {
        localStorage.setItem(key, 'true');
      }
      else {
        localStorage.removeItem(key);
      }
      //console.log(`subscribed: ${v}`);
    },
  },
}
</script>

<style scoped>
  .message-ul {
    margin: 0.25em 0 0.25em 0;
    max-height: 16em;
    overflow-y: auto;
  }

  .message-li {
    display: list-item;
    list-style-type: disc;
    margin-left: 15px;
  }
</style>
