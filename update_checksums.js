const crypto = require('crypto');

const fs = require("fs");

<<<<<<< HEAD
const buff = fs.readFileSync("./dist/pesterchum.js","utf8");
const hash = crypto.createHash("sha256").update(buff).digest("binary");
//base64
base64= Buffer.from(hash,"binary").toString('base64')
console.log(base64)
=======
const noBabelJsRegex=/<script src="dist\/pesterchum\.js" integrity="sha256-[^"]*" defer><\/script>/gm
const noBabelCssRegex=/<link rel="stylesheet" integrity="sha256-[^"]*" href="style\.css">/gm
const babeljsRegex=/<link rel="preload" href="style\.css" integrity="sha256-[^"]*" as="style">/gm
const babelCssRegex=/<link rel="preload" href="dist\/pesterchum\.js" integrity="sha256-[^"]*" as="script">/gm
>>>>>>> 437fa81b8642b3f21ca8d14404977de540d896df

const hashFile=(path)=>{
  const buff = fs.readFileSync(path,"utf8");
  const hash = createHash("sha256").update(buff).digest("binary");
  base64= Buffer.from(hash,"binary").toString('base64')
  return base64 
}
// here we have finally the hashes
jsHash=hashFile("./src/pesterchum.js")
cssHash=hashFile("./style.css")

//replacing function non tested
fs.readFile('./index.html', 'utf-8',  (err, contents) => {
  if (err) {
    console.log(err);
    return;
  }
  
  let replaced = contents.replace(babelCssRegex, `<link rel="preload" href="style.css" integrity="sha256-${cssHash}" as="style">`);
  replaced= replaced.replace(babelJsRegex,`<link rel="preload" href="dist/pesterchum.js" integrity="sha256-${jsHash}" as="script">`)
  replaced= replaced.replace(noBabelCssRegex,`<link rel="stylesheet" integrity="sha256-v${cssHash}" href="style.css">`)
  replaced= replaced.replace(noBabelJsRegex,`<script src="dist/pesterchum.js" integrity="sha256-${jsHash}" defer></script>`)

<<<<<<< HEAD
  //writeFile('./example.txt', replaced, 'utf-8', function (err) {
  //  console.log(err);
  //});
});*/
=======
  fs.writeFile('./index.html', replaced, 'utf-8', function (err) {
    console.log(err);
  });
});
>>>>>>> 437fa81b8642b3f21ca8d14404977de540d896df
