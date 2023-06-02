#!/usr/bin/env python
import os
import xml.etree.ElementTree as ET
from datetime import datetime

os.chdir(os.path.dirname(os.path.abspath(__file__)))

baseURL = 'https://legeclodb.github.io/'
assets = '../src/assets/'
components = '../src/components/'
docs = '../docs/'


# sitemap.xml

e_urlset = ET.Element('urlset', {'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9'})
def addURL(url, date):
    e_url = ET.SubElement(e_urlset, 'url')
    e_loc = ET.SubElement(e_url, 'loc')
    e_loc.text = url
    e_lastmod = ET.SubElement(e_url, 'lastmod')
    e_lastmod.text = date.strftime("%Y-%m-%d")

def getLastCommitTime(path):
    if (type(path) is list):
        return max(map(getLastCommitTime, path))
    else:
        cd = os.popen(f'git log -1 --format=%cd {path}').read().strip()
        return datetime.strptime(cd, "%a %b %d %H:%M:%S %Y %z")

mainChrFiles = [
    assets + 'main_active.json',
    assets + 'main_passive.json',
    assets + 'main_talents.json',
    assets + 'main_characters.json',
    components + 'MainCharacters.vue'
]
supportChrFiles = [
    assets + 'support_active.json',
    assets + 'support_passive.json',
    assets + 'support_characters.json',
    components + 'SupportCharacters.vue'
]
itemFiles = [
    assets + 'items.json',
    components + 'Items.vue'
]
aboutFiles = [
    components + 'About.vue'
]

addURL(baseURL, getLastCommitTime(mainChrFiles))
addURL(baseURL + 'support.html', getLastCommitTime(supportChrFiles))
addURL(baseURL + 'item.html', getLastCommitTime(itemFiles))
addURL(baseURL + 'about.html', getLastCommitTime(aboutFiles))

tree = ET.ElementTree(e_urlset)
tree.write(docs + 'sitemap.xml', encoding='UTF-8', xml_declaration=True)


# robots.txt

with open(docs + 'robots.txt', 'w') as f:
    content = f"""User-agent: *
Allow: /
Sitemap: {baseURL}sitemap.xml
"""
    f.write(content)
