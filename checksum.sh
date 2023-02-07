#!/bin/sh
echo Checksum of dist/pesterchum.js:
cat dist/pesterchum.js | openssl dgst -sha256 -binary | openssl base64 -A && echo
echo Checksum of style.css:
cat style.css | openssl dgst -sha256 -binary | openssl base64 -A && echo
