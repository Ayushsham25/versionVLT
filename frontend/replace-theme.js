const fs = require('fs');
const path = require('path');

const colorMap = {
  // Backgrounds
  '#0d1117': '#070708', // Root bg
  '#161b22': '#111114', // Component bg
  '#21262d': '#1A1A1E', // Input/hover bg
  '#1f242c': '#1A1A1E', // Hover bg
  '#0a0c10': '#070708', // Very dark

  // Borders
  '#30363d': '#1F1F24',

  // Texts
  '#c9d1d9': '#FFFFFF', // Primary text
  '#8b949e': '#A0A0A0', // Secondary text
  '#58a6ff': '#17B7C8', // Secondary/Links (Teal/Cyan)
  
  // Greens to Primary (Purple/Blue)
  '#238636': '#5E6BFF', 
  '#2ea043': '#4D58E5',

  // Reds to Tertiary (Orange)
  '#f85149': '#C55F00',
  '#da3633': '#A54F00'
};

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      // ignore node_modules and .next
      if (!file.startsWith('.') && file !== 'node_modules') {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const srcDir = path.join(__dirname, 'src');
const files = walkSync(srcDir);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace each color ignoring case
  for (const [oldColor, newColor] of Object.entries(colorMap)) {
    const regex = new RegExp(oldColor, 'gi');
    content = content.replace(regex, newColor);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}

console.log('Theme replacement complete!');
