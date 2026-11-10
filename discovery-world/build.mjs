// Build: inlines src/style.css and src/js/*.js (in name order) into ONE self-contained index.html.
// Usage:  node build.mjs        (no dependencies, no network)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const css = readFileSync(join(src, 'style.css'), 'utf8');
const jsFiles = readdirSync(join(src, 'js')).filter(f => f.endsWith('.js')).sort();
const js = jsFiles.map(f => `// ---- ${f} ----\n` + readFileSync(join(src, 'js', f), 'utf8')).join('\n');
let html = readFileSync(join(src, 'index.template.html'), 'utf8');
html = html.replace('/*@@CSS@@*/', () => css).replace('/*@@JS@@*/', () => js);
writeFileSync(join(root, 'index.html'), html);
console.log(`index.html written: ${(html.length / 1024).toFixed(1)} KB from ${jsFiles.length} JS modules`);
