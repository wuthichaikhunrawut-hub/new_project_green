const fs = require('fs');
const path = require('path');

function walk(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      if (!p.includes('node_modules') && !p.includes('dist') && !p.includes('.git') && !p.includes('.angular')) {
        filelist = walk(p, filelist);
      }
    }
    else {
      if (p.endsWith('.ts') && !p.endsWith('.spec.ts')) {
        filelist.push(p);
      }
    }
  });
  return filelist;
}

const allTsFiles = walk('c:\\Users\\Vteca\\project-green\\backend\\src').concat(walk('c:\\Users\\Vteca\\project-green\\frontend\\src'));
const incompleteFunctions = [];

allTsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, i) => {
    const l = line.toLowerCase();
    if (l.includes('todo') || l.includes('fixme') || l.includes('not implemented') || l.includes('mock') || l.includes('dummy')) {
      incompleteFunctions.push({
        file,
        line: i + 1,
        content: line.trim()
      });
    }
  });

  // Find empty methods and functions, excluding constructors and catch blocks
  const methodRegex = /(?:public\s+|private\s+|protected\s+|async\s+)*\w+\s*\([^)]*\)\s*(?::\s*[^{]+)?\{\s*\}/g;
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    const text = match[0];
    if (!text.includes('constructor') && !text.includes('catch') && !text.includes('if (') && !text.includes('for (')) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      incompleteFunctions.push({
          file,
          line: lineNum,
          content: text.trim() + " (Empty Function)"
      });
    }
  }
});

fs.writeFileSync('c:\\Users\\Vteca\\project-green\\tools\\incomplete_results.json', JSON.stringify(incompleteFunctions, null, 2));
console.log(`Found ${incompleteFunctions.length} incomplete items.`);
