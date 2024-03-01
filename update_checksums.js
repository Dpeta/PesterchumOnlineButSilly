const crypto = require('crypto');

const fs = require("fs");

const buff = fs.readFileSync("./src/pesterchum.js");
const hash = createHash("sha256").update(buff).digest("hex");
console.log(hash);
//base64
base64= Buffer.from(hash).toString('base64')
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