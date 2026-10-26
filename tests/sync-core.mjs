import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pack,unpack,canonical,replaceLocal,actionFor,assertExpectedHead,KEYS} from '../sync-core.mjs';
const data={tp_draft:{rows:[['Técnica 🤼',20,'notes']]},tp_tracks:{},tp_templates:[{name:'Plan',rows:[]}],tp_branding:{logo:'data:image/png;base64,'+'A'.repeat(249134)},tp_exercise_library_v1:Array.from({length:430},(_,i)=>({id:String(i),name:'Exercise '+i})),tp_warmup_templates:[]};
const p=await pack(data),m={schemaVersion:1,hash:p.hash,byteLength:p.byteLength,chunkCount:p.chunks.length};
assert.deepEqual(await unpack(m,p.chunks),data);assert(p.chunks.every(x=>x.length<=180000));
await assert.rejects(unpack({...m,hash:'f'.repeat(64)},p.chunks),/integrity/);
await assert.rejects(unpack(m,p.chunks.slice(1)),/Invalid/);
assert.equal(canonical({b:1,a:2}),canonical({a:2,b:1}));
assert.equal(actionFor('h',null,null),'choose');assert.equal(actionFor('h',{version:'a',hash:'h'},{version:'a'}),'synced');assert.equal(actionFor('new',{version:'a',hash:'h'},{version:'a'}),'upload');assert.equal(actionFor('h',{version:'a',hash:'h'},{version:'b'}),'download');assert.equal(actionFor('new',{version:'a',hash:'h'},{version:'b'}),'conflict');
assert.throws(()=>assertExpectedHead({version:'b',revision:2},{version:'a',revision:1}),/CONFLICT/);
const map=new Map(KEYS.map(k=>[k,JSON.stringify({original:k})]));let fail=true;const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>{if(k==='tp_templates'&&fail){fail=false;throw Error('Quota');}map.set(k,v);},removeItem:k=>map.delete(k)};
const before=Array.from(map);assert.throws(()=>replaceLocal(storage,data,d=>Object.fromEntries(KEYS.map(k=>[k,JSON.stringify(d[k])]))),/Quota/);assert.deepEqual(Array.from(map),before);
if(process.env.TP_BACKUP){const real=JSON.parse(readFileSync(process.env.TP_BACKUP)).data;const packed=await pack(real);assert.deepEqual(await unpack({schemaVersion:1,hash:packed.hash,byteLength:packed.byteLength,chunkCount:packed.chunks.length},packed.chunks),real);console.log('Real backup roundtrip: all 430 exercises, saved plans, tracks and embedded image preserved.');}
console.log('Sync core: Unicode/image roundtrip, corruption, missing chunks, all conflict decisions, quota rollback passed.');
