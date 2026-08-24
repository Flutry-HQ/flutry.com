import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const input = 'public/icon.png';
const outDir = 'public/icon';

const files = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
];

function exists(file: string) {
  return fs.existsSync(file);
}

async function run() {
  if (!exists(input)) {
    console.error('❌ Missing public/icon.png');
    process.exit(1);
  }

  console.log('🚀 Generating web assets...');

  fs.mkdirSync(outDir, { recursive: true });
  for (const f of files) {
    await sharp(input).resize(f.size, f.size).toFile(path.join(outDir, f.file));
  }
  await sharp(input).resize(32, 32).toFile(path.join(outDir, 'favicon.ico'));
  console.log('Assets Generated');
}

run();
