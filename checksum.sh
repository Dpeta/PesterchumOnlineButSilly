#!/bin/sh
cat dist/pesterchum.js | openssl dgst -sha256 -binary | openssl base64 -A && echo
