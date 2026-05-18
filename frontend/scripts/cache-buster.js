#!/usr/bin/env node

/**
 * Cache Buster Script
 * يقوم بتحديث رقم الإصدار تلقائياً قبل كل بناء لضمان مسح الكاش
 * متوافق مع type=module في package.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swPath = path.resolve(__dirname, '../public/sw.js');

function generateVersion() {
  const now = new Date();
  const timestamp = now.getTime();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return `yamshat-v${dateStr}-${timeStr}-${timestamp}`;
}

if (!fs.existsSync(swPath)) {
  console.log('ℹ️ لم يتم العثور على public/sw.js، تم تخطي تحديث الإصدار.');
  process.exit(0);
}

let swContent = fs.readFileSync(swPath, 'utf-8');
const oldVersionMatch = swContent.match(/const VERSION = '([^']+)'/);
const oldVersion = oldVersionMatch ? oldVersionMatch[1] : 'unknown';
const newVersion = generateVersion();

if (/const VERSION = '[^']+'/.test(swContent)) {
  swContent = swContent.replace(/const VERSION = '[^']+'/, `const VERSION = '${newVersion}'`);
} else {
  swContent = `const VERSION = '${newVersion}';\n${swContent}`;
}

fs.writeFileSync(swPath, swContent, 'utf-8');

console.log('✅ تم تحديث رقم الإصدار في Service Worker');
console.log(`   الإصدار القديم: ${oldVersion}`);
console.log(`   الإصدار الجديد: ${newVersion}`);
console.log(`   الملف: ${swPath}`);
