export const MessageServer = "https://primitive-games.jp/legeclodb/loadout/index.cgi";
export const LoadoutServer = "https://primitive-games.jp/legeclodb/loadout/index.cgi";
export const BattleLogServer = "https://primitive-games.jp/legeclodb/battlelog/index.cgi";

export function toSQLDateTime(date) {
  let time = typeof (date) === 'number' ? date : date.getTime();
  let a9h = new Date(time + (9 * 60 * 60 * 1000)); // +9H
  return a9h.toISOString().slice(0, -5).replace('T', ' '); // YYYY-MM-DD HH:mm:ss
}

export function updateSubscribeLastCheck() {
  localStorage.setItem('subscribe.lastcheck', new Date().getTime());
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

export function download(filename, data) {
  if (typeof (data) == 'string') {
    data = new Blob([data]);
  }
  else if (typeof (data) == 'object') {
    data = new Blob([JSON.stringify(data, null, 2)]);
  }

  let u = window.URL.createObjectURL(data);
  let a = document.createElement('a');
  a.href = u;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(u);
}
