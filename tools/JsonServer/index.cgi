#!/home/i-saint/bin/python3
# -*- coding: utf-8 -*-
import sys, os, io, stat, time, hashlib, cgi, json, traceback, secrets, MySQLdb
from config import * # DataTable, MessageTable, Host, User, Password, Database 非公開データ

mydb = MySQLdb.connect(Host, User, Password, Database, use_unicode = True, charset = "utf8")
mycursor = mydb.cursor()
form = cgi.FieldStorage()

def getMessage():
    sql = f"SELECT date, name, message FROM {MessageTable} WHERE thread = %s"
    val = (form.getfirst("thread"),)
    mycursor.execute(sql, val)
    return list(map(lambda r: {
        "date": r[0].strftime("%Y/%m/%d %H:%M:%S"),
        "name": r[1],
        "message": r[2],
    }, mycursor.fetchall()))

def putMessage():
    thread = form.getfirst("thread")
    date = time.strftime("%Y-%m-%d %H:%M:%S")
    name = form.getfirst("name") or ""
    message = form.getfirst("message")
    try:
        sql = f"INSERT INTO {MessageTable} (thread, date, name, message) VALUES (%s, %s, %s, %s)"
        val = (thread, date, name, message)
        mycursor.execute(sql, val)
        mydb.commit()
        return {
            "succeeded": True
        }
    except Exception as e:
        return {
            "succeeded": False,
            "traceback": traceback.format_exc()
        }

def checkNewMessage():
    date = form.getfirst("date")
    if not date:
        return {}
    date = date.replace("/", "-")

    sql = f"SELECT thread, date FROM {MessageTable} WHERE date > %s"
    val = (date,)
    mycursor.execute(sql, val)
    return list(map(lambda r: {
        "thread": r[0],
        "date": r[1].strftime("%Y/%m/%d %H:%M:%S"),
    }, mycursor.fetchall()))


def getDataList():
    mycursor.execute(f"SELECT hash, date, name, author FROM {DataTable}")
    return list(map(lambda r: {
        "hash": r[0],
        "date": r[1].strftime("%Y/%m/%d %H:%M:%S"),
        "name": r[2],
        "author": r[3],
    }, mycursor.fetchall()))

def getData():
    try:
        sql = f"SELECT data FROM {DataTable} WHERE hash = %s"
        val = (form.getfirst("hash"),)
        mycursor.execute(sql, val)
        return mycursor.fetchone()[0]
    except Exception as e:
        return {
            "succeeded": False,
            "message": "データが見つかりませんでした。",
            "traceback": traceback.format_exc()
        }

def putData():
    rawBytes = form["data"].file.read()
    hash = hashlib.md5(rawBytes).hexdigest()
    rawString = rawBytes.decode('utf-8')
    del rawBytes # 結構でかい可能性があるので一応
    jsonObj = json.loads(rawString)
    date = time.strftime("%Y-%m-%d %H:%M:%S")
    name = jsonObj["name"]
    author = form.getfirst("author") or ""
    delkey = secrets.token_hex(16)

    try:
        sql = f"INSERT INTO {DataTable} (hash, date, name, author, data, delkey) VALUES (%s, %s, %s, %s, %s, %s)"
        val = (hash, date, name, author, rawString, delkey)
        mycursor.execute(sql, val)
        mydb.commit()
        return {
            "succeeded": True,
            "hash": hash,
            "delkey": delkey,
        }
    except Exception as e:
        return {
            "succeeded": False,
            "message": "同じ内容のデータが既に投稿されています。",
            "traceback": traceback.format_exc()
        }

def delData():
    try:
        hash = form.getfirst("hash")
        delkey = form.getfirst("delkey")

        # データの削除
        sql = f"DELETE FROM {DataTable} WHERE hash = %s AND delkey = %s"
        val = (hash, delkey)
        mycursor.execute(sql, val)
        mydb.commit()

        if mycursor.rowcount > 0:
            # 関連するメッセージの削除
            sql = f"DELETE FROM {MessageTable} WHERE thread = %s"
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


print('Content-Type: application/json; charset="utf8"\r\nAccess-Control-Allow-Origin: *\r\n\r\n', end='')
try:
    mode = form.getfirst("mode")
    content = {
        "get": getData,
        "put": putData,
        "del": delData,
        "getm": getMessage,
        "putm": putMessage,
        "chkm": checkNewMessage,
    }.get(mode, getDataList)()

    if isinstance(content, dict) or isinstance(content, list):
        content = json.dumps(content, ensure_ascii=False)

    print(content, end='')

except Exception as e:
    print(json.dumps({
        "succeeded": False,
        "message": "想定外のエラー。",
        "traceback": traceback.format_exc()
    }, ensure_ascii=False),
    end='')
