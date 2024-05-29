#!/usr/bin/env python3
"""Script to update integrity checksums in 'index.html'."""
import re
import hashlib
import base64

re_script = re.compile(
    r'<script src="dist/pesterchum\.js" integrity="sha256-.+?" defer></script>'
)
re_style = re.compile(
    r'<link rel="stylesheet" integrity="sha256-.+?" href="style\.css">'
)
re_preload_script = re.compile(
    r'<link rel="preload" href="dist/pesterchum\.js" integrity="sha256-.+?" as="script">'
)
re_preload_style = re.compile(
    r'<link rel="preload" href="style\.css" integrity="sha256-.+?" as="style">'
)

with open("index.html", encoding="utf-8") as index:
    data = index.read()

# Get hashes of pesterchum.js
pchumjs_hash = hashlib.sha256()
with open("dist/pesterchum.js", "rb") as pchumjs:
    pchumjs_hash.update(pchumjs.read())
pchumjs_hash = base64.b64encode(pchumjs_hash.digest()).decode()
print(f"pesterchum.js hash: {pchumjs_hash}")

# Get hashes of style.css
style_hash = hashlib.sha256()
with open("style.css", "rb") as stylecss:
    style_hash.update(stylecss.read())
style_hash = base64.b64encode(style_hash.digest()).decode()
print(f"style.css hash: {style_hash}")

script = f'<script src="dist/pesterchum.js" integrity="sha256-{pchumjs_hash}" defer></script>'
style = f'<link rel="stylesheet" integrity="sha256-{style_hash}" href="style.css">'
script_preload = (
    '<link rel="preload" href="dist/pesterchum.js" '
    f'integrity="sha256-{pchumjs_hash}" as="script">'
)
style_preload = (
    f'<link rel="preload" href="style.css" integrity="sha256-{style_hash}" as="style">'
)

data = re.sub(re_script, script, data)
data = re.sub(re_style, style, data)
data = re.sub(re_preload_script, script_preload, data)
data = re.sub(re_preload_style, style_preload, data)

with open("index.html", "w", encoding="utf-8") as index:
    index.write(data)
