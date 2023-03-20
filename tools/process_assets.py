#!/usr/bin/env python
import os, shutil, glob, re, json

# AssetStudio で展開したアセットの場所で実行される想定
# (_material.mat, .atlas.gz, .skel.bytes, skeletondata.asset を AssetStudio で展開すると
#  MonoBehaviour, TextAsset, Texture2D ディレクトリができているはず。それらがある場所で実行する)

for d in ["MonoBehaviour", "TextAsset", "Texture2D"]:
    for f in glob.glob(d + "/*"):
        if os.path.isfile(f):
            print(f)
            shutil.move(f, './')
    if os.path.isdir(d):
        os.rmdir(d)

for png in glob.glob('*.png'):
    name = png.split('.')[0]
    if not os.path.exists(name):
        os.mkdir(name)
    for f in glob.glob(name + '*'):
        if os.path.isdir(f):
            continue
        dst = name + '/' + f
        dst = dst.replace('.atlas.asset', '.atlas.txt')
        dst = dst.replace('.skel.asset', '.skel.bytes')
        if os.path.isfile(dst):
            os.remove(dst)
        print("{f} -> {dst}".format(f=f, dst=dst))
        shutil.move(f, dst)
