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
      <b-form-input size="sm" v-model="userName" placeholder="お名前" style="width: 8em"></b-form-input>
      <b-form-textarea size="sm" v-model="message" placeholder="メッセージ" style="flex: 1; margin-left: 0.25em; "></b-form-textarea>
      <b-button size="sm" @click="sendMessage()" style="min-width: 6em; margin-left: 0.25em; ">送信</b-button>
    </div>
  </div>
</template>

<script>
const MessageServer = "https://primitive-games.jp/legeclodb/loadout/index.cgi";

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
    }
  },

  data() {
    return {
      userName: "",
      message: "",
      messages: [],
      showAll: false,
      fetching: false,
    }
  },

  mounted() {
    this.userName = localStorage.getItem(`userName`);
    this.reload();
  },

  methods: {
    reload() {
      this.fetching = true;
      fetch(`${MessageServer}?mode=getm&thread=${this.thread}`)
        .then(a => a.json())
        .then(mesages => {
          this.messages = mesages;
          for (let m of this.messages) {
            m.message = this.sanitizeText(m.message);
          }

          this.fetching = false;
          this.$nextTick(() => {
            this.$refs.messageUl.scrollTo(0, this.$refs.messageUl.scrollHeight);
          });
        });
    },

    sendMessage() {
      const thread = this.thread;
      const name = encodeURIComponent(this.userName);
      const message = encodeURIComponent(this.message);
      fetch(`${MessageServer}?mode=putm&thread=${thread}&name=${name}&message=${message}`)
        .then(a => a.json())
        .then(obj => {
          this.message = "";
          this.reload();
        });
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
      return str.replace(/[&<>\n]/g, callback);
    }
  },

  watch: {
    userName: function (v) {
      localStorage.setItem(`userName`, v);
    },
  },
}</script>

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
