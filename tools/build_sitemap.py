#!/usr/bin/env python
import os, time
import xml.etree.ElementTree as ET
from datetime import datetime


# sitemap.xml

e_urlset = ET.Element('urlset', {'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9'})
def addURL(url, mtime):
    e_url = ET.SubElement(e_urlset, 'url')
    e_loc = ET.SubElement(e_url, 'loc')
    e_loc.text = url
    e_lastmod = ET.SubElement(e_url, 'lastmod')
    e_lastmod.text = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")

addURL('https://legeclodb.github.io/', os.path.getmtime('../src/assets/main_characters.json'))
addURL('https://legeclodb.github.io/support.html', os.path.getmtime('../src/assets/support_characters.json'))
addURL('https://legeclodb.github.io/item.html', os.path.getmtime('../src/assets/items.json'))
addURL('https://legeclodb.github.io/about.html', os.path.getmtime('../src/components/about.vue'))

tree = ET.ElementTree(e_urlset)
tree.write('../docs/sitemap.xml', encoding='UTF-8', xml_declaration=True)


# robots.txt

with open('../docs/robots.txt', 'w') as f:
    content = """User-agent: *
Allow: /
Sitemap: https://legeclodb.github.io/sitemap.xml
"""
    f.write(content)
