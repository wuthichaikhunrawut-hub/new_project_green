const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBADF') filelist.push(dirFile);
    }
  });
  return filelist;
};

const htmlFiles = walkSync(path.join(__dirname, 'src', 'app')).filter(f => f.endsWith('.html'));

let replacedCount = 0;

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/style="[^"]*backdrop-filter:\s*blur\(4px\);?[^"]*"/g, '');
  content = content.replace(/class="bg-black\/60" style=""/g, 'class="bg-black/60 backdrop-blur-sm"');
  content = content.replace(/class="bg-black\/60"/g, 'class="bg-black/60 backdrop-blur-sm"');

  content = content.replace(/style="[^"]*font-size:\s*15rem;?[^"]*"/g, 'class="text-[15rem]"');
  content = content.replace(/style="[^"]*font-size:\s*18px;?[^"]*"/g, 'class="text-[18px]"');
  content = content.replace(/style="[^"]*font-size:\s*1rem;?[^"]*"/g, 'class="text-base"');
  
  content = content.replace(/style="[^"]*color:\s*#2D6A4F;?[^"]*"/g, 'class="text-[#2D6A4F]"');
  content = content.replace(/style="[^"]*color:\s*#2D6A4F;\s*font-weight:\s*700;?[^"]*"/g, 'class="text-[#2D6A4F] font-bold"');
  content = content.replace(/style="[^"]*color:\s*#95D5B2;?[^"]*"/g, 'class="text-[#95D5B2]"');

  content = content.replace(/style="[^"]*text-align:\s*right;?[^"]*"/g, 'class="text-right"');
  content = content.replace(/style="[^"]*margin:\s*4px\s+0\s+0;?[^"]*"/g, 'class="mt-1"');
  content = content.replace(/style="[^"]*display:\s*none;?[^"]*"/g, 'class="hidden"');

  content = content.replace(/style="[^"]*letter-spacing:\s*[0-9.]+px;?[^"]*"/g, 'class="tracking-wide"');
  content = content.replace(/style="[^"]*animation-delay:\s*[0-9.]+s;?[^"]*"/g, '');

  content = content.replace(/style=""/g, '');
  content = content.replace(/style=" "/g, '');
  content = content.replace(/style="  "/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content);
    replacedCount++;
    console.log('Updated: ' + file);
  }
});

console.log('Total files updated: ' + replacedCount);
