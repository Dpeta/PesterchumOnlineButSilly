#!/bin/sh
# npm install @babel/core @babel/cli @babel/preset-env browserify core-js babelify
./node_modules/.bin/browserify src/pesterchum.js -o dist/pesterchum.js -t babelify
cat dist/pesterchum.js | openssl dgst -sha256 -binary | openssl base64 -A && echo
