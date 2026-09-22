const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async(page,out)=>{
 await page.locator('#closePdf').click();
 const section=name=>page.locator('.exercise-section').filter({has:page.locator('h3',{hasText:new RegExp('^'+name+'$')})});
 const add=async(cat,name,minutes,notes='')=>{
   await section(cat).locator('[data-add-exercise]').click();const row=section(cat).locator('.row').last();
   await row.locator('[data-k="0"]').fill(name);await row.locator('[data-k="1"]').fill(String(minutes));await row.locator('[data-k="2"]').fill(notes);
 };
 const lib=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tp_exercise_library_v1')));
 await add('Introduction','Objetivos del día',3,'Explicar la meta de la sesión.');
 await add('Introduction','Normas de seguridad',2,'Revisar parejas y material.');
 await add('Warm-up','Movilidad articular',5,'Tobillos, rodillas y hombros.');
 assert.equal(await section('Introduction').locator('.row').count(),2);
 assert.equal(await section('Introduction').locator('[data-section-total]').textContent(),'5 min');
 const migration=await page.evaluate(()=>{const old={track:'wrestling',name:'Plan anterior',date:'2026-09-15',minutes:17,rows:[['Mi actividad',17,'Mis notas']]};const next=PlannerSections.normalize(old);return {name:next.name,date:next.date,minutes:next.minutes,row:next.rows[0].slice(0,3),version:next.schemaVersion};});
 assert.deepEqual(migration,{name:'Plan anterior',date:'2026-09-15',minutes:17,row:['Mi actividad',17,'Mis notas'],version:2});
 let data=await lib();assert.equal(data.filter(x=>x.category==='Introduction').length,2);assert(data.some(x=>x.category==='Warm-up'&&x.name==='Movilidad articular'));
 // Typing must update one catalog entry, not create partial-name duplicates.
 const before=data.length;await section('Introduction').locator('[data-k="0"]').first().press('End');await section('Introduction').locator('[data-k="0"]').first().pressSequentially(' del equipo');assert.equal((await lib()).length,before);
 await page.reload();assert.equal(await section('Introduction').locator('.row').count(),2);
 assert.equal(await section('Introduction').locator('[data-k="0"]').first().inputValue(),'Objetivos del día del equipo');
 await section('Introduction').locator('[data-remove]').first().click();assert.equal(await section('Introduction').locator('.row').count(),1);assert.equal((await lib()).filter(x=>x.category==='Introduction').length,2);
 await section('Introduction').locator('[data-library]').click();assert.equal(await page.locator('#libraryCategory').inputValue(),'Introduction');assert.equal(await page.locator('.library-item').count(),2);
 await page.locator('#librarySearch').fill('objetivos');assert.equal(await page.locator('.library-item').count(),1);await page.locator('[data-insert-exercise]').click();await page.locator('#closeLibrary').click();assert.equal(await section('Introduction').locator('.row').count(),2);
 // Preserve a named custom section and its exercise across a fresh plan.
 await page.locator('#addRow').click();await page.locator('#sectionName').fill('Coordination');await page.locator('#sectionForm [type="submit"]').click();await add('Coordination','Escalera de agilidad',6,'Dos rondas.');
 await page.locator('#saveBtn').click();
 await page.locator('#pdfBtn').click();await page.waitForFunction(()=>!document.querySelector('#downloadPdf').disabled);const pdf=page.waitForEvent('download');await page.locator('#downloadPdf').click();await(await pdf).saveAs(path.join(out,'sections.pdf'));await page.locator('#closePdf').click();
 await page.locator('#newBtn').click();assert.equal(await page.locator('.row').count(),0);
 await page.locator('#openLibrary').click();await page.locator('#libraryCategory').selectOption('Coordination');assert.equal(await page.locator('.library-item').count(),1);await page.locator('[data-insert-exercise]').click();await page.locator('#closeLibrary').click();assert.equal(await section('Coordination').locator('.row').count(),1);
 // Removing catalog entry does not remove plan exercise, nor resurrect on reload.
 await section('Coordination').locator('[data-library]').click();page.once('dialog',d=>d.accept());await page.locator('[data-forget-exercise]').click();await page.locator('#closeLibrary').click();await page.reload();assert.equal(await section('Coordination').locator('.row').count(),1);assert(!(await lib()).some(x=>x.name==='Escalera de agilidad'));
 // Categories are scoped to training track.
 await page.locator('[data-track="lifting"]').click();await page.locator('#openLibrary').click();await page.locator('#libraryCategory').selectOption('Introduction');assert.equal(await page.locator('.library-item').count(),0);await page.locator('#closeLibrary').click();await page.locator('[data-track="wrestling"]').click();
 // Exercise/category deletion remains local to the plan.
 page.once('dialog',d=>d.accept());await section('Coordination').locator('[data-delete-section]').click();assert.equal(await section('Coordination').count(),0);
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`sections overflow ${width}`);}
 await page.setViewportSize({width:390,height:844});await page.locator('[data-load]').first().click();await section('Introduction').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'sections-mobile.png')});
 await section('Introduction').locator('[data-library]').click();await page.screenshot({path:path.join(out,'library-mobile.png')});await page.locator('#closeLibrary').click();
 console.log('PASS sections: multiple items, automatic categorized library, stable typing, reload, reuse, custom categories, independent deletion, track isolation, grouped PDF, responsive widths');
};
