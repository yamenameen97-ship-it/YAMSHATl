import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const files = [
  'src/pages/Search.jsx',
  'src/pages/Inbox.jsx',
  'src/pages/Live.jsx',
  'src/components/feed/PostComposer.jsx',
  'src/components/ui/BottomNav.jsx',
  'src/main.jsx',
];

for (const file of files) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  await transform(source, {
    loader: file.endsWith('.jsx') ? 'jsx' : 'js',
    jsx: 'automatic',
    format: 'esm',
    target: 'es2020',
    sourcemap: false,
  });
  console.log(`OK ${file}`);
}
