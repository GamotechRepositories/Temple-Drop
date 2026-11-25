import fs from 'fs';
import path from 'path';

function searchDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') searchDir(full);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (/(\bCR\b|['"]CR['"]|>CR<| CR)/.test(line)) {
          console.log(`${full}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

searchDir('client/src');
searchDir('shared/src');
searchDir('server/src');
