import fs from 'fs';
import path from 'path';

const filesToCopy = [
  { src: 'public/robots.txt', dest: 'dist/robots.txt' },
  { src: 'public/sitemap.xml', dest: 'dist/sitemap.xml' },
  { src: 'public/manifest.json', dest: 'dist/manifest.json' },
];

const distDir = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist. Run vite build first.');
  process.exit(1);
}

for (const file of filesToCopy) {
  const srcPath = path.resolve(process.cwd(), file.src);
  const destPath = path.resolve(process.cwd(), file.dest);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${file.src} -> ${file.dest}`);
  } else {
    console.warn(`Warning: ${file.src} not found`);
  }
}

console.log('SEO files copied successfully.');
