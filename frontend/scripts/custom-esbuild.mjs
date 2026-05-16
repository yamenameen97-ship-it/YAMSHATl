import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const assetsDir = path.join(distDir, 'assets');

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

const envObject = {
  DEV: false,
  PROD: true,
  MODE: 'production',
  BASE_URL: '/',
  SSR: false,
  VITE_API_BASE: '',
  VITE_BACKEND_ORIGIN: '',
  VITE_SOCKET_URL: '',
  VITE_CDN_BASE: '',
  VITE_STUN_URL: 'stun:stun.l.google.com:19302',
  VITE_STUN_URL_FALLBACK: 'stun:global.stun.twilio.com:3478',
  VITE_TURN_URL: '',
  VITE_TURN_USERNAME: '',
  VITE_TURN_CREDENTIAL: '',
  VITE_PRIMARY_ADMIN_EMAIL: '',
  VITE_VAPID_PUBLIC_KEY: '',
  VITE_ENABLE_DEV_LOGIN: 'false',
  VITE_SIGNAL_SERVER_SUPPORT: 'false',
  VITE_LOG_LEVEL: 'info',
};

const publicAssetPlugin = {
  name: 'public-asset-paths',
  setup(buildApi) {
    buildApi.onResolve({ filter: /^\// }, (args) => ({
      external: true,
      path: args.path,
    }));
  },
};

const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/main.jsx'],
  outdir: assetsDir,
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  sourcemap: false,
  minify: false,
  treeShaking: true,
  metafile: true,
  logLevel: 'info',
  legalComments: 'none',
  entryNames: '[name]-[hash]',
  chunkNames: 'chunks/[name]-[hash]',
  assetNames: 'media/[name]-[hash]',
  plugins: [publicAssetPlugin],
  define: {
    'import.meta.env': JSON.stringify(envObject),
    'process.env.NODE_ENV': '"production"',
    'process.env.REACT_APP_API_URL': '""',
    'process.env.REACT_APP_CLOUDINARY_URL': '""',
    'process.env.REACT_APP_CLOUDINARY_PRESET': '""',
  },
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
    '.ico': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.ttf': 'file',
    '.eot': 'file',
    '.mp4': 'file',
    '.webm': 'file',
    '.mp3': 'file',
    '.wav': 'file',
  },
});

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
};

copyDir(path.join(root, 'public'), distDir);

const outputs = result.metafile.outputs;
const jsEntry = Object.keys(outputs).find((file) => outputs[file].entryPoint === 'src/main.jsx' && file.endsWith('.js'));
const cssEntry = Object.keys(outputs).find((file) => outputs[file].entryPoint === 'src/main.jsx' && file.endsWith('.css'));

if (!jsEntry) throw new Error('Main JS entry was not generated.');

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<script type="module" src="\/src\/main\.jsx"><\/script>/, () => {
  const cssTag = cssEntry ? `    <link rel="stylesheet" href="/${path.relative(distDir, path.resolve(root, cssEntry)).replace(/\\/g, '/')}" />\n` : '';
  const jsTag = `    <script type="module" src="/${path.relative(distDir, path.resolve(root, jsEntry)).replace(/\\/g, '/')}\"></script>`;
  return `${cssTag}${jsTag}`;
});

fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');

console.log(JSON.stringify({ jsEntry, cssEntry }, null, 2));
