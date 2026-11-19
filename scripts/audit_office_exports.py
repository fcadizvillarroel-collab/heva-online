#!/usr/bin/env python3
"""Structural inspection of exported DOCX/PPTX (stdlib only).
This cannot judge factual accuracy, teaching quality, image relevance, or visual layout.
Usage: python3 scripts/audit_office_exports.py material.docx material.pptx
"""
import json, re, sys, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

def inspect(path):
    path = Path(path)
    report = {"file": str(path), "format": path.suffix.lower().lstrip("."),
              "errors": [], "warnings": [], "images": 0, "text_chars": 0}
    if not path.is_file():
        report["errors"].append("File not found")
        return report
    if path.suffix.lower() not in (".pptx", ".docx"):
        report["errors"].append("Unsupported format")
        return report
    try:
        with zipfile.ZipFile(path) as archive:
            bad = archive.testzip()
            if bad:
                report["errors"].append("Corrupted ZIP member: " + bad)
            files = archive.namelist()
            media = [f for f in files if re.match(r"word/media/|ppt/media/", f) and not f.endswith("/")]
            report["images"] = len(media)
            report["media_bytes"] = sum(archive.getinfo(f).file_size for f in media)
            if "[Content_Types].xml" not in files:
                report["errors"].append("Missing OOXML content types")
            if path.suffix.lower() == ".pptx":
                slide_files = sorted((f for f in files if re.fullmatch(r"ppt/slides/slide\d+\.xml", f)),
                                     key=lambda f: int(re.search(r"slide(\d+)", f).group(1)))
                report["slides"] = len(slide_files)
                if not slide_files:
                    report["errors"].append("No slides")
                for file in slide_files:
                    root = ET.fromstring(archive.read(file))
                    txt = " ".join((node.text or "") for node in root.findall(".//a:t", NS))
                    report["text_chars"] += len(txt)
                    if not txt.strip():
                        report["warnings"].append(file + ": no visible text")
                    if len(txt) > 950:
                        report["warnings"].append(file + ": dense text (" + str(len(txt)) + " characters)")
                    pictures = root.findall(".//p:pic", NS)
                    if pictures and not media:
                        report["errors"].append(file + ": picture references but no embedded media")
                report["slide_picture_count"] = sum(len(ET.fromstring(archive.read(f)).findall(".//p:pic", NS)) for f in slide_files)
            else:
                if "word/document.xml" not in files:
                    report["errors"].append("Missing document body")
                else:
                    root = ET.fromstring(archive.read("word/document.xml"))
                    paragraphs = ["".join(t.text or "" for t in p.findall(".//w:t", NS))
                                  for p in root.findall(".//w:p", NS)]
                    report["paragraphs"] = len(paragraphs)
                    report["text_chars"] = sum(map(len, paragraphs))
                    if report["text_chars"] < 150:
                        report["warnings"].append("Very little document text")
            if report["images"] == 0:
                report["warnings"].append("No embedded media; check whether visuals were requested")
    except (zipfile.BadZipFile, ET.ParseError, OSError, RuntimeError) as exc:
        report["errors"].append(type(exc).__name__ + ": " + str(exc))
    return report

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: audit_office_exports.py file.docx [file.pptx ...]", file=sys.stderr)
        sys.exit(2)
    reports = [inspect(f) for f in sys.argv[1:]]
    print(json.dumps(reports, ensure_ascii=False, indent=2))
    sys.exit(1 if any(r["errors"] for r in reports) else 0)
