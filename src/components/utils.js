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


export function unique(array, compare = (a, b) => a === b) {
  return array.filter((a, i) => {
    return array.findIndex(b => compare(a, b)) === i;
  });
}
export function count(iterable, cond) {
  let r = 0;
  for (const e of iterable) {
    if (cond(e)) {
      ++r;
    }
  }
  return r;
}

export function maxElement(iterable, comparator = (a, b) => a > b) {
  let r = undefined;
  for (let v of iterable) {
    if (r === undefined || comparator(v, r)) {
      r = v;
    }
  }
  return r;
}
export function minElement(iterable, comparator = (a, b) => a < b) {
  return maxElement(iterable, comparator);
}

export function *enumerate(...arrays) {
  for (let array of arrays) {
    if (array) {
      yield* array;
    }
  }
}

export function timedLoop(count, interval, callback, onEnd = null) {
  let i = 0;
  const body = () => {
    let end = false;
    if (i < count) {
      if (callback(i) === false) {
        end = true;
      }
      else {
        ++i;
        setTimeout(body, interval);
      }
    }
    else {
      end = true;
    }
    if (end && onEnd) {
      onEnd();
    }
  }
  body();
}
export function timedEach(iterable, interval, callback, onEnd = null) {
  let iter = iterable[Symbol.iterator]();
  let result = iter.next();
  let i = 0;
  const body = () => {
    let end = false;
    if (!result.done) {
      if (callback(result.value, i++) === false) {
        end = true;
      }
      else {
        result = iter.next();
        setTimeout(body, interval);
      }
    }
    else {
      end = true;
    }
    if (end && onEnd) {
      onEnd();
    }
  }
  body();
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
// JSON 由来のオブジェクトに↑と同等の変換をかける
export function sanitizeJsonObject(obj) {
  const conv = (v) => {
    if (Array.isArray(v) || typeof (v) == "object") {
      return sanitizeJsonObject(v);
    }
    else if (v === "Infinity") {
      return Number.POSITIVE_INFINITY;
    }
    else {
      return v;
    }
  };

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; ++i) {
      obj[i] = conv(obj[i]);
    }
  }
  else if (typeof (obj) == "object") {
    for (let k in obj) {
      obj[k] = conv(obj[k]);
    }
  }
  return obj;
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

export function stringToBytes(str) {
  return (new TextEncoder()).encode(str);
}
export function bytesToString(bin) {
  return (new TextDecoder()).decode(bin);
}

export function concatBytes(arrays) {
  const len = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(len);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// data: String or ArrayBuffer
export async function gzCompress(data) {
  if (typeof (data) == 'string') {
    data = stringToBytes(data);
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
    return concatBytes(chunks);
  }
  finally {
    reader.releaseLock();
  }
}

// data: ArrayBuffer
export async function gzDecompress(data) {
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
    return concatBytes(chunks);
  }
  finally {
    reader.releaseLock();
  }
}

// data: ArrayByffer
export function gzIsCompressedData(data) {
  const check = (bytes) => {
    // gzip 圧縮されたデータは最初の 2 byte が 0x1F 0x8B になっている
    return bytes.length >= 2 && bytes[0] === 0x1F && bytes[1] === 0x8B;
  };
  if (data instanceof Uint8Array) {
    return check(data);
  }
  else {
    return check(new Uint8Array(data));
  }
}

export function idbInitialize(dbName, storeNames, version) {
  let req = window.indexedDB.open(dbName, version);
  req.onupgradeneeded = (event) => {
    let db = event.target.result;
    for (const name of storeNames) {
      if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name, { keyPath: 'id' })
      }
    }
  }
  req.onsuccess = (event) => {
    let db = event.target.result;
    db.close();
  };
}
export function idbWrite(dbName, storeName, id, data, onsuccess, onerror) {
  let req = window.indexedDB.open(dbName);
  req.onupgradeneeded = (event) => {
    let db = event.target.result;
    db.createObjectStore(storeName, { keyPath: 'id' })
  }
  req.onsuccess = (event) => {
    let db = event.target.result;
    let tx = db.transaction(storeName, "readwrite");
    let store = tx.objectStore(storeName);
    let req = store.put({ id: id, data: data });
    req.onsuccess = (event) => {
      if (onsuccess) {
        onsuccess(event.target.result);
      }
    };
    req.onerror = onerror;
    db.close();
  };
  req.onerror = onerror;
}
export function idbRead(dbName, storeName, id, onsuccess, onerror) {
  let req = window.indexedDB.open(dbName);
  req.onsuccess = (event) => {
    let db = event.target.result;
    try {
      let tx = db.transaction(storeName, "readonly");
      let store = tx.objectStore(storeName);
      let req = store.get(id);
      req.onsuccess = (event) => {
        if (onsuccess) {
          onsuccess(event.target.result?.data);
        }
      };
      req.onerror = onerror;
    }
    catch (e) { }
    db.close();
  };
  req.onerror = onerror;
}
