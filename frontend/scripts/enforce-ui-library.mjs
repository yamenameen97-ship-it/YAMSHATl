import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const allowlist = JSON.parse(fs.readFileSync(path.join(__dirname, 'ui-library-allowlist.json'), 'utf8'));
const allowed = new Set(allowlist.allowed_component_files_outside_ui || []);
const componentsRoot = path.join(root, 'src', 'components');
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(fullPath); continue; }
    if (!/\.(jsx|tsx)$/.test(entry.name)) continue;
    const rel = path.relative(root, fullPath).replace(/\\/g, '/');
    if (rel.startsWith('src/components/ui/')) continue;
    if (!allowed.has(rel)) violations.push(rel);
  }
}

walk(componentsRoot);

if (violations.length) {
  console.error('⛔ UI Library guard: found new component files outside src/components/ui:');
  for (const item of violations) console.error(` - ${item}`);
  console.error('Move new UI pieces into src/components/ui or explicitly review the allowlist.');
  process.exit(1);
}

console.log(`✅ UI Library guard passed (${allowed.size} approved legacy component files outside ui).`);
