import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
const out = await build({ entryPoints: ['tools/viewer.js'], bundle: true, write: false, format: 'esm', logLevel: 'error' });
writeFileSync('tools/viewer.html', '<!doctype html><meta charset=utf-8><body><script type=module>' + out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script') + '</script>');
console.log('viewer built');
