// Versioned snapshots preserve JSON rows, library IDs, and embedded images exactly.
export const KEYS=['tp_draft','tp_tracks','tp_templates','tp_branding','tp_exercise_library_v1','tp_warmup_templates'];
export const MAX_BYTES=20*1024*1024;
export function readLocal(storage){
 const defaults={tp_tracks:{},tp_templates:[],tp_exercise_library_v1:[],tp_warmup_templates:[]};
 return Object.fromEntries(KEYS.map(key=>[key,JSON.parse(storage.getItem(key)||'null')??defaults[key]??null]));
}
export function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export async function digest(text){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');}
export async function pack(data){
 const text=canonical(data),bytes=new TextEncoder().encode(text);
 if(bytes.length>MAX_BYTES)throw Error('Your data exceeds the 20 MB sync limit. Download a backup; your device data is unchanged.');
 // Base64 avoids splitting Unicode surrogate pairs and bounds Firestore document sizes.
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 const encoded=btoa(binary),chunks=[];for(let i=0;i<encoded.length;i+=180000)chunks.push(encoded.slice(i,i+180000));
 return {hash:await digest(text),byteLength:bytes.length,chunks};
}
export async function unpack(manifest,chunks){
 if(manifest.schemaVersion!==1||!Number.isInteger(manifest.chunkCount)||manifest.chunkCount<1||manifest.chunkCount>160||chunks.length!==manifest.chunkCount||manifest.byteLength>MAX_BYTES)throw Error('Invalid cloud backup. Device data was not changed.');
 const binary=atob(chunks.join('')),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 if(bytes.length!==manifest.byteLength||await digest(text)!==manifest.hash)throw Error('Cloud backup failed its integrity check. Device data was not changed.');
 return JSON.parse(text);
}
export function replaceLocal(storage,data,validate){
 const values=validate(data),before=Object.fromEntries(KEYS.map(k=>[k,storage.getItem(k)]));
 try{for(const key of KEYS){if(values[key]===undefined)storage.removeItem(key);else storage.setItem(key,values[key]);}}
 catch(error){for(const [key,value]of Object.entries(before)){if(value===null)storage.removeItem(key);else storage.setItem(key,value);}throw error;}
}
export function actionFor(localHash,base,head){
 if(!base)return 'choose';
 const remoteVersion=head?.version??null;
 if(remoteVersion!==base.version)return localHash===base.hash?'download':'conflict';
 return localHash===base.hash?'synced':'upload';
}
export function assertExpectedHead(actual,expected){if((actual?.version??null)!==(expected?.version??null)||(actual?.revision??0)!==(expected?.revision??0))throw Error('CONFLICT');}
