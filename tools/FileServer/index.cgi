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
        self.result = False

    def lock(self):
        # 10秒以上前に作成されたロックファイルを削除する
        # ※何らかの原因で残ったままになったロックファイル
        try:
            fileStat = os.stat(self.lockDir)
            timeStamp = fileStat[stat.ST_MTIME]
            if timeStamp < (time.time() - 10): os.rmdir(self.lockDir)
        except:
            pass

        # ロックファイルを作成してみる
        # ※5回やってダメなら失敗とする
        self.result = False
        for i in range(5):
            try:
                os.mkdir(self.lockDir)
                self.result = True # ロックを自分で作ったという印
                break
            except OSError:
                time.sleep(0.2)
        return self.result

    def unlock(self):
        if self.result == True: # 自分で作ったロックファイルなら消す
            os.rmdir(self.lockDir)
        self.result = False

    def __del__(self):
        if self.result == True: # 自分で作ったロックファイルなら消す
            os.rmdir(self.lockDir)
        self.result = False


def getList():
    with open(ListJson, 'r') as file:
        return file.read()

def getData(hash):
    with open("./data/" + hash) as f:
        return f.read()

def putData(file):
    str = file.read()
    hash = hashlib.md5(str).hexdigest()

    list = json.load(open(ListJson))
    for e in list:
        if e["hash"] == hash:
            return '{"succeeded": false, "error": "duplicated"}'

    lock = DirLock("./data/__lock__");
    lock.lock()

    data = json.loads(str)
    with open("./data/" + hash, 'w') as f:
        f.write(str)
    list.append({
        "name": data["name"].encode('utf-8'),
        "date": datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S"),
        "hash": hash,
    });
    json.dump(list, open(ListJson, 'w'), ensure_ascii=False)

    lock.unlock()
    return '{"succeeded": true}'

def delData(hash):
    list = json.load(open(ListJson))
    for i, e in enumerate(list):
        if e["hash"] == hash:
            lock = DirLock("./data/__lock__");
            lock.lock()

            del list[i]
            json.dump(list, open(ListJson, 'w'), ensure_ascii=False)
            os.remove("./data/" + hash)

            lock.unlock()
            return '{"succeeded": true}'
    return '{"succeeded": false}'


try:
    mode = form.getfirst("mode")
    content = ""
    if mode == "get":
        content = getData(form.getfirst("hash"))
    elif mode == "put":
        content = putData(form["data"].file)
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
