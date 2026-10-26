import {initializeApp} from './vendor/firebase.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut,connectAuthEmulator} from './vendor/firebase.js';
import {getFirestore,connectFirestoreEmulator} from './vendor/firebase.js';
import {KEYS,readLocal,canonical,digest,replaceLocal,actionFor} from './sync-core.mjs';
import {backupLocal,listBackups,download} from './sync-backups.mjs';
import {cloudStore} from './firebase-store.mjs';
const $=id=>document.getElementById(id),META='tp_cloud_link_v1';
let user=null,store=null,busy=false,paused=false,stale=false,head=null,base=null,timer,epoch=0;
const status=text=>{$('syncStatus').textContent=text;$('syncSummary').textContent=text;};
const local=()=>{const data=readLocal(localStorage);TP.validateBackup(data);return data;};
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
window.PlannerSync={backupLocal:reason=>backupLocal(local(),reason),pause:()=>{paused=true;clearTimeout(timer);}};
try{
 if(window.FIREBASE_CONFIG?.projectId!=='wrestling-app-dev')throw Error('Firebase configuration is missing.');
 const testing=['localhost','127.0.0.1'].includes(location.hostname)&&window.TP_EMULATORS;
 const app=initializeApp(testing?{...window.FIREBASE_CONFIG,projectId:'demo-training-planner',apiKey:'demo-key'}:window.FIREBASE_CONFIG),auth=getAuth(app),db=getFirestore(app);
 // Emulator configuration can only be enabled on loopback hosts.
 if(testing){connectAuthEmulator(auth,'http://127.0.0.1:9098',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8088);}
 $('syncSignIn').onclick=()=>locked(async()=>{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider);setTimeout(check,150);});
 $('syncSignOut').onclick=()=>locked(async()=>{paused=true;clearTimeout(timer);localStorage.removeItem(META);await signOut(auth);});
 onAuthStateChanged(auth,current=>{epoch++;user=current;store=user?cloudStore(db,user.uid):null;base=readBase();paused=false;head=null;$('syncHistory').replaceChildren();controls();status(user?'Checking cloud data…':'Saved on this device · sign in to enable cloud sync');if(user)setTimeout(check,100);});
 window.addEventListener('tp-data-changed',()=>{clearTimeout(timer);timer=setTimeout(check,5000);});
 window.addEventListener('online',check);
 window.addEventListener('storage',e=>{if(KEYS.includes(e.key)||e.key===META){paused=true;stale=true;epoch++;controls();status('Planner data changed in another tab. Reload this tab before syncing.');}});
 setInterval(()=>{if(!document.hidden)check();},30000);
}catch(e){failure(e);$('syncSignIn').disabled=true;}
