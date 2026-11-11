import { build } from 'esbuild';
await build({ entryPoints: ['tools/viewer.js'], bundle: true, outfile: 'tools/viewer.bundle.js', format: 'iife', logLevel: 'error' });
import { writeFileSync } from 'node:fs';
writeFileSync('tools/viewer.html', '<!doctype html><meta charset=utf-8><body><script src="viewer.bundle.js"></script>');
console.log('viewer built');
