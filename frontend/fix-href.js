const fs = require('fs');
const file = 'src/app/features/home/home.html';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/href="#"/g, 'href="javascript:void(0)"');
fs.writeFileSync(file, content);
console.log("Done");
