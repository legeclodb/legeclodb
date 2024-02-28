#!/home/i-saint/bin/python3
# -*- coding: utf-8 -*-
import sys, os, io, stat, time, datetime, hashlib, cgi, json, traceback, MySQLdb
from config import * # Table, Host, User, Password, Database 非公開データ

mydb = MySQLdb.connect(Host, User, Password, Database, use_unicode = True, charset = "utf8")
mycursor = mydb.cursor()
table = Table
form = cgi.FieldStorage()

def getList():
    mycursor.execute(f"SELECT date, hash, name, author FROM {table}")
    return list(map(lambda r: {
        "date": r[0],
        "hash": r[1],
        "name": r[2],
        "author": r[3],
    }, mycursor.fetchall()))

def getData(hash):
    try:
        sql = f"SELECT data FROM {table} WHERE hash = %s"
        val = (hash,)
        mycursor.execute(sql, val)
        return mycursor.fetchone()[0]
    except Exception as e:
        return {
            "succeeded": False,
            "message": "データが見つかりませんでした。",
            "traceback": traceback.format_exc()
        }

def putData(file, author):
    rawBytes = file.read()
    hash = hashlib.md5(rawBytes).hexdigest()
    rawString = rawBytes.decode('utf-8')
    del rawBytes # 結構でかい可能性があるので一応
    jsonObj = json.loads(rawString)
    date = datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S")

    try:
        sql = f"INSERT INTO {table} (date, hash, name, author, data) VALUES (%s, %s, %s, %s, %s)"
        val = (date, hash, jsonObj["name"], author or "", rawString)
        mycursor.execute(sql, val)
        mydb.commit()
        return {"succeeded": True}
    except Exception as e:
        return {
            "succeeded": False,
            "message": "同じ内容のデータが既に投稿されています。",
            "traceback": traceback.format_exc()
        }

def delData(hash):
    try:
        sql = f"DELETE FROM {table} WHERE hash = %s"
        val = (hash,)
        mycursor.execute(sql, val)
        mydb.commit()
        return {"succeeded": True}
    except Exception as e:
        return {
            "succeeded": False,
            "message": "データが見つかりませんでした。",
            "traceback": traceback.format_exc()
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

    if isinstance(content, dict) or isinstance(content, list):
        content = json.dumps(content, ensure_ascii=False)

    print('Content-Type: application/json; charset="utf8"\r\nAccess-Control-Allow-Origin: *\r\n\r\n')
    print(content)

except Exception as e:
    print('Content-Type: text/plain; charset="utf8"\r\nAccess-Control-Allow-Origin: *\r\n\r\n')
    print(traceback.format_exc())
