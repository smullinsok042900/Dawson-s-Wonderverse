// Bundles src/main.js (+ Three.js) into ONE self-contained, offline index.html.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const out = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', write: false, target: ['safari15', 'chrome100'], legalComments: 'none', loader: { '.glb': 'binary', '.jpg': 'dataurl', '.exr': 'binary' } });
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = readFileSync('src/index.template.html', 'utf8').replace('/*__CSS__*/', readFileSync('src/style.css', 'utf8')).replace('/*__JS__*/', () => js);
writeFileSync('index.html', html);
console.log(`index.html written: ${(html.length / 1024).toFixed(0)} KB`);
