#!/usr/bin/env python
import os
import xml.etree.ElementTree as ET
from datetime import datetime


# sitemap.xml

e_urlset = ET.Element('urlset', {'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9'})
def addURL(url, date):
    e_url = ET.SubElement(e_urlset, 'url')
    e_loc = ET.SubElement(e_url, 'loc')
    e_loc.text = url
    e_lastmod = ET.SubElement(e_url, 'lastmod')
    e_lastmod.text = date

def getLastCommitTime(path):
    cd = os.popen(f'git log -1 --format=%cd {path}').read().strip()
    date = datetime.strptime(cd, "%a %b %d %H:%M:%S %Y %z")
    return date.strftime("%Y-%m-%d")

addURL('https://legeclodb.github.io/', getLastCommitTime('../src/assets/main_characters.json'))
addURL('https://legeclodb.github.io/support.html', getLastCommitTime('../src/assets/support_characters.json'))
addURL('https://legeclodb.github.io/item.html', getLastCommitTime('../src/assets/items.json'))
addURL('https://legeclodb.github.io/about.html', getLastCommitTime('../src/components/About.vue'))

tree = ET.ElementTree(e_urlset)
tree.write('../docs/sitemap.xml', encoding='UTF-8', xml_declaration=True)


# robots.txt

with open('../docs/robots.txt', 'w') as f:
    content = """User-agent: *
Allow: /
Sitemap: https://legeclodb.github.io/sitemap.xml
"""
    f.write(content)
