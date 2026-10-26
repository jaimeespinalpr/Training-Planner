import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
await build({entryPoints:['scripts/firebase-entry.mjs'],outfile:'vendor/firebase.js',bundle:true,format:'esm',platform:'browser',target:['es2020'],minify:true,legalComments:'linked'});

for(const file of ['vendor/firebase.js','vendor/firebase.js.LEGAL.txt']){const source=await readFile(file,'utf8');await writeFile(file,source.replace(/[ \t]+$/gm,''));}
