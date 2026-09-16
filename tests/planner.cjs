const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=process.env.TP_ARTIFACTS||'/tmp/training-planner-review';fs.mkdirSync(out,{recursive:true});
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf'};
 const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://localhost').pathname.replace(/^\//,'')||'index.html');try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-renderer-accessibility']});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],failures=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
 await page.goto(process.env.TP_URL||`http://127.0.0.1:${server.address().port}/`);
 await page.locator('#customizeBtn').click();
 await page.locator('#custom-club').fill('United Wrestling Club');await page.locator('#custom-coach').fill('Jaime Espinal');await page.locator('#custom-season').fill('2026–2027');await page.locator('#custom-footer').fill('Disciplina, técnica y corazón');
 await page.locator('#logoFile').setInputFiles(path.join(__dirname,'fixtures/club-logo.png'));
 await page.waitForFunction(()=>document.querySelector('#logoPreview').src.startsWith('data:')&&!document.querySelector('#saveCustom').disabled);
 await page.locator('#saveCustom').click();await page.reload();assert.equal(await page.locator('#brandLogo').isVisible(),true);
 await page.locator('#planName').fill('Entrenamiento del día');await page.locator('#planDate').fill('2026-09-16');await page.locator('[data-i="0"][data-k="2"]').fill('Movilidad, coordinación y entrada a piernas.');
 await page.locator('#saveBtn').click();await page.reload();assert.equal(await page.locator('#planName').inputValue(),'Entrenamiento del día');
 await page.locator('[data-track="lifting"]').click();await page.locator('[data-track="wrestling"]').click();assert.equal(await page.locator('#planName').inputValue(),'Entrenamiento del día');
 for(const w of [320,390,768,1280]){await page.setViewportSize({width:w,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${w}`);}
 await page.setViewportSize({width:390,height:844});await page.locator('#customizeBtn').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
 await page.locator('#pdfBtn').click();await page.waitForFunction(()=>!document.querySelector('#downloadPdf').disabled);
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
