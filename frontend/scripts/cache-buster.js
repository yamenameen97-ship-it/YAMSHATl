#!/usr/bin/env node

/**
 * Cache Buster Script
 * يقوم بتحديث رقم الإصدار تلقائياً قبل كل بناء لضمان مسح الكاش
 * 
 * الاستخدام: node scripts/cache-buster.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// تعويض __dirname في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// مسار ملف Service Worker
const swPath = path.join(__dirname, '../public/sw.js');

// إنشاء رقم إصدار فريد بناءً على الوقت الحالي والتاريخ
function generateVersion() {
  const now = new Date();
  const timestamp = now.getTime();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
  
  // صيغة الإصدار
  return `yamshat-v${dateStr}-${timeStr}-${timestamp}`;
}

// قراءة محتوى Service Worker الحالي
let swContent = fs.readFileSync(swPath, 'utf-8');

// استخراج الإصدار القديم
const oldVersionMatch = swContent.match(/const VERSION = '([^']+)'/);
const oldVersion = oldVersionMatch ? oldVersionMatch[1] : 'unknown';

// إنشاء إصدار جديد
const newVersion = generateVersion();

// تحديث الإصدار في الملف
swContent = swContent.replace(
  /const VERSION = '[^']+'/,
  `const VERSION = '${newVersion}'`
);

// كتابة الملف المحدّث
fs.writeFileSync(swPath, swContent, 'utf-8');

console.log('✅ تم تحديث رقم الإصدار في Service Worker');
console.log(`   الإصدار القديم: ${oldVersion}`);
console.log(`   الإصدار الجديد: ${newVersion}`);
console.log(`   الملف: ${swPath}`);
