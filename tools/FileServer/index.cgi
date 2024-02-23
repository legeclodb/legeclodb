#!/usr/bin/env python
# -*- coding: utf-8 -*-

# for python2.7
import sys, os, io, stat, time, datetime, hashlib, cgi, json, traceback

reload(sys)
sys.setdefaultencoding("utf-8")

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
    with open(ListJson, 'r') as file:
        return file.read()

def getData(hash):
    with open("./data/" + hash) as f:
        return f.read()

def putData(file, author):
    str = file.read()
    hash = hashlib.md5(str).hexdigest()
    data = json.loads(str)
    date = datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S")

    lock = DirLock("./data/__lock__");
    if lock.lock():
        list = json.load(open(ListJson))
        for e in list:
            if e["hash"] == hash:
                e["date"] = date
                json.dump(list, open(ListJson, 'w'), ensure_ascii=False)
                return '{"succeeded": true, "message": "同じ内容のデータがあります。日付だけ更新しました。"}'

        with open("./data/" + hash, 'w') as f:
            f.write(str)
        list.append({
            "name": data["name"].encode('utf-8'),
            "author": author or "",
            "date": date,
            "hash": hash,
        });
        json.dump(list, open(ListJson, 'w'), ensure_ascii=False)

        return '{"succeeded": true}'
    else:
        return '{"succeeded": false, "message": "ファイルロックに失敗。時間を置いてもう一度お試しください。"}'

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
                return '{"succeeded": true}'
            else:
                return '{"succeeded": false, "message": "ファイルロックに失敗。時間を置いてもう一度お試しください。"}'
    return '{"succeeded": false, "message": "データが見つかりませんでした。"}'


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
    print('Content-Type: application/json; charset="utf8"\r\nAccess-Control-Allow-Origin: *\r\n\r\n')
    print(content)

except Exception as e:
    print('Content-Type: text/plain; charset="utf8"\r\n\r\n')
    t, v, tb = sys.exc_info()
    print(traceback.format_exception(t,v,tb))
    print(traceback.format_tb(e.__traceback__))
