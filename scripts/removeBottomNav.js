import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/import\s+BottomNav\s+from\s+['"].*?BottomNav['"];?\n?/g, '');
  content = content.replace(/<BottomNav\s*\/>\s*/g, '');
  fs.writeFileSync(filePath, content);
});
