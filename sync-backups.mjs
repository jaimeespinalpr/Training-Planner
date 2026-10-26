function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open('training-planner-recovery',1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function backupLocal(data,reason){
 const db=await open();try{await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put({id:crypto.randomUUID(),createdAt:new Date().toISOString(),reason,data});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Recovery backup could not be saved.'));});}finally{db.close();}
}
export async function listBackups(){const db=await open();try{return await new Promise((resolve,reject)=>{const r=db.transaction('snapshots').objectStore('snapshots').getAll();r.onsuccess=()=>resolve(r.result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));r.onerror=()=>reject(r.error);});}finally{db.close();}}
export function download(data,name='training-planner-backup.json'){
 const blob=new Blob([JSON.stringify({format:'training-planner-backup',version:1,createdAt:new Date().toISOString(),data},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
