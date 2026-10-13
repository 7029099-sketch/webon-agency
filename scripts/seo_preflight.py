#!/usr/bin/env python3
"""Check SEO essentials for each page in the WebON Agency sitemap before deployment."""
from html.parser import HTMLParser
from pathlib import Path
import sys
import xml.etree.ElementTree as ET


class Meta(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.title_parts = []
        self.descriptions = []
        self.canonicals = []
        self.h1_count = 0
        self.noindex = False

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "title":
            self.in_title = True
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "link" and "canonical" in attributes.get("rel", "").lower().split():
            self.canonicals.append(attributes.get("href", ""))
        elif tag == "meta":
            if attributes.get("name", "").lower() == "description":
                self.descriptions.append(attributes.get("content", ""))
            if attributes.get("name", "").lower() == "robots" and "noindex" in attributes.get("content", "").lower():
                self.noindex = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title_parts.append(data)


def main():
    origin = "https://webon.agency/"
    root = ET.parse("sitemap.xml").getroot()
    urls = [node.text.strip() for node in root.findall(".//{*}loc") if node.text]
    errors = []
    if len(urls) < 17 or len(set(urls)) != len(urls):
        errors.append("Sitemap has missing or duplicate page URLs")
    seen_titles = set()
    for url in urls:
        if not url.startswith(origin):
            errors.append("Cross-domain sitemap URL: " + url)
            continue
        relative = url[len(origin):] or "index.html"
        path = Path(relative)
        if not path.is_file() or path.suffix != ".html":
            errors.append(relative + ": missing HTML file")
            continue
        source = path.read_text(encoding="utf-8")
        meta = Meta()
        meta.feed(source)
        title = "".join(meta.title_parts).strip()
        if len(title) < 15 or title in seen_titles:
            errors.append(relative + ": missing, short or duplicate title")
        seen_titles.add(title)
        if len(meta.descriptions) != 1 or not meta.descriptions[0].strip():
            errors.append(relative + ": missing or duplicate meta description")
        if meta.canonicals != [url]:
            errors.append(relative + ": non-self canonical: " + str(meta.canonicals))
        if meta.h1_count != 1:
            errors.append(relative + ": expected exactly one H1")
        if meta.noindex:
            errors.append(relative + ": noindex page included in sitemap")
        if not source.lower().split("<html", 1)[-1].split(">", 1)[0].count('lang="en"'):
            errors.append(relative + ": English lang marker missing")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)
    print("WebON Agency SEO preflight OK:", len(urls), "pages")


if __name__ == "__main__":
    main()
