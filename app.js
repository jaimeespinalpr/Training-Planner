(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const tracks = {
    wrestling:{title:'Wrestling practice',name:'Competition Prep',rows:[['Warm-up + movement',15],['Technique: single-leg chain',25],['Live goes: score first',30],['Cool down + review',20]]},
    lifting:{title:'Lifting & conditioning',name:'Strength Cycle',rows:[['Dynamic warm-up',10],['Lower-body strength',30],['Power + med ball',20],['Mobility / recovery',15]]},
    mental:{title:'Mind & focus session',name:'Competition Mindset',rows:[['Breathing reset',5],['Visualization: first score',10],['Decision game',20],['Journal + cue words',10]]}
  };
  const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const read = (key,fallback) => {try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}};
  const clone = x => JSON.parse(JSON.stringify(x));
  let toastTimer;
  const toast = msg => {clearTimeout(toastTimer);$('toast').textContent=msg;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4500);};
  const persist = (key,value) => {try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{toast('Could not save in this browser. Download the PDF to keep your plan.');return false;}};
  const fresh = track => ({track,name:tracks[track].name,date:today(),minutes:90,rows:clone(tracks[track].rows).map(r=>[...r,''])});
  const normalize = p => {const t=tracks[p?.track]?p.track:'wrestling';return PlannerSections.normalize({...fresh(t),...p,track:t,date:p?.date||today(),rows:Array.isArray(p?.rows)?p.rows:fresh(t).rows});};
  let state=normalize(read('tp_draft',fresh('wrestling')));
  let drafts=read('tp_tracks',{});
  let settings={club:'Young Guns Nashville',coach:'',season:'',footer:'',color:'#982b2e',textColor:'#1a1a1a',pageSize:'letter',visualSize:'standard',categoryColors:{},logo:window.YOUNG_GUNS_LOGO,...read('tp_branding',{})};
  if(settings.brandVersion!=='young-guns-nashville-1'){
    settings={...settings,club:'Young Guns Nashville',logo:window.YOUNG_GUNS_LOGO,brandVersion:'young-guns-nashville-1'};
    persist('tp_branding',settings);
  }
  let pendingLogo='';
  const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function render(){
    $('trackTitle').textContent=tracks[state.track].title;
    document.querySelectorAll('.track').forEach(b=>b.classList.toggle('active',b.dataset.track===state.track));
    $('planName').value=state.name;$('planDate').value=state.date;$('totalMinutes').value=state.minutes;
    sections.rememberAll();
    sections.renderRows();updateProgress();renderTemplates();renderBrand();
  }
  function renderBrand(){ $('brandClub').textContent=settings.club||'Training Planner';$('brandLogo').hidden=!settings.logo;if(settings.logo)$('brandLogo').src=settings.logo;document.body.dataset.visualSize=settings.visualSize||'standard';document.documentElement.style.setProperty('--document-color',settings.color||'#982b2e');document.documentElement.style.setProperty('--document-text-color',settings.textColor||'#1a1a1a'); }
  function updateProgress(){sections.updateSummary();const used=state.rows.reduce((n,r)=>n+Number(r[1]),0);$('timeLabel').textContent=`${used} / ${state.minutes} min`;$('timeBar').style.width=`${state.minutes?Math.min(100,used/state.minutes*100):0}%`;}
  function collect(){state.name=$('planName').value.trim()||'Daily Training';state.date=$('planDate').value||today();state.minutes=Math.max(0,Number($('totalMinutes').value)||0);return clone(state);}
  function cache(){collect();drafts[state.track]=clone(state);persist('tp_tracks',drafts);persist('tp_draft',state);$('savedState').textContent='Saved on this device';}
  function save(){collect();const list=read('tp_templates',[]);const next=[clone(state),...list.filter(x=>!(x.name===state.name&&x.track===state.track&&x.date===state.date))].slice(0,100);if(persist('tp_templates',next)){cache();renderTemplates();toast('Plan saved on this device');}}
  function renderTemplates(){const list=read('tp_templates',[]);$('templates').innerHTML=list.length?list.map((p,i)=>`<div class="template"><span>${escapeHtml(p.name)}<small>${escapeHtml(p.date||'')} · ${escapeHtml(p.track||'wrestling')}</small></span><button data-load="${i}">Open</button></div>`).join(''):'<p>Saved plans will appear here.</p>';}
  $('rows').addEventListener('input',e=>{if(e.target.dataset.i===undefined)return;const k=Number(e.target.dataset.k);state.rows[Number(e.target.dataset.i)][k]=k===1?Math.max(0,Number(e.target.value)||0):e.target.value;sections.remember(state.rows[Number(e.target.dataset.i)]);updateProgress();cache();});
  $('rows').addEventListener('click',e=>{if(e.target.dataset.remove!==undefined){state.rows.splice(Number(e.target.dataset.remove),1);cache();render();}});
  document.querySelectorAll('.track').forEach(b=>b.onclick=()=>{cache();state=normalize(drafts[b.dataset.track]||fresh(b.dataset.track));render();cache();});
  // Section controls are bound by PlannerSections.
  $('saveBtn').onclick=save;
  $('newBtn').onclick=()=>{state=normalize({...fresh(state.track),rows:[]});state.name='New training session';render();cache();};
  $('templates').onclick=e=>{if(e.target.dataset.load!==undefined){cache();state=normalize(read('tp_templates',[])[Number(e.target.dataset.load)]);render();cache();toast('Plan opened');}};
  ['planName','planDate','totalMinutes'].forEach(id=>$(id).addEventListener('input',()=>{cache();updateProgress();}));
  function logoPreview(){ $('logoPreview').hidden=!pendingLogo;if(pendingLogo)$('logoPreview').src=pendingLogo; }
  $('customizeBtn').onclick=()=>{for(const key of ['club','coach','season','footer','color'])$('custom-'+key).value=settings[key];pendingLogo=settings.logo;$('logoFile').value='';logoPreview();$('customDialog').showModal();};
  $('cancelCustom').onclick=()=>$('customDialog').close();
  $('removeLogo').onclick=()=>{pendingLogo='';$('logoFile').value='';logoPreview();};
  let logoJob=0;
  $('logoFile').onchange=async()=>{
    const file=$('logoFile').files[0];if(!file)return;
    const job=++logoJob;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024){toast('Choose a PNG, JPG, or WebP file up to 10 MB.');return;}
    $('saveCustom').disabled=true;
    const url=URL.createObjectURL(file);
    try{const img=new Image();img.src=url;await img.decode();const scale=Math.min(1,640/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);if(job===logoJob){pendingLogo=c.toDataURL('image/png');logoPreview();}}
    catch{toast('Could not open that image. Try a PNG or JPG.');}
    finally{URL.revokeObjectURL(url);$('saveCustom').disabled=false;}
  };
  $('customForm').onsubmit=e=>{e.preventDefault();const next={...settings,logo:pendingLogo};for(const key of ['club','coach','season','footer','color'])next[key]=$('custom-'+key).value.trim();if(persist('tp_branding',next)){settings=next;renderBrand();$('customDialog').close();toast('Customization saved');}};
  let templateDraft=null;
  function openTemplateEditor(){
    templateDraft={categories:[...state.categories],categoryColors:{...(settings.categoryColors||{})},color:settings.color||'#982b2e',textColor:settings.textColor||'#1a1a1a',pageSize:settings.pageSize||'letter',visualSize:settings.visualSize||'standard'};
    $('template-document-color').value=templateDraft.color;$('template-text-color').value=templateDraft.textColor;$('template-page-size').value=templateDraft.pageSize;$('template-visual-size').value=templateDraft.visualSize;
    renderTemplateEditor();
    $('templateDialog').showModal();
  }
  function renderTemplateEditor(){
    $('templateCategories').innerHTML=templateDraft.categories.map((category,i)=>`<div class="template-category" draggable="true" data-category-index="${i}" title="Drag to reorder"><span class="drag-handle" aria-hidden="true">⋮⋮</span><span>${escapeHtml(category)}</span><input type="color" value="${templateDraft.categoryColors[category]||templateDraft.color}" data-category-color aria-label="Color for ${escapeHtml(category)}"></div>`).join('');
  }
  $('editTemplateBtn').onclick=openTemplateEditor;
  $('cancelTemplate').onclick=()=>$('templateDialog').close();
  let draggedCategoryIndex=null;
  $('templateCategories').addEventListener('dragstart',e=>{const row=e.target.closest('.template-category');if(!row)return;draggedCategoryIndex=Number(row.dataset.categoryIndex);row.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(draggedCategoryIndex));});
  $('templateCategories').addEventListener('dragover',e=>{const row=e.target.closest('.template-category');if(!row||draggedCategoryIndex===null)return;e.preventDefault();document.querySelectorAll('.template-category').forEach(x=>x.classList.remove('drag-over'));row.classList.add('drag-over');e.dataTransfer.dropEffect='move';});
  $('templateCategories').addEventListener('drop',e=>{const row=e.target.closest('.template-category');if(!row||draggedCategoryIndex===null)return;e.preventDefault();const targetIndex=Number(row.dataset.categoryIndex);if(targetIndex!==draggedCategoryIndex){const moved=templateDraft.categories.splice(draggedCategoryIndex,1)[0];templateDraft.categories.splice(targetIndex,0,moved);}draggedCategoryIndex=null;renderTemplateEditor();});
  $('templateCategories').addEventListener('dragend',()=>{draggedCategoryIndex=null;document.querySelectorAll('.template-category').forEach(x=>x.classList.remove('dragging','drag-over'));});
  $('templateCategories').oninput=e=>{if(e.target.dataset.categoryColor!==undefined){const row=e.target.closest('[data-category-index]');templateDraft.categoryColors[templateDraft.categories[Number(row.dataset.categoryIndex)]]=e.target.value;}};
  $('templateForm').onsubmit=e=>{e.preventDefault();templateDraft.color=$('template-document-color').value;templateDraft.textColor=$('template-text-color').value;templateDraft.pageSize=$('template-page-size').value;templateDraft.visualSize=$('template-visual-size').value;state.categories=templateDraft.categories;settings={...settings,...templateDraft};if(persist('tp_branding',settings)){cache();render();$('templateDialog').close();toast('Template settings saved');}};
  let prepared=null,previewUrl=null;
  $('pdfBtn').onclick=() => openPdf(false);
  $('shareBtn').onclick=() => openPdf(true);
  async function openPdf(sharing){
    collect();cache();$('pdfDialog').showModal();$('pdfStatus').textContent='Preparing PDF…';$('downloadPdf').disabled=true;$('nativeShare').disabled=true;
    try{prepared=await window.PlannerPDF.build(clone(state),clone(settings),tracks[state.track].title);if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(prepared);$('pdfPreviewLink').href=previewUrl;$('pdfPreviewLink').hidden=false;$('pdfStatus').textContent=`${prepared.name} — Logo, date, activities, and footer included.`;$('downloadPdf').disabled=false;$('nativeShare').disabled=false;if(sharing)$('nativeShare').focus();}
    catch(err){prepared=null;$('pdfStatus').textContent='Could not generate the PDF. Reload the page and try again.';console.error(err);}
  }
  $('closePdf').onclick=()=>$('pdfDialog').close();
  function download(){if(!prepared)return;const a=document.createElement('a');a.href=previewUrl;a.download=prepared.name;document.body.append(a);a.click();a.remove();}
  $('downloadPdf').onclick=download;
  $('nativeShare').onclick=async()=>{
    if(!prepared)return;
    if(navigator.share&&navigator.canShare?.({files:[prepared]})){
      try{await navigator.share({files:[prepared],title:state.name});$('pdfStatus').textContent='PDF sent to the selected app.';}
      catch(e){if(e.name==='AbortError')return;$('pdfStatus').textContent='Your device could not share it. Use Download PDF.';}
    }else{download();$('pdfStatus').textContent='This browser cannot share files directly. Attach the downloaded PDF in your app.';}
  };
  const sections=PlannerSections.attach({getState:()=>state,cache,render,toast,read,persist,savePlan:save,getSettings:()=>settings});
  window.TP={save,tracks};sections.rememberAll();render();cache();
})();
