#!/usr/bin/env python3
"""Send only changed, indexed HTML URLs after successful site deployment.

Requires full Git history; does nothing on manual dispatch or invalid history.
Each brand is configured separately in its own repository workflow.
"""
import json
import os
import pathlib
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

HOST = os.environ["INDEXNOW_HOST"]
KEY = os.environ["INDEXNOW_KEY"]
BEFORE = os.environ.get("INDEXNOW_BEFORE", "")
AFTER = os.environ.get("GITHUB_SHA", "")
EVENT = os.environ.get("GITHUB_EVENT_NAME", "")
BASE = "https://" + HOST
HEADERS = {"User-Agent": "Independent-Site-IndexNow/1.0"}
NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"

def git(*args):
    return subprocess.check_output(["git", *args], text=True, stderr=subprocess.STDOUT)

def report(message):
    print(message, flush=True)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as stream:
            stream.write(message + "\n")

def xml_urls(blob):
    try:
        root = ET.fromstring(blob)
    except ET.ParseError:
        return set()
    result = set()
    # Pick only loc nodes of sitemap URL entries, never hreflang or video URLs.
    for entry in root.iter():
        if entry.tag != NS + "url":
            continue
        loc = entry.find(NS + "loc")
        if loc is not None and loc.text:
            candidate = loc.text.strip()
            parsed = urllib.parse.urlparse(candidate)
            if parsed.scheme == "https" and parsed.netloc.lower() == HOST:
                result.add(candidate)
    return result

def sitemap_urls(ref):
    all_urls = set()
    # Git-tracked sitemap XMLs for this site, including subsidiary service/case maps.
    paths = git("ls-tree", "-r", "--name-only", ref).splitlines()
    for path in paths:
        if not (path.endswith(".xml") and "sitemap" in pathlib.PurePosixPath(path).name.lower()):
            continue
        try:
            all_urls |= xml_urls(subprocess.check_output(["git", "show", f"{ref}:{path}"]))
        except subprocess.CalledProcessError:
            pass
    return all_urls

def relative_file(url):
    raw = urllib.parse.urlparse(url).path
    decoded = urllib.parse.unquote(raw)
    if decoded.endswith("/"):
        return decoded.lstrip("/") + "index.html"
    return decoded.lstrip("/") or "index.html"

def main():
    if EVENT != "push":
        report("IndexNow: manual or non-push deployment; no changes submitted.")
        return
    if not BEFORE or set(BEFORE) == {"0"} or not AFTER:
        report("IndexNow: missing push comparison; safe skip.")
        return
    try:
        git("cat-file", "-e", BEFORE + "^{commit}")
        changes = git("diff", "--name-status", "--no-renames", BEFORE, AFTER).splitlines()
    except subprocess.CalledProcessError as exc:
        report("IndexNow: cannot compare deployment commits; safe skip: " + str(exc)[:200])
        return
    # A/D/M/T only; renamed files appear as deletion and addition.
    changed = {}
    for line in changes:
        parts = line.split("\t", 1)
        if len(parts) == 2 and parts[1].lower().endswith(".html"):
            changed[parts[1]] = parts[0][0]
    if not changed:
        report("IndexNow: no changed HTML pages in this deployment; no requests.")
        return

    current = sitemap_urls(AFTER)
    previous = sitemap_urls(BEFORE)
    current_paths = {relative_file(u): u for u in current}
    previous_paths = {relative_file(u): u for u in previous}
    selected = []
    for path, status in changed.items():
        if status == "D":
            url = previous_paths.get(path)
        else:
            url = current_paths.get(path)
        if url:
            selected.append((url, status))
        else:
            report(f"IndexNow: skip {path}, absent from respective sitemap.")
    if not selected:
        report("IndexNow: no sitemap-listed HTML URLs changed; no requests.")
        return

    key_url = BASE + "/" + KEY + ".txt"
    try:
        with urllib.request.urlopen(urllib.request.Request(key_url, headers=HEADERS), timeout=15) as response:
            published = response.read(200).decode("utf-8").strip()
        if published != KEY:
            raise ValueError("Key file contents mismatch")
    except Exception as exc:
        raise SystemExit(f"IndexNow: public key verification failed for {HOST}: {exc}")
    verified = []
    for url, status in selected:
        if status == "D":
            verified.append(url)
            continue
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=15) as response:
                final = urllib.parse.urlparse(response.geturl())
                if response.status == 200 and final.netloc.lower() == HOST:
                    verified.append(url)
                else:
                    report(f"IndexNow: skip unverified live URL {url} (HTTP {response.status}).")
        except Exception as exc:
            report(f"IndexNow: skip inaccessible URL {url}: {exc}")
    verified = sorted(set(verified))
    if not verified:
        report("IndexNow: no verified new/updated or removed URLs to notify.")
        return

    payload = json.dumps({
        "host": HOST, "key": KEY, "keyLocation": key_url, "urlList": verified
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8", **HEADERS},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            status = response.status
            body = response.read(500).decode("utf-8", "replace")
        if status not in (200, 202):
            raise RuntimeError(f"IndexNow HTTP {status}: {body}")
        report(f"IndexNow: accepted HTTP {status}; {len(verified)} changed URL(s) on {HOST}.")
        for url in verified:
            report("- " + url)
    except urllib.error.HTTPError as exc:
        message = exc.read(500).decode("utf-8", "replace")
        raise SystemExit(f"IndexNow rejected {HOST}: HTTP {exc.code}: {message}")

if __name__ == "__main__":
    main()
