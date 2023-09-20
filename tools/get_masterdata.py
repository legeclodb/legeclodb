# -*- coding: utf-8 -*-
import os, json, requests
from zipfile import ZipFile

def getMasterDataVersionGuid():
    url = 'https://pcr.legend-clover.net/v1/master_data/get_version'
    result = json.loads(requests.get(url).content)
    return result["result"]["MasterDataVersionGuid"]

def getMasterData(guid, password):
    url = f'https://master.legend-clover.net/{guid}.zip'
    os.makedirs('tmp/masterdata', exist_ok = True)
    local = f'tmp/masterdata/{guid}.zip'
    if os.path.exists(local):
        print(f'exists: {local}')
    else:
        with open(local, mode='wb') as f:
            f.write(requests.get(url).content)
            print("downloaded: " + url)
        with ZipFile(local, 'r') as zf:
            dstdir = f'tmp/masterdata/{guid}'
            os.makedirs(dstdir, exist_ok = True)
            zf.extractall(path=dstdir, pwd=password)

password = open("tmp/password.txt", "rb").read()
guid = getMasterDataVersionGuid()
getMasterData(guid, password)
