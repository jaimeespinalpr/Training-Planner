(() => {
  'use strict';
  const defaults={wrestling:['Introduction','Warm-up','Technique','Live wrestling','Cool-down'],lifting:['Introduction','Warm-up','Strength','Power','Cool-down'],mental:['Introduction','Breathing','Visualization','Decision-making','Reflection']};
  const legacy={wrestling:['Calentamiento','Técnica','Combate','Vuelta a la calma'],lifting:['Calentamiento','Fuerza','Potencia','Vuelta a la calma'],mental:['Respiración','Visualización','Toma de decisiones','Reflexión']};
  const categoryNames={'Introducción':'Introduction','Calentamiento':'Warm-up','Técnica':'Technique','Combate':'Live wrestling','Vuelta a la calma':'Cool-down','Fuerza':'Strength','Potencia':'Power','Respiración':'Breathing','Visualización':'Visualization','Toma de decisiones':'Decision-making','Reflexión':'Reflection','Otros':'Other'};
  const englishCategory=name=>categoryNames[name]||name;
  const key=s=>String(s).trim().normalize('NFKC').toLocaleLowerCase();
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function normalize(plan){
    const track=defaults[plan.track]?plan.track:'wrestling';
    const categories=Array.isArray(plan.categories)?plan.categories.filter(c=>typeof c==='string'&&c.trim()).map(englishCategory):[...defaults[track]];
    const rows=plan.rows.map((r,i)=>[String(r[0]||''),Math.max(0,Number(r[1])||0),String(r[2]||''),englishCategory(String(r[3]||legacy[track][i]||'Other')),String(r[4]||'')]);
    for(const r of rows)if(!categories.includes(r[3]))categories.push(r[3]);
    return {...plan,schemaVersion:2,categories:[...new Set(categories)],rows};
  }
  function attach({getState,cache,render,toast,read,persist}){
    const $=id=>document.getElementById(id);
    let library=read('tp_exercise_library_v1',[]);if(!Array.isArray(library))library=[];
    library=library.map(item=>({...item,category:englishCategory(item.category)}));
    function remember(row){
      const name=row[0].trim();if(!name)return;
      const state=getState(),same=library.find(x=>x.track===state.track&&key(x.category)===key(row[3])&&key(x.name)===key(name));
      const existing=library.find(x=>x.id===row[4]&&x.track===state.track&&x.category===row[3]);
      const id=same?.id||existing?.id||crypto.randomUUID();
      // Update one stable entry while typing; never store every partial keystroke.
      library=library.filter(x=>x.id!==id&&(!existing||x.id!==existing.id));
      library.push({id,track:state.track,category:row[3],name,minutes:row[1],notes:row[2]});
      if(persist('tp_exercise_library_v1',library))row[4]=id;
    }
    function rememberAll(){getState().rows.filter(r=>!r[4]).forEach(remember);}
    function renderRows(){
      const state=getState();
      $('rows').innerHTML=state.categories.map((category,c)=>{
        const items=state.rows.map((r,i)=>({r,i})).filter(x=>x.r[3]===category);
        const count=library.filter(x=>x.track===state.track&&key(x.category)===key(category)).length;
        return `<section class="exercise-section"><div class="section-heading"><h3>${esc(category)}</h3><span data-section-total="${c}">${items.reduce((n,x)=>n+x.r[1],0)} min</span><button type="button" data-delete-section="${c}" aria-label="Delete section ${esc(category)}">×</button></div>${items.map(({r,i})=>`<div class="row"><label>Exercise / point<input data-i="${i}" data-k="0" maxlength="180" value="${esc(r[0])}" placeholder="Exercise or point name"></label><label>Min<input type="number" min="0" max="1440" data-i="${i}" data-k="1" value="${r[1]}"></label><button type="button" class="remove" data-remove="${i}" aria-label="Remove exercise from session">×</button><label class="activity-notes">Details<textarea data-i="${i}" data-k="2" maxlength="5000" rows="2" placeholder="Repetitions, instructions, or coaching points…">${esc(r[2])}</textarea></label></div>`).join('')||'<p class="empty-section">Add coaching points or exercises to this section.</p>'}<div class="section-actions"><button type="button" data-add-exercise="${c}">+ Add exercise</button><button type="button" data-library="${c}">Library · ${count}</button></div></section>`;
      }).join('');
    }
    function updateSummary(){const state=getState();state.categories.forEach((category,c)=>{const total=$('rows').querySelector(`[data-section-total="${c}"]`);if(total)total.textContent=state.rows.filter(r=>r[3]===category).reduce((n,r)=>n+r[1],0)+' min';const button=$('rows').querySelector(`[data-library="${c}"]`);if(button)button.textContent='Library · '+library.filter(x=>x.track===state.track&&key(x.category)===key(category)).length;});}
    function add(category){const state=getState();state.rows.push(['',0,'',category,'']);cache();render();$('rows').querySelector(`[data-i="${state.rows.length-1}"][data-k="0"]`).focus();}
    $('rows').addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;const state=getState();
      if(b.dataset.addExercise!==undefined)add(state.categories[Number(b.dataset.addExercise)]);
      if(b.dataset.library!==undefined)openLibrary(state.categories[Number(b.dataset.library)]);
      if(b.dataset.deleteSection!==undefined){const category=state.categories[Number(b.dataset.deleteSection)];if(state.rows.some(r=>r[3]===category)&&!confirm('Remove this section and its exercises from the session? Your library will be kept.'))return;state.rows=state.rows.filter(r=>r[3]!==category);state.categories=state.categories.filter(c=>c!==category);cache();render();}
    });
    $('addRow').textContent='+ Add section';
    $('addRow').onclick=()=>{$('sectionName').value='';$('sectionDialog').showModal();$('sectionName').focus();};
    $('sectionForm').onsubmit=e=>{e.preventDefault();const name=$('sectionName').value.trim();if(!name)return;const state=getState();if(state.categories.some(c=>key(c)===key(name))){toast('This section already exists.');return;}state.categories.push(name);cache();render();$('sectionDialog').close();};
    $('cancelSection').onclick=()=>$('sectionDialog').close();
    function openLibrary(category){
      rememberAll();cache();const state=getState();
      const cats=[...new Set([...defaults[state.track],...state.categories,...library.filter(x=>x.track===state.track).map(x=>x.category)])];
      $('libraryCategory').innerHTML=cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');$('libraryCategory').value=category||cats[0];$('librarySearch').value='';renderLibrary();$('libraryDialog').showModal();
    }
    function renderLibrary(){const track=getState().track,category=$('libraryCategory').value,search=key($('librarySearch').value);const items=library.filter(x=>x.track===track&&key(x.category)===key(category)&&key(x.name+' '+x.notes).includes(search)).sort((a,b)=>a.name.localeCompare(b.name));
      $('libraryItems').innerHTML=items.length?items.map(x=>`<article class="library-item"><strong>${esc(x.name)}</strong><small>${x.minutes} min</small><p>${esc(x.notes)}</p><div class="section-actions"><button type="button" data-insert-exercise="${esc(x.id)}">Add to session</button><button type="button" data-forget-exercise="${esc(x.id)}">Remove from library</button></div></article>`).join(''):'<p>No exercises in this category yet. Exercises you add to a session will be saved here automatically.</p>';}
    $('libraryCategory').onchange=renderLibrary;$('librarySearch').oninput=renderLibrary;$('closeLibrary').onclick=()=>$('libraryDialog').close();
    $('libraryItems').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.insertExercise||b.dataset.forgetExercise;const item=library.find(x=>x.id===id);if(!item)return;
      if(b.dataset.insertExercise){const state=getState();if(!state.categories.includes(item.category))state.categories.push(item.category);state.rows.push([item.name,item.minutes,item.notes,item.category,item.id]);cache();render();toast('Exercise added to '+item.category);}
      else if(confirm('Remove this exercise from the library? It will remain in saved plans.')){library=library.filter(x=>x.id!==id);persist('tp_exercise_library_v1',library);renderLibrary();render();}
    };
    $('openLibrary').onclick=()=>openLibrary();
    return {renderRows,remember,rememberAll,updateSummary};
  }
  window.PlannerSections={normalize,attach};
})();
