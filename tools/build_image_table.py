#!/usr/bin/env python
import json, shutil, re, requests, hashlib

srcPath = "../src/assets/image_table.json"
imgPath = "../public/img/"
imageTable = json.load(open(srcPath))

def makeHash(str):
    return hashlib.md5(k.encode('utf-8')).hexdigest()

for k in imageTable:
    path = imageTable[k]
    if (re.search(r'^https://', path)):
        filename = makeHash(k) + ".png"
        with open(imgPath + filename, mode='wb') as f:
            f.write(requests.get(path).content)
            print("downloaded: " + path + " -> " + filename)
            imageTable[k] = "img/" + filename;
    elif (not re.search(r'^img/', path)):
        filename = makeHash(k) + ".png"
        shutil.copyfile("../public/" + path, "../public/img/" + filename)
        print("copied: " + path + " -> " + filename)
        imageTable[k] = "img/" + filename;

with open('image_table.json', 'w') as f:
    json.dump(imageTable, f, indent=2, ensure_ascii=False)
