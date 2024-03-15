export const MessageServer = "https://i-saint.skr.jp/legeclodb/loadout/index.cgi";
export const LoadoutServer = "https://i-saint.skr.jp/legeclodb/loadout/index.cgi";
export const ReplayServer = "https://i-saint.skr.jp/legeclodb/replay/index.cgi";

export class BitFlags {
  constructor(arg) {
    if (typeof arg == "number") {
      const size = arg;
      // (size / 32) + (size % 32 ? 1 : 0)
      // 整数のまま処理するためビット演算
      const n = (size >> 5) + (size & 31 ? 1 : 0);
      this.data_ = new Uint32Array(n);
    }
    else if (arg.constructor === this.constructor) {
      const parent = arg;
      this.data_ = new Uint32Array(parent.data_);
    }
    else {
      throw "BitFlags(??????)";
    }
  }
  get(i) {
    const byte = i >> 5;
    const bit = i & 31;
    return (this.data_[byte] & (1 << bit)) != 0;
  }
  set(i, v) {
    const byte = i >> 5;
    const bit = i & 31;
    if (v)
      this.data_[byte] |= 1 << bit;
    else
      this.data_[byte] &= ~(1 << bit);
  }
}

export class URLSerializer {
  constructor(data) {
    for (const k in data) {
      this[k] = data[k];
    }
  }

  serialize() {
    let params = [];
    for (const k in this) {
      params.push(k + "=" + this[k].toString());
    }
    return "?" + (params.length != 0 ? params.join("&") : "");
  }

  deserialize(url) {
    let numHandled = 0;
    let q = url.match(/\?([^#]+)/);
    if (q) {
      let params = q[1].split('&');
      for (let param of params) {
        let kvp = param.split('=');
        if (kvp.length == 2) {
          if (typeof this[kvp[0]] === "number")
            this[kvp[0]] = parseInt(kvp[1]);
          else
            this[kvp[0]] = decodeURIComponent(kvp[1]);
          ++numHandled;
        }
      }
    }
    return numHandled;
  }
}

export function getSubscribedThreads() {
  let r = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith('subscribe.')) {
      let v = k.replace('subscribe.', '');
      if (v != "lastcheck") {
        r.push(v);
      }
    }
  }
  return r;
}
export function getSubscribeLastCheckTime() {
  let v = localStorage.getItem('subscribe.lastcheck');
  return v ? new Date(parseInt(v)) : null;
}
export function updateSubscribeLastCheck() {
  localStorage.setItem('subscribe.lastcheck', new Date().getTime());
}


export function unique(array) {
  return array.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
}
export function count(enumerable, cond) {
  let r = 0;
  for (const e of enumerable) {
    if (cond(e)) {
      ++r;
    }
  }
  return r;
}

export function toSQLDateTime(date) {
  let time = typeof (date) === 'number' ? date : date.getTime();
  let a9h = new Date(time + (9 * 60 * 60 * 1000)); // +9H
  return a9h.toISOString().slice(0, -5).replace('T', ' '); // YYYY-MM-DD HH:mm:ss
}


// Infinity 対応版 JSON.stringify()
export function toJson(data) {
  const conv = (k, v) => {
    if (v === Number.POSITIVE_INFINITY) {
      return "Infinity";
    }
    return v;
  };
  return JSON.stringify(data, conv);
}
// Infinity 対応版 JSON.parse()
export function fromJson(str) {
  const conv = (k, v) => {
    if (v === "Infinity") {
      return Number.POSITIVE_INFINITY;
    }
    return v;
  };
  return JSON.parse(str, conv);
}

// fileType: ".json" など
export function openFileDialog(fileType, callback) {
  let input = window.document.createElement("input");
  input.type = "file";
  input.accept = fileType;
  input.onchange = function () {
    callback(input.files[0]);
    input.remove();
    return false;
  };
  input.click();
}

// data: String or Uint8Array or Object
// Object の場合 json 化される。
export function download(filename, data) {
  if (typeof (data) == 'string' || data instanceof Uint8Array) {
    data = new Blob([data]);
  }
  else if (typeof (data) == 'object') {
    data = new Blob([toJson(data)]);
  }

  let u = window.URL.createObjectURL(data);
  let a = document.createElement('a');
  a.href = u;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(u);
}

// data: String or Uint8Array
export async function compressGzip(data) {
  if (typeof (data) == 'string') {
    const encoder = new TextEncoder();
    data = encoder.encode(data);
  }

  const inputStream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    }
  });
  // eslint-disable-next-line
  const outputStream = inputStream.pipeThrough(new CompressionStream('gzip'));
  const reader = outputStream.getReader();
  let chunks = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return new Uint8Array(chunks.reduce((acc, chunk) => acc.concat(Array.from(chunk)), []));
  }
  finally {
    reader.releaseLock();
  }
}

// data: Uint8Array
export async function decompressGzip(data) {
  // eslint-disable-next-line
  const stream = new Response(data).body.pipeThrough(new DecompressionStream('gzip'));
  const reader = stream.getReader();
  let chunks = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return new Uint8Array(chunks);
  } finally {
    reader.releaseLock();
  }
}

// data: Uint8Array
export function isGzipData(data) {
  // gzip 圧縮されたデータは最初の 2 byte が 0x1F 0x8B になっている
  return data instanceof Uint8Array && data.length >= 2 && data[0] === 0x1F && data[1] === 0x8B;
}