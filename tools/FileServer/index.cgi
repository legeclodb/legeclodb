#!/home/i-saint/bin/python3
# -*- coding: utf-8 -*-
import sys, os, io, stat, time, datetime, hashlib, cgi, json, traceback

ListJson = "./list.json"
form = cgi.FieldStorage()


class DirLock:
    def __init__(self, lockDir):
        self.lockDir = lockDir
        self.succeeded = False

    def lock(self):
        try:
            fileStat = os.stat(self.lockDir)
            timeStamp = fileStat[stat.ST_MTIME]
            # 古いロック (10秒前) が残っていたら除去
            if timeStamp < (time.time() - 10):
                os.rmdir(self.lockDir)
        except:
            pass

        self.succeeded = False
        for i in range(5):
            try:
                os.mkdir(self.lockDir)
                self.succeeded = True
                break
            except OSError:
                time.sleep(0.2)
        return self.succeeded

    def unlock(self):
        if self.succeeded:
            os.rmdir(self.lockDir)
        self.succeeded = False

    def __del__(self):
        if self.succeeded:
            os.rmdir(self.lockDir)
        self.succeeded = False


def getList():
    with open(ListJson) as file:
        return file.read()

def getData(hash):
    with open("./data/" + hash) as f:
        return f.read()

def putData(file, author):
    rawBytes = file.read()
    hash = hashlib.md5(rawBytes).hexdigest()
    rawString = rawBytes.decode('utf-8')
    del rawBytes # 結構でかい可能性があるので一応
    jsonObj = json.loads(rawString)
    date = datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S")

    lock = DirLock("./data/__lock__");
    if lock.lock():
        list = json.load(open(ListJson))
        def updateList():
            json.dump(list, open(ListJson, 'w'), ensure_ascii=False)
        for e in list:
            if e["hash"] == hash:
                e["date"] = date
                updateList()
                return {
                    "succeeded": True,
                    "message": "同じ内容のデータがあります。日付だけ更新しました。"
                }

        with open("./data/" + hash, 'w') as f:
            f.write(rawString)
        list.append({
            "name": jsonObj["name"],
            "author": author or "",
            "date": date,
            "hash": hash,
        });
        updateList()
        return {"succeeded": True}
    else:
        return {
            "succeeded": False,
            "message": "ファイルロックに失敗。時間を置いてもう一度お試しください。"
        }

def delData(hash):
    list = json.load(open(ListJson))
    for i, e in enumerate(list):
        if e["hash"] == hash:
            lock = DirLock("./data/__lock__");
            if lock.lock():
                del list[i]
                json.dump(list, open(ListJson, 'w'), ensure_ascii=False)
                os.remove("./data/" + hash)

                lock.unlock()
                return {"succeeded": True}
            else:
                return {
                    "succeeded": False,
                    "message": "ファイルロックに失敗。時間を置いてもう一度お試しください。"
                }
    return {
        "succeeded": False,
        "message": "データが見つかりませんでした。直前に誰かが消した可能性があります。"
    }


try:
    mode = form.getfirst("mode")
    content = ""
    if mode == "get":
        content = getData(form.getfirst("hash"))
    elif mode == "put":
        content = putData(form["data"].file, form.getfirst("author"))
    elif mode == "del":
        content = delData(form.getfirst("hash"))
    else:
        content = getList()

    if isinstance(content, dict):
        content = json.dumps(content, ensure_ascii=False)

    print('Content-Type: application/json; charset="utf8"\r\nAccess-Control-Allow-Origin: *\r\n\r\n')
    print(content)

except Exception as e:
    print('Content-Type: text/plain; charset="utf8"\r\n\r\n')
    print(traceback.format_exc())
