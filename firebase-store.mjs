import {doc,collection,getDocFromServer,getDocsFromServer,query,orderBy,limit,writeBatch,runTransaction,serverTimestamp} from './vendor/firebase.js';
import {pack,unpack,assertExpectedHead} from './sync-core.mjs';
export function cloudStore(db,uid){
 const root=['trainingPlanner',uid],headRef=doc(db,...root,'state','head');
 return {
  async head(){const s=await getDocFromServer(headRef);return s.exists()?s.data():null;},
  async versions(){const s=await getDocsFromServer(query(collection(db,...root,'versions'),orderBy('createdAt','desc'),limit(20)));return s.docs.map(d=>({id:d.id,...d.data()}));},
  async read(version){
   const ref=doc(db,...root,'versions',version),m=await getDocFromServer(ref);if(!m.exists())throw Error('Cloud backup not found.');
   const meta=m.data();if(!Number.isInteger(meta.chunkCount)||meta.chunkCount<1||meta.chunkCount>160)throw Error('Invalid cloud backup.');
   const chunks=await Promise.all(Array.from({length:meta.chunkCount},async(_,i)=>{const s=await getDocFromServer(doc(ref,'chunks',String(i)));if(!s.exists()||s.data().index!==i)throw Error('Cloud backup is incomplete.');return s.data().text;}));
   return unpack(meta,chunks);
  },
  async write(data,expected){
   const packed=await pack(data),version=crypto.randomUUID(),ref=doc(db,...root,'versions',version);
   // Staging never modifies the current cloud version. Failed writes leave it intact.
   for(let offset=0;offset<packed.chunks.length;offset+=20){const b=writeBatch(db);packed.chunks.slice(offset,offset+20).forEach((text,i)=>b.set(doc(ref,'chunks',String(offset+i)),{index:offset+i,text}));await b.commit();}
   const b=writeBatch(db);b.set(ref,{schemaVersion:1,hash:packed.hash,byteLength:packed.byteLength,chunkCount:packed.chunks.length,createdAt:serverTimestamp()});await b.commit();
   const next={version,revision:(expected?.revision??0)+1};
   await runTransaction(db,async tx=>{const s=await tx.get(headRef);assertExpectedHead(s.exists()?s.data():null,expected);tx.set(headRef,{...next,updatedAt:serverTimestamp()});});
   return {...next,hash:packed.hash};
  }
 };
}
