# PesterchumOnlineButSilly
Static Pure-JavaScript Pesterchum client (it's a bit too goofy and silly)

Pretty much the only thing I've ever made using JavaScript, so it's really not very good. Hopefully at least passably secure though; all content from the server is escaped and the live server has a fairly strict content security header. ([observatory](https://observatory.mozilla.org/analyze/pesterchum.online))

An important difference between this and previous PCO clients is that this client is fully client side and connects over a WebSocket connection, this means that:
 - The hosting server only needs to serve static content.
 - The hosting server won't act as a proxy, so banning a PCO user will actually ban the user instead of the PCO server like with the previous clients.

Even if this client is kinda bad; it's probably best if future online clients also use a WebSocket connection now that IRC is gaining support for it, it's better than the PCO server having to proxy all messages.

## Local setup
Just download and open index-src.html, the site is fully static so there's no further setup :3

## Setup for web server (without babel)
```sh
mkdir dist
cp src/pesterchum.js dist/pesterchum.js
cat dist/pesterchum.js | openssl dgst -sha256 -binary | openssl base64 -A
```
Afterwards you have to put the resulting hash of the script into the integrity fields in index.html's script/preload tags, and ideally also add it to the server's content security header.

## Setup for web server (with babel)
Lets the client run on evil old browsers </3

Install dependenies.
```sh
npm install @babel/core @babel/cli @babel/preset-env browserify core-js babelify
```
Run source through browserify + babel, equivalent to running bundle.sh:
```sh
./node_modules/.bin/browserify src/pesterchum.js -o dist/pesterchum.js -t babelify
cat dist/pesterchum.js | openssl dgst -sha256 -binary | openssl base64 -A && echo
```
Then input the resulting hashes, same as the previous setup.
