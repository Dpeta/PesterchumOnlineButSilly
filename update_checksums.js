const crypto = require('crypto');

const fs = require("fs");

const buff = fs.readFileSync("./dist/pesterchum.js","utf8");
const hash = crypto.createHash("sha256").update(buff).digest("binary");
//base64
base64= Buffer.from(hash,"binary").toString('base64')
console.log(base64)







/*
//replacing function
readFile('./example.txt', 'utf-8', function (err, contents) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(contents)
  //const replaced = contents.replace(/to be replaced/g, 'replacement string');

  //writeFile('./example.txt', replaced, 'utf-8', function (err) {
  //  console.log(err);
  //});
});*/
