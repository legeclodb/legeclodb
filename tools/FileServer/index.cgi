#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys, os, io, cgi, json, datetime, hashlib, traceback

reload(sys)
sys.setdefaultencoding("utf-8")

ListJson = "./list.json"
form = cgi.FieldStorage()


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

    data = json.loads(str)
    with open("./data/" + hash, 'w') as f:
        f.write(str)
    list.append({
        "name": data["name"].encode('utf-8'),
        "date": datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S"),
        "hash": hash,
    });
    json.dump(list, open(ListJson, 'w'), ensure_ascii=False)
    return '{"succeeded": true}'

def delData(hash):
    list = json.load(open(ListJson))
    for i, e in enumerate(list):
        if e["hash"] == hash:
            del list[i]
            json.dump(list, open(ListJson, 'w'), ensure_ascii=False)
            os.remove("./data/" + hash)
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
