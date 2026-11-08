import {initializeApp} from './vendor/firebase.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut,connectAuthEmulator} from './vendor/firebase.js';
import {getFirestore,connectFirestoreEmulator,collection,doc,getDocsFromServer,writeBatch,serverTimestamp} from './vendor/firebase.js';
import {KEYS,readLocal,canonical,digest,replaceLocal,actionFor} from './sync-core.mjs';
import {backupLocal,listBackups,download} from './sync-backups.mjs';
import {cloudStore} from './firebase-store.mjs';
const $=id=>document.getElementById(id),META='tp_cloud_link_v1';
let user=null,store=null,db=null,busy=false,paused=false,stale=false,head=null,base=null,timer,epoch=0,sharedBusy=false,sharedQueued=false,sharedSyncTimer=null;
const status=text=>{$('syncStatus').textContent=text;$('syncSummary').textContent=text;};
const local=()=>{const data=readLocal(localStorage);TP.validateBackup(data);return data;};
const SHARED_EXERCISES_PATH=['shared_app','training_planner_exercises','items'];
const exerciseTracks=new Set(['wrestling','lifting','mental']);
function sharedLibraryStatus(message){
 const el=$('sharedLibraryStatus');if(el)el.textContent=message;
}
function readExerciseList(key){
 try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return [];}
}
function cleanExercise(raw){
 if(!raw||typeof raw!=='object')return null;
 const id=String(raw.id||'').trim(),track=String(raw.track||'').trim();
 const category=String(raw.category||'').trim(),name=String(raw.name||'').trim();
 const minutes=Number(raw.minutes),notes=String(raw.notes||'');
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id)||!exerciseTracks.has(track)||!category||category.length>140||!name||name.length>180||!Number.isFinite(minutes)||minutes<0||minutes>1440||notes.length>5000)return null;
 return {id,track,category,name,minutes,notes,updatedAt:Number(raw.updatedAt)||0,pendingShared:Boolean(raw.pendingShared),shared:Boolean(raw.shared)};
}
function sharedPayload(item){
 return {id:item.id,track:item.track,category:item.category,name:item.name,minutes:item.minutes,notes:item.notes};
}
function sameExercise(a,b){
 return a&&b&&a.track===b.track&&a.category===b.category&&a.name===b.name&&a.minutes===b.minutes&&a.notes===b.notes;
}
function sharedCache(){
 const value=readExerciseList('tp_shared_exercise_library_v1');
 return value.map(cleanExercise).filter(Boolean).map(item=>({...item,shared:true}));
}
function writeSharedCache(items){
 const key='tp_shared_exercise_library_v1',next=JSON.stringify(items);
 if(localStorage.getItem(key)!==next){
  localStorage.setItem(key,next);
  window.dispatchEvent(new Event('tp-shared-exercises-changed'));
 }
}
function remoteTimestamp(value){
 if(value&&typeof value.toMillis==='function')return value.toMillis();
 if(value instanceof Date)return value.getTime();
 return Number(value)||0;
}
function clearPendingExercises(ids){
 for(const key of ['tp_exercise_library_v1','tp_shared_exercise_library_v1']){
  const items=readExerciseList(key);
  let changed=false;
  const next=items.map(raw=>{
   if(!ids.has(String(raw?.id||''))||!raw?.pendingShared)return raw;
   changed=true;return {...raw,pendingShared:false,shared:true,updatedAt:Date.now()};
  });
  if(changed){
   localStorage.setItem(key,JSON.stringify(next));
   if(key==='tp_shared_exercise_library_v1')window.dispatchEvent(new Event('tp-shared-exercises-changed'));
  }
 }
}
async function syncSharedExerciseLibrary(){
 if(!user||!db)return;
 if(sharedBusy){sharedQueued=true;return;}
 sharedBusy=true;
 try{
  const snapshot=await getDocsFromServer(collection(db,...SHARED_EXERCISES_PATH));
  const remote=new Map();
  snapshot.docs.forEach(document=>{
   const item=cleanExercise({...document.data(),id:document.id});
   if(item)remote.set(item.id,{...item,shared:true,pendingShared:false,updatedAt:remoteTimestamp(document.data().updatedAt)});
  });
  const previous=sharedCache();
  for(const item of previous)if(item.pendingShared)remote.set(item.id,item);
  writeSharedCache([...remote.values()]);

  const pending=new Map();
  const candidates=[...readExerciseList('tp_exercise_library_v1'),...sharedCache()];
  for(const item of candidates){
   const valid=cleanExercise(item);if(!valid)continue;
   const cloud=remote.get(valid.id);
   const isBuiltin=window.TP?.isBuiltInExercise?.(item)===true;
   const needsUpload=Boolean(item.pendingShared)||(!isBuiltin&&(!cloud||(!sameExercise(valid,cloud)&&valid.updatedAt>cloud.updatedAt)));
   if(!needsUpload)continue;
   const current=pending.get(valid.id);
   if(!current||valid.updatedAt>=current.updatedAt)pending.set(valid.id,valid);
  }
  const entries=[...pending.values()];
  for(let offset=0;offset<entries.length;offset+=400){
   const batch=writeBatch(db);
   entries.slice(offset,offset+400).forEach(item=>{
    batch.set(doc(db,...SHARED_EXERCISES_PATH,item.id),{...sharedPayload(item),updatedAt:serverTimestamp()});
   });
   await batch.commit();
  }
  if(entries.length){
   const merged=new Map(sharedCache().map(item=>[item.id,item]));
   for(const item of entries)merged.set(item.id,{...item,pendingShared:false,shared:true,updatedAt:Date.now()});
   writeSharedCache([...merged.values()]);
   clearPendingExercises(new Set(entries.map(item=>item.id)));
  }
  sharedLibraryStatus('Shared exercise library is up to date for signed-in accounts.');
 }catch(error){
  console.warn('Shared exercise library sync failed',error);
  sharedLibraryStatus(error?.code==='permission-denied'
   ?'Could not access the shared library. Your exercises are still saved on this device.'
   :'Shared library is temporarily unavailable. Your exercises are still saved on this device.');
 }finally{
  sharedBusy=false;
  if(sharedQueued){sharedQueued=false;setTimeout(syncSharedExerciseLibrary,0);}
 }
}

function readBase(){try{const value=JSON.parse(localStorage.getItem(META));return value?.uid===user?.uid?value:null;}catch{return null;}}
function setBase(value){base={...value,uid:user.uid};localStorage.setItem(META,JSON.stringify(base));}
function controls(){
 $('syncSignIn').hidden=!!user;$('syncSignOut').hidden=!user;$('syncAccount').textContent=user?`Signed in as ${user.email||user.displayName}`:'Sign in to sync your plans, exercises, and logo across devices.';
 for(const id of ['syncUpload','syncDownload','syncCheck','cloudHistory'])$(id).disabled=!user||busy||stale;
 $('syncSignOut').disabled=busy;$('syncSignIn').disabled=busy;
}
function failure(error){
 const code=error.code||'';
 if(error.message==='CONFLICT'){paused=true;status('Both devices changed. Choose which copy to use below. Earlier cloud versions remain available.');}
 else if(code==='auth/popup-closed-by-user')status('Sign-in canceled. Your plans remain on this device.');
 else if(code==='auth/popup-blocked')status('Allow pop-ups for this site, then sign in again.');
 else if(code==='auth/unauthorized-domain')status('This website is not authorized for sign-in. Contact the app owner.');
 else if(code==='permission-denied')status('Cloud access was denied. Your device data is unchanged.');
 else status(`Sync paused: ${error.message||'connection unavailable'}. Your data remains on this device.`);
}
async function locked(fn){
 if(busy)return;busy=true;controls();
 try{if(navigator.locks)await navigator.locks.request('training-planner-cloud-sync',fn);else await fn();}catch(e){failure(e);}finally{busy=false;controls();}
}
async function upload(expected,token){
 const data=local();await backupLocal(data,'before-cloud-upload');
 if(token!==epoch)throw Error('Account changed. Retry with the current account.');
 status('Saving a recoverable cloud version…');const next=await store.write(data,expected);
 if(token!==epoch)return;
 // Store the hash of the uploaded snapshot, not newer local edits made in flight.
 setBase(next);head=next;paused=false;status('Synced · your plans, exercises, and logo are saved in your account.');
}
async function check(){
 if(!user||paused||stale)return;
 await locked(async()=>{
  const token=epoch;head=await store.head();if(token!==epoch)return;
  base=readBase();const hash=await digest(canonical(local())),action=actionFor(hash,base,head);
  if(action==='upload')await upload(head,token);
  else if(action==='synced')status('Synced · your plans, exercises, and logo are saved in your account.');
  else if(action==='download'){paused=true;status('A newer cloud copy is ready. Choose “Load cloud copy” to open it.');}
  else if(action==='conflict'){paused=true;status('Both this device and the cloud changed. Choose a copy below; backups preserve the other version.');}
  else status(head?'Cloud data found. Choose “Load cloud copy” or save this device as the new cloud copy.':'Ready. Choose “Start sync with this device” to upload your existing data.');
 });
}
async function loadVersion(version,expectedHead){
 const token=epoch,before=canonical(local()),data=await store.read(version);TP.validateBackup(data);
 if(token!==epoch||canonical(local())!==before)throw Error('Your device changed while downloading. Retry to keep the latest edits safe.');
 await backupLocal(local(),'before-cloud-restore');
 if(token!==epoch||canonical(local())!==before)throw Error('Your device changed while backing up. Retry.');
 const hash=await digest(canonical(data));
 if(canonical(local())!==before)throw Error('Your device changed. Retry.');
 replaceLocal(localStorage,data,TP.validateBackup);
 // A historical restore stays paused until explicitly uploaded; never changes cloud head.
 try {
  if(version===expectedHead?.version)setBase({...expectedHead,hash});
  else {localStorage.removeItem(META);base=null;}
 } catch {localStorage.removeItem(META);base=null;} // Reload even if metadata storage is full.
 status('Cloud copy loaded. Reloading…');location.reload();
}
$('cloudBtn').onclick=()=>{$('syncDialog').showModal();if(!paused)check();};
$('syncClose').onclick=()=>$('syncDialog').close();
$('syncUpload').onclick=()=>locked(async()=>{
 const token=epoch;head=await store.head();if(token!==epoch)return;
 if(!confirm(head?'Use this device as your current cloud copy? The previous cloud version will remain in Cloud history.':'Start sync with the plans, exercises, and images currently on this device?'))return;
 await upload(head,token);
});
$('syncDownload').onclick=()=>locked(async()=>{
 head=await store.head();if(!head){status('No cloud copy exists yet. Start sync from the device with your saved plans.');return;}
 if(!confirm('Load the cloud copy on this device? Your current device data will be saved in Recovery backups first.'))return;
 await loadVersion(head.version,head);
});
$('syncCheck').onclick=()=>{paused=false;check();};
$('cloudHistory').onclick=()=>locked(async()=>{
 const versions=await store.versions(),list=$('syncHistory');list.replaceChildren();
 for(const v of versions){const row=document.createElement('p'),button=document.createElement('button');button.type='button';button.className='button ghost';button.textContent=`Download ${v.createdAt?.toDate().toLocaleString()||v.id}`;button.onclick=()=>locked(async()=>download(await store.read(v.id),`training-planner-cloud-${v.id}.json`));row.append(button);list.append(row);}
 if(!versions.length)list.textContent='No cloud versions yet.';
});
$('localHistory').onclick=async()=>{
 try{const backups=await listBackups(),list=$('syncHistory');list.replaceChildren();
 for(const v of backups){const row=document.createElement('p'),button=document.createElement('button');button.type='button';button.className='button ghost';button.textContent=`Download ${new Date(v.createdAt).toLocaleString()} · ${v.reason}`;button.onclick=()=>download(v.data,`training-planner-recovery-${v.id}.json`);row.append(button);list.append(row);}
 if(!backups.length)list.textContent='Recovery backups appear before cloud uploads and restores.';
 }catch(e){failure(e);}
};
window.PlannerSync={backupLocal:reason=>backupLocal(local(),reason),pause:()=>{paused=true;clearTimeout(timer);},syncSharedExercises:syncSharedExerciseLibrary};
try{
 if(window.FIREBASE_CONFIG?.projectId!=='wrestling-app-dev')throw Error('Firebase configuration is missing.');
 const testing=['localhost','127.0.0.1'].includes(location.hostname)&&window.TP_EMULATORS;
 const app=initializeApp(testing?{...window.FIREBASE_CONFIG,projectId:'demo-training-planner',apiKey:'demo-key'}:window.FIREBASE_CONFIG),auth=getAuth(app);db=getFirestore(app);
 // Emulator configuration can only be enabled on loopback hosts.
 if(testing){connectAuthEmulator(auth,'http://127.0.0.1:9098',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8088);}
 $('syncSignIn').onclick=()=>locked(async()=>{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider);setTimeout(check,150);});
 $('syncSignOut').onclick=()=>locked(async()=>{paused=true;clearTimeout(timer);localStorage.removeItem(META);await signOut(auth);});
 onAuthStateChanged(auth,current=>{epoch++;user=current;store=user?cloudStore(db,user.uid):null;base=readBase();paused=false;head=null;$('syncHistory').replaceChildren();controls();status(user?'Checking cloud data…':'Saved on this device · sign in to enable cloud sync');sharedLibraryStatus(user?'Loading the shared exercise library…':'Sign in with Google to load and share exercises across accounts.');if(user){setTimeout(check,100);setTimeout(syncSharedExerciseLibrary,250);}});
 window.addEventListener('tp-data-changed',()=>{clearTimeout(timer);timer=setTimeout(check,5000);});
 window.addEventListener('tp-exercise-library-changed',()=>{clearTimeout(sharedSyncTimer);sharedSyncTimer=setTimeout(syncSharedExerciseLibrary,700);});
 window.addEventListener('tp-exercise-library-opened',syncSharedExerciseLibrary);
 window.addEventListener('focus',()=>{if(!document.hidden)syncSharedExerciseLibrary();});
 window.addEventListener('online',()=>{check();syncSharedExerciseLibrary();});
 window.addEventListener('storage',e=>{if(KEYS.includes(e.key)||e.key===META){paused=true;stale=true;epoch++;controls();status('Planner data changed in another tab. Reload this tab before syncing.');}if(e.key==='tp_shared_exercise_library_v1')window.dispatchEvent(new Event('tp-shared-exercises-changed'));});
 setInterval(()=>{if(!document.hidden){check();if($('libraryDialog')?.open)syncSharedExerciseLibrary();}},30000);
}catch(e){failure(e);$('syncSignIn').disabled=true;}
