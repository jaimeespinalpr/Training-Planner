const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=process.env.TP_ARTIFACTS||'/tmp/training-planner-review';fs.mkdirSync(out,{recursive:true});
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/pages.yml'),'utf8');assert.match(workflow,/cp index\.html app\.js sections\.js pdf-export\.js styles\.css document-ui\.css mobile\.css _site\//,'deployment must publish the responsive stylesheet');
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf'};
 const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://localhost').pathname.replace(/^\//,'')||'index.html');try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-renderer-accessibility']});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],failures=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
 await page.goto(process.env.TP_URL||`http://127.0.0.1:${server.address().port}/`);
 await page.screenshot({path:path.join(out,'mobile-viewport.png')});
 assert.equal(await page.locator('#sectionJump button').count(),await page.locator('.exercise-section').count());
 assert.equal(await page.locator('.exercise-section.is-empty').count(),3);
 assert.equal(await page.locator('.warmup-controls').evaluate(e=>e.tagName),'DETAILS');
 assert.equal(await page.locator('.warmup-controls').evaluate(e=>e.open),false,'warm-up editor starts collapsed on mobile');
 assert.equal(await page.locator('#planName').evaluate(e=>getComputedStyle(e).fontSize),'16px');
 assert.equal(await page.locator('#mobileActionBar').isVisible(),true);
 assert.equal(await page.locator('#saveBtn').isVisible(),false);
 const headerActionsOverlap=await page.evaluate(()=>{const a=document.querySelector('#savedState').getBoundingClientRect(),b=document.querySelector('#newBtn').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});assert.equal(headerActionsOverlap,false,'saved status and new-plan button must not overlap');
 assert.match(await page.locator('#savedState').innerText(),/Draft saved/i);
 await page.locator('#sectionJump button').nth(2).click();await page.waitForFunction(()=>Math.abs(document.querySelectorAll('.exercise-section')[2].getBoundingClientRect().top)<160);
 await page.locator('.exercise-section').first().locator('[data-add-exercise]').click();
 assert.equal(await page.locator('.exercise-section').first().evaluate(e=>e.classList.contains('is-empty')),false);
 await page.reload();
 assert.match(await page.locator('#planWarnings').innerText(),/needs? a name and a positive time/i);
  await page.locator('#mobileAddSection').click();assert.equal(await page.locator('#libraryDialog').evaluate(e=>e.open),true);assert.equal(await page.locator('#libraryCategory').count(),0,'the category dropdown must not be shown');await page.locator('#librarySearch').fill('Light jog');assert.equal(await page.locator('.library-item').count(),2);assert.match(await page.locator('.library-item').nth(0).innerText(),/Warm-up|Cool Down/i);await page.locator('#closeLibrary').click();
  await page.locator('#backupBtn').click();
 const backupDownload=page.waitForEvent('download');await page.locator('#exportBackup').click();
 const backupPath=path.join(out,'planner-backup.json');await(await backupDownload).saveAs(backupPath);
 const backup=JSON.parse(fs.readFileSync(backupPath,'utf8'));assert.equal(backup.format,'training-planner-backup');assert.equal(backup.version,1);assert(backup.data.tp_draft);assert(backup.data.tp_branding);assert(Array.isArray(backup.data.tp_warmup_templates));
 await page.locator('#planName').fill('Changed after backup');page.once('dialog',d=>d.accept());await page.locator('#importBackup').setInputFiles(backupPath);await page.waitForFunction(()=>document.querySelector('#planName')?.value==='Competition Prep');assert.match(await page.locator('#savedState').innerText(),/Draft saved/i);
 await page.locator('#backupBtn').click();const malformedBackup=JSON.parse(fs.readFileSync(backupPath,'utf8'));malformedBackup.data.tp_draft.rows=[null];const malformedPath=path.join(out,'malformed-backup.json');fs.writeFileSync(malformedPath,JSON.stringify(malformedBackup));await page.locator('#importBackup').setInputFiles(malformedPath);await page.waitForFunction(()=>/invalid plan rows/i.test(document.querySelector('#backupStatus').textContent));assert.match(await page.locator('#backupStatus').innerText(),/invalid plan rows/i);assert.equal(await page.locator('#planName').inputValue(),'Competition Prep');await page.locator('#closeBackup').click();
 const pdfLayout=await page.evaluate(()=>PlannerPDF.layout);
 assert.deepEqual(pdfLayout,{
   style:'daily-schedule',
   logo:{placement:'centered',maxWidth:132,maxHeight:92},
   watermark:{placement:'center',maxWidth:360,maxHeight:300,opacity:0.1},
   schedule:{rounded:true,labels:{title:'Daily Schedule',date:'Date',total:'Total Time'},columns:['ACTIVITY','TIME']},
   footer:{alignment:'right'}
 });
 const watermarkPdfSize=await page.evaluate(()=>Promise.race([
   PlannerPDF.build({name:'Watermark check',date:'2026-09-16',minutes:5,warmupMinutes:0,categories:['Test'],rows:[['Visible activity',5,'Visible notes','Test']]},{club:'Young Guns Nashville',coach:'Coach',season:'Season',footer:'',color:'#982b2e',textColor:'#1a1a1a',pageSize:'letter',visualSize:'compact',categoryColors:{},logo:window.YOUNG_GUNS_LOGO},'Wrestling practice').then(file=>file.size),
   new Promise((_,reject)=>setTimeout(()=>reject(new Error('Official watermark export timed out')),5000))
 ]));
 assert(watermarkPdfSize>1000);
 await page.locator('#customizeBtn').click();
 await page.locator('#custom-club').fill('Young Guns Nashville');await page.locator('#custom-coach').fill('Jaime Espinal');await page.locator('#custom-season').fill('2026–2027');await page.locator('#custom-footer').fill('Disciplina, técnica y corazón');
 await page.locator('#logoFile').setInputFiles(path.join(__dirname,'fixtures/club-logo.png'));
 await page.waitForFunction(()=>document.querySelector('#logoPreview').src.startsWith('data:')&&!document.querySelector('#saveCustom').disabled);
 await page.locator('#saveCustom').click();await page.reload();assert.equal(await page.locator('#brandLogo').isVisible(),true);
 await page.locator('#planName').fill('Entrenamiento del día');await page.locator('#planDate').fill('2026-09-16');await page.locator('[data-i="0"][data-k="2"]').evaluate((e,value)=>{e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));},'Movilidad, coordinación y entrada a piernas.');
 await page.locator('#mobileSavePlan').click();await page.reload();assert.equal(await page.locator('#planName').inputValue(),'Entrenamiento del día');
 assert.match(await page.locator('#savedState').innerText(),/Draft saved/i);
 await page.locator('[data-load="0"]').click();
 const existingName=await page.locator('#planName').inputValue();
 await page.locator('[data-duplicate="0"]').click();
 assert.match(await page.locator('#planName').inputValue(),new RegExp(`${existingName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}.*copy`,'i'));
 await page.locator('[data-track="lifting"]').click();await page.locator('[data-track="wrestling"]').click();assert.equal(await page.locator('#planName').inputValue(),'Entrenamiento del día (Copy)');
 for(const w of [320,390,768,1280]){await page.setViewportSize({width:w,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${w}`);if(w>650)assert.equal(await page.locator('#mobileActionBar').isVisible(),false);}
 await page.setViewportSize({width:390,height:844});await page.locator('#customizeBtn').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'mobile-actions-viewport.png')});await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(300);const bottomClearance=await page.evaluate(()=>document.querySelector('.bottom-grid').getBoundingClientRect().bottom<document.querySelector('#mobileActionBar').getBoundingClientRect().top);assert.equal(bottomClearance,true,'mobile action bar must not cover the final page content');await page.screenshot({path:path.join(out,'mobile-bottom-viewport.png')});await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
 page.once('dialog',d=>{assert.match(d.message(),/missing a name or positive time/i);d.accept();});await page.locator('#pdfBtn').click();await page.waitForFunction(()=>!document.querySelector('#downloadPdf').disabled);
 assert.equal(await page.locator('#pdfPreviewFrame').isVisible(),true,'the PDF preview must be visible inside the app dialog');await page.waitForTimeout(1500);await page.screenshot({path:path.join(out,'pdf-preview-mobile.png')});const inlinePreview=await page.locator('#pdfPreviewFrame').getAttribute('src');assert.match(inlinePreview,/^blob:/);assert.equal(await page.locator('#pdfPreviewLink').getAttribute('href'),inlinePreview.split('#')[0]);const previewPopupPromise=page.waitForEvent('popup');await page.locator('#pdfPreviewLink').click();const previewPopup=await previewPopupPromise;await previewPopup.waitForURL(url=>String(url).startsWith('blob:'),{timeout:10000});assert.match(previewPopup.url(),/^blob:/);await previewPopup.close();
  const download=page.waitForEvent('download');await page.locator('#downloadPdf').click();await (await download).saveAs(path.join(out,'daily.pdf'));
 await page.evaluate(()=>{Object.defineProperty(navigator,'canShare',{configurable:true,value:d=>d.files[0].type==='application/pdf'});Object.defineProperty(navigator,'share',{configurable:true,value:async d=>{window.shared={name:d.files[0].name,type:d.files[0].type,size:d.files[0].size,hasUrl:'url'in d};}});});
 await page.locator('#nativeShare').click();const shared=await page.evaluate(()=>window.shared);assert.equal(shared.type,'application/pdf');assert.equal(shared.hasUrl,false);assert(shared.size>1000);
 await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));const fallback=page.waitForEvent('download');await page.locator('#nativeShare').click();assert((await fallback).suggestedFilename().endsWith('.pdf'));
 const long=await page.evaluate(async()=>{const brand=JSON.parse(localStorage.getItem('tp_branding'));const p={name:'Long Training',date:'2026-09-16',minutes:90,rows:Array.from({length:60},(_,i)=>[`Actividad ${i+1}`,5,'Detalles de técnica y coordinación. '.repeat(8)])};const f=await PlannerPDF.build(p,brand,'Wrestling practice');return Array.from(new Uint8Array(await f.arrayBuffer()));});fs.writeFileSync(path.join(out,'multipage.pdf'),Buffer.from(long));
 await require('./sections.cjs')(page,out);
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 console.log(JSON.stringify({pass:true,mobileWidths:[320,390,768,1280],logoPersistence:true,planPersistence:true,pdfDownload:true,sharePayload:shared,shareFallback:true,errors,failures,artifacts:out},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
