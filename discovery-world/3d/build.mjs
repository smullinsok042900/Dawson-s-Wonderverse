// Bundles src/main.js (+ Three.js) into ONE self-contained, offline index.html.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const out = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', write: false, target: ['safari15', 'chrome100'], legalComments: 'none', loader: { '.glb': 'binary', '.jpg': 'dataurl', '.exr': 'binary' } });
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = readFileSync('src/index.template.html', 'utf8').replace('/*__CSS__*/', readFileSync('src/style.css', 'utf8')).replace('/*__JS__*/', () => js);
writeFileSync('index.html', html);
// (build 51b) a tiny file that says which build is published: the running game compares it with itself when it is
// opened or brought back to the front, and reloads if a newer build is out (the Home Screen app used to keep an old one).
const buildNo = (readFileSync('src/main.js', 'utf8').match(/const GAME_BUILD = '([^']+)'/) || [])[1] || '0';
writeFileSync('version.json', JSON.stringify({ build: buildNo }) + '\n');
console.log(`index.html written: ${(html.length / 1024).toFixed(0)} KB`);
