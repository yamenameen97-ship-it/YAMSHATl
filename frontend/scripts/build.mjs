#!/usr/bin/env node

import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');
const publicRoot = path.join(projectRoot, 'public');
const distRoot = path.join(projectRoot, 'dist');

const envObject = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key]) => key.startsWith('VITE_'))
    .map(([key, value]) => [key, String(value ?? '')])
);

envObject.DEV = false;
envObject.PROD = true;
envObject.MODE = 'production';
envObject.BASE_URL = '/';

actionLog('تنظيف مجلد dist');
await fs.rm(distRoot, { recursive: true, force: true });
await fs.mkdir(distRoot, { recursive: true });

try {
  await fs.cp(publicRoot, distRoot, { recursive: true, force: true });
  actionLog('تم نسخ ملفات public');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
  actionLog('لا يوجد مجلد public، سيتم المتابعة بدونه');
}

const urlPlugin = {
  name: 'strip-url-query',
  setup(buildApi) {
    buildApi.onResolve({ filter: /\?url$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?url$/, '')),
    }));
  },
};

const result = await build({
  absWorkingDir: projectRoot,
  entryPoints: [path.join(srcRoot, 'main.jsx')],
  outdir: path.join(distRoot, 'assets'),
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  sourcemap: false,
  minify: true,
  legalComments: 'none',
  metafile: true,
  logLevel: 'info',
  entryNames: 'main',
  chunkNames: 'chunks/[name]-[hash]',
  assetNames: 'media/[name]-[hash]',
  external: ['/brand/*', '/icons/*', '/app-config.js', '/manifest.webmanifest', '/offline.html', '/sw.js', '/sw-enhanced.js'],
  loader: {
    '.js': 'jsx',
    '.jsx': 'jsx',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.gif': 'file',
    '.svg': 'file',
    '.webp': 'file',
    '.avif': 'file',
    '.mp4': 'file',
    '.webm': 'file',
    '.mp3': 'file',
    '.wav': 'file',
    '.m4a': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.ttf': 'file',
    '.eot': 'file',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env': JSON.stringify(envObject),
  },
  plugins: [urlPlugin],
});

const outputs = Object.keys(result.metafile.outputs);
const cssFile = outputs.find((file) => file.endsWith('main.css'));
const mainFile = outputs.find((file) => file.endsWith('main.js'));
const buildStamp = Date.now().toString();

if (!mainFile) {
  throw new Error('لم يتم إنشاء ملف JavaScript الرئيسي.');
}

const indexTemplatePath = path.join(projectRoot, 'index.html');
let indexHtml = await fs.readFile(indexTemplatePath, 'utf8');
const stylesheetTag = cssFile ? `    <link rel="stylesheet" href="/${path.relative(distRoot, cssFile).replace(/\\/g, '/')}" />\n` : '';
indexHtml = indexHtml.replace(/\/app-config\.js/g, `/app-config.js?v=${buildStamp}`);
indexHtml = indexHtml.replace(
  /\s*<script type="module" src="\/src\/main\.jsx"><\/script>\s*/,
  `\n${stylesheetTag}    <script type="module" src="/${path.relative(distRoot, mainFile).replace(/\\/g, '/')}\"></script>\n`
);
await fs.writeFile(path.join(distRoot, 'index.html'), indexHtml, 'utf8');

await fs.writeFile(
  path.join(distRoot, 'build-meta.json'),
  JSON.stringify(
    {
      builtAt: new Date().toISOString(),
      buildStamp,
      mainFile: path.relative(distRoot, mainFile).replace(/\\/g, '/'),
      cssFile: cssFile ? path.relative(distRoot, cssFile).replace(/\\/g, '/') : null,
    },
    null,
    2
  ),
  'utf8'
);

actionLog('اكتمل البناء بنجاح');

function actionLog(message) {
  console.log(`[build] ${message}`);
}
