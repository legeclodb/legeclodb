#!/usr/bin/env python
import string, os, glob, re, json, requests, glob


def replaceNonPrintableChars(bytes):
    printable = set(string.printable)
    r = ""
    for b in bytes:
        c = chr(b)
        if c not in printable:
            r += " "
        else:
            r += c
    return r


def download(url, dir, filename=None):
    outpath = dir + (os.path.basename(url) if not filename else filename)
    if os.path.exists(outpath):
        #print(f"skipped: {url}")
        return
    os.makedirs(dir, exist_ok = True)
    with open(outpath, mode='wb') as f:
        f.write(requests.get(url).content)
        print("downloaded: " + url)


data = requests.get('https://asset.legend-clover.net/pcr/fileInfo').content
fileInfo = json.loads(str(data, 'utf-8'))["List"]
dstDir = 'tmp/'

with open(f"{dstDir}/fileInfo.json", 'w', encoding="utf-8") as f:
    json.dump(fileInfo, f, indent=2, ensure_ascii=False)


def findFile(pattern):
    for info in fileInfo:
        name = info["Name"]
        r = re.match(pattern, name)
        if r:
            #print(r[0])
            yield r

def downloadUsm():
    existing = list(map(lambda a: re.sub(r'^.+?usm\\([^.]+).usm_.*', r'\1', a), glob.glob(f"{dstDir}/usm/*")))
    files = []
    def add(file, name):
        if not name in existing:
            files.append(file)

    for m in findFile("adv/movie/([^.]+)\\.usm\\.bytes"):
        add(m[0], m[1])
    files.sort()
    for f in files:
        download('https://asset.legend-clover.net/pcr/' + f, f"{dstDir}/usm/")


def downloadChr():
    files = []
    def add(file, cid, name):
        if not os.path.exists(f"{dstDir}st/{cid}/{name}"):
            files.append([file, cid])

    for m in findFile("characters/(\d+)/avatar/standing/export/([^.]+?)(_skeletondata\\.asset|_material\\.mat|\\.skel\\.bytes|\\.atlas\\.txt)"):
        add(m[0], m[1], m[2])
    files.sort()
    for f in files:
        download('https://asset.legend-clover.net/pcr/' + f[0], f"{dstDir}/st/{f[1]}/")


def downloadThumb():
    files = []
    def add(file, local):
        if not os.path.exists(f"{dstDir}thumb/{local}"):
            files.append(file)

    for m in findFile("ui/character/thumbnail/default/(default_[^.]+?\\.png)"):
        add(m[0], m[1])
    files.sort()
    for f in files:
        download('https://asset.legend-clover.net/pcr/' + f, f"{dstDir}/thumb/")


def downloadIcon():
    files = []
    def add(file, local):
        if not os.path.exists(f"{dstDir}thumb/{local}"):
            files.append(file)

    for m in findFile("ui/icon/skillicon/([^.]+?\\.png)"):
        add(m[0], m[1])
    files.sort()
    for f in files:
        download('https://asset.legend-clover.net/pcr/' + f, f"{dstDir}/icon/")

downloadThumb()
downloadIcon()
downloadChr()
downloadUsm()
