const crypto = require('crypto');

const fs = require("fs");

const noBabelJsRegex=/<script src="dist\/pesterchum\.js" integrity="sha256-[^"]*" defer><\/script>/gm
const noBabelCssRegex=/<link rel="stylesheet" integrity="sha256-[^"]*" href="style\.css">/gm
const babeljsRegex=/<link rel="preload" href="style\.css" integrity="sha256-[^"]*" as="style">/gm
const babelCssRegex=/<link rel="preload" href="dist\/pesterchum\.js" integrity="sha256-[^"]*" as="script">/gm

const hashFile=(path)=>{
  const buff = fs.readFileSync(path);
  const hash = createHash("sha256").update(buff).digest("hex");
  base64= Buffer.from(hash).toString('base64')
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

  fs.writeFile('./index.html', replaced, 'utf-8', function (err) {
    console.log(err);
  });
});