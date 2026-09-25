(() => {
  'use strict';
  const defaults={wrestling:['Roll Call and Announcements','Warm-up','Introduction of New Techniques or Drills','Live Wrestling (High Pace Drills)','Strength and Skill Based Activities','Cool Down Closing and Visualization','Announcements'],lifting:['Introduction','Warm-up','Strength','Power','Cool-down'],mental:['Introduction','Breathing','Visualization','Decision-making','Reflection']};
  const legacy={wrestling:['Calentamiento','Técnica','Combate','Vuelta a la calma'],lifting:['Calentamiento','Fuerza','Potencia','Vuelta a la calma'],mental:['Respiración','Visualización','Toma de decisiones','Reflexión']};
  const categoryNames={'Introducción':'Roll Call and Announcements','Introduction':'Roll Call and Announcements','Calentamiento':'Warm-up','Technique':'Introduction of New Techniques or Drills','Técnica':'Introduction of New Techniques or Drills','Live wrestling':'Live Wrestling (High Pace Drills)','Combate':'Live Wrestling (High Pace Drills)','Vuelta a la calma':'Cool-down','Fuerza':'Strength','Potencia':'Power','Respiración':'Breathing','Visualización':'Visualization','Toma de decisiones':'Decision-making','Reflexión':'Reflection','Otros':'Other'};
  const englishCategory=name=>categoryNames[name]||name;
  const categoryForTrack=(name,track)=>track==='wrestling'&&englishCategory(name)==='Cool-down'?'Cool Down Closing and Visualization':englishCategory(name);
  const cooldownItems=["Light jog cool down","Slow walk around the mat","Deep breathing reset","Box breathing","Breathing while lying on the mat","Controlled inhale and exhale","Full body relaxation","Neck stretch","Shoulder stretch","Triceps stretch","Chest opener stretch","Wrist and forearm stretch","Hip flexor stretch","Hamstring stretch","Quad stretch","Groin stretch","Butterfly stretch","Pigeon stretch","Child’s pose","Cobra stretch","Downward dog stretch","Low lunge stretch","Seated forward fold","Figure-four stretch","Calf stretch","Ankle mobility reset","Partner assisted stretching","Foam rolling","Light band shoulder mobility","Post-practice gratitude circle","Team huddle closing","Coach message of the day","Athlete reflection","One thing learned today","One thing to improve tomorrow","Best effort moment","Mental reset after practice","Eyes-closed breathing","Lie on the mat and visualize a full match","Visualize the first whistle","Visualize staying calm under pressure","Visualize defending the first attack","Visualize scoring the first point","Visualize finishing a single leg","Visualize finishing a double leg","Visualize finishing a high crotch","Visualize escaping a bad position","Visualize winning a scramble","Visualize scoring near the edge","Visualize controlling center mat","Visualize recovering after giving up points","Visualize winning the last exchange","Visualize wrestling with confidence","Visualize hand fighting with pressure","Visualize hitting your best move","Visualize chaining attacks","Visualize defending and re-attacking","Visualize winning in overtime","Visualize hearing the final whistle","Visualize raising your hand after victory","Visualize winning a tournament","Visualize stepping onto the podium","Visualize receiving the gold medal","Visualize representing your team with pride","Visualize staying disciplined during hard matches","Visualize walking into the arena confident","Visualize warming up before finals","Visualize beating a tough opponent","Visualize bouncing back after a mistake","Visualize executing the game plan","Visualize your coach giving instructions","Visualize your teammates supporting you","Visualize shaking hands with respect","Visualize becoming a champion","Positive self-talk repetition","Repeat: I am ready","Repeat: I stay calm","Repeat: I control my position","Repeat: I can defend and score","Repeat: I finish strong","Repeat: I trust my training","Repeat: I wrestle with purpose","Repeat: I compete with courage","Repeat: I am prepared","Repeat: I belong here"];
  const warmupItems=[
    ['Light jog',''],['High knees',''],['Butt kicks',''],['Side shuffles',''],['Carioca / grapevine',''],
    ['Backpedal',''],['Progressive short sprints',''],['Jumping jacks',''],['Seal jacks',''],['Light shadow wrestling',''],
    ['Circles around the mat',''],['Jog with direction changes',''],['Jog + sprawls on whistle',''],['Jog + shots on whistle',''],
    ['Bear crawl',''],['Crab walk',''],['Duck walk',''],['Frog jumps',''],['Bunny hops',''],['Army crawl','']
  ];
  const coachWarmupItems=[['Agility and foot speed drills',''],['Core and coordination',''],['Front Roll',''],['Back Roll','']];
  const strengthItems=['Sprawl jumps','Bear crawl forward','Bear crawl backward','Bear crawl lateral','Crab walk forward','Crab walk backward','Plank shoulder taps','Push-up to shoulder tap','Partner push resistance','Partner pull resistance','Partner stance push-pull','Shot defense reaction','Hip pop reaction','Core stabilization plank','Side plank hold','Hollow body hold','Superman hold','Sit-outs','Hip heists','Technical stand-ups','Squat jumps','Broad jumps','Split squat jumps','Lateral bounds','Skater jumps','Tuck jumps','Burpees','Medicine ball slams','Medicine ball chest pass','Medicine ball rotational throw','Band-resisted shots','Band-resisted sprawls','Partner bear crawl chase','Rope climbs','Farmer carries','Sandbag carries','Sandbag cleans','Partner carries','Fireman’s carry walk','Wall sits','Walking lunges','Reverse lunges','Cossack squats','Push-ups','Pull-ups','Chin-ups','Dips','Battle ropes','Sled push','Sled pull','Short explosive sprawls'];
  const techniqueItems=["Stance and motion","Level change drill","Penetration step","Knee slide penetration","Step-slide in stance","Motion to level change","Motion to penetration step","Fake shot drill","Shadow shot entry","Shadow single leg entry","Shadow double leg entry","Shadow high crotch entry","Shot to feet recovery","Shot and reshot","Shot to cut the corner","Single leg entry without finish","Double leg entry without finish","High crotch entry without finish","Low single entry motion","Sweep single entry motion","Ankle pick motion","Hand touch to shot","Partner hand-touch reaction","Mirror stance motion","Partner mirror drill","Wrist control setup","Inside tie setup","Collar tie setup","Elbow pass setup","Snap down setup","Arm drag setup","2-on-1 setup","Russian tie entry","Underhook entry","Overhook entry","Head position battle","Push-pull setup","Circle to angle","Create angle drill","Clear tie and attack","Hand fight to level change","Hand fight to single leg","Hand fight to double leg","Hand fight to high crotch","Pummeling to attack","Underhook to knee tap","Underhook to single leg","Snap down to front headlock","Front headlock position entry","Sprawl to front headlock","Front headlock to go-behind","Single leg finish position","Double leg finish position","High crotch finish position","Run the pipe drill","Shelf the leg drill","Back trip setup","Crackdown position drill","Whizzer position drill","Limp leg drill","Hip pressure drill","Down block drill","Down block to re-attack","Sprawl, circle, face","Sprawl to go-behind","Baseline defense movement","Sit-out motion","Switch motion","Stand-up motion","Hip heist motion","Granby motion","Mat return footwork","Lift position entry","Gut wrench position drill","Lace position drill","Tilt position drill","Par terre pressure drill","Slow motion technique reps","Partner walk-through reps","Coach command technique reps","Technique chain drill","Position freeze drill","Finish on whistle drill"];
  const liveItems=["First attack wins","First score wins","30-second takedown match","20-second score or defend","One-minute neutral live","Short-time defense, winning by 1","Short-time offense, losing by 1","Sudden victory takedown","Push-out / edge control situation","Center mat control drill","Start from hand fight","Start from collar tie","Start from inside tie","Start from 2-on-1","Start from underhook","Start from over-under position","Start from front headlock","Start from single leg position","Start from high crotch position","Start from double leg position","Start from low single position","Start from crackdown position","Start from whizzer position","Start from opponent on your leg","Start with one athlete already in on a shot","Start with defender sprawled","Start with attacker on knees","Start from go-behind position","Start from rear standing position","Start from mat return position","Start from par terre top","Start from par terre bottom","Gut wrench live","Lace position live","Tilt position live","Front headlock live finish","Single leg finish live","Double leg finish live","High crotch finish live","Whizzer defense live","Sprawl and re-attack live","Down block to score live","Shot defense reaction live","Hand fight to score live","Snap down to score live","Underhook to score live","2-on-1 to score live","Re-attack only live","Defense-only live","Offense-only live","Bottom escape live","Top control live","Mat return live","Wall / boundary wrestling","Circle back to center drill","Score and reset","Score, continue wrestling","Chain wrestling live","Three-shot minimum live","No backing up live","Hands-only setup to shot","Must score from setup","Must clear tie before attacking","Must re-attack after defending","Must finish within 10 seconds","Must hold position for 10 seconds","Two takedowns to win","Best of three takedowns","King of the mat","Shark bait drill","Fresh partner every 30 seconds","Fresh partner every minute","High pace scramble live","Scramble to score","Bad position recovery live","Protect the lead drill","Comeback drill","Down by 2 with 30 seconds left","Up by 2 with 30 seconds left","Last takedown wins","First exposure wins","Freestyle exposure live","Greco pummeling live","Greco body lock live","Par terre turn or defend","Coach whistle reaction live","Random position live","Situation call-out live","Match pace goes","3 x 30-second live goes","5 x 1-minute live goes","2-minute hard live","Full match simulation"];
  const announcementItems=["Remember to eat well before and after practice","Hydrate throughout the day","Bring your water bottle to every practice","Get enough sleep every night","Take recovery seriously","Respect your body and listen to pain signals","Manage your weight the right way","Do not cut weight in unhealthy ways","Eat clean during competition week","Avoid junk food before tournaments","Pack healthy snacks for long tournament days","Stay consistent with your nutrition","Keep your gear clean","Bring wrestling shoes every day","Bring running shoes when needed","Bring extra clothes after practice","Wash your knee pads regularly","Trim your fingernails","Shower immediately after practice","Report any skin issues right away","Respect your teammates","Respect your coaches","Respect your parents and supporters","Be on time","Be ready before practice starts","No excuses, just effort","Stay disciplined outside the wrestling room","Surround yourself with good people","Choose friends who push you to be better","Stay away from negative influences","Protect your focus","Take care of your grades","Be responsible at school","Be a leader in the classroom","Be a leader in the wrestling room","Help younger teammates","Encourage your teammates","Celebrate team success","Learn from losses","Do not let one bad day define you","Control what you can control","Stay humble after wins","Stay hungry after losses","Keep a positive attitude","Trust the process","Practice with purpose","Compete with courage","Stay mentally strong","Visualize your goals daily","Write down your goals","Review your goals every week","Ask questions when you do not understand","Communicate with coaches","Tell coaches about injuries early","Take care of your mental health","Do your recovery work","Stretch after practice","Ice or recover when needed","Prepare your bag the night before","Check tournament times early","Know your weight class","Know your competition schedule","Stay ready for weigh-ins","Represent the team with pride","Represent your family with pride","Represent yourself with discipline","Remember why you started","Leave the room better than you found it","Clean up after yourself","Keep the mat area clean","No phones during practice","Be present","Give full effort until the final whistle","Finish every drill strong","Be coachable","Body language matters","Champions do the little things right","Consistency beats motivation","Discipline creates confidence","Your habits become your results","Eat right, sleep right, train right","Good choices outside practice win matches","Take pride in doing hard things","Every practice is a chance to improve","Today’s effort becomes tomorrow’s result"];
  const key=s=>String(s).trim().normalize('NFKC').toLocaleLowerCase();
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function normalize(plan){
    const track=defaults[plan.track]?plan.track:'wrestling';
    const categories=Array.isArray(plan.categories)?plan.categories.filter(c=>typeof c==='string'&&c.trim()).map(c=>categoryForTrack(c,track)):[...defaults[track]];
    for(const category of defaults[track])if(!categories.includes(category))categories.push(category);
    const rows=plan.rows.map((r,i)=>[String(r[0]||''),Math.max(0,Number(r[1])||0),String(r[2]||''),categoryForTrack(String(r[3]||legacy[track][i]||'Other'),track),String(r[4]||'')]).filter(r=>!(r[3]==='Warm-up'&&key(r[0])==='warm-up + movement'));
    for(const r of rows)if(!categories.includes(r[3]))categories.push(r[3]);
    return {...plan,schemaVersion:2,warmupMinutes:Math.max(0,Number(plan.warmupMinutes??10)||0),categories:[...new Set(categories)],rows};
  }
  function attach({getState,cache,render,toast,read,persist,savePlan,getSettings,updateProgress}){
    const $=id=>document.getElementById(id);
    let library=read('tp_exercise_library_v1',[]);if(!Array.isArray(library))library=[];
    library=library.map(item=>({...item,category:categoryForTrack(item.category,item.track)}));
    const starterItems=[['Attendance Check','0',''],['Joke of the Day','0',''],['Goals','0','']];
    let seeded=false;
    for(const [name,minutes,notes] of starterItems){
      if(!library.some(x=>x.track==='wrestling'&&x.category==='Roll Call and Announcements'&&key(x.name)===key(name))){
        library.push({id:crypto.randomUUID(),track:'wrestling',category:'Roll Call and Announcements',name,minutes:Number(minutes),notes});seeded=true;
      }
    }
    if(seeded)persist('tp_exercise_library_v1',library);
    let warmupTemplates=read('tp_warmup_templates',[]);if(!Array.isArray(warmupTemplates))warmupTemplates=[];
    let warmupSeeded=false;
    for(const [name,notes] of [...warmupItems,...coachWarmupItems]){
      if(!library.some(x=>x.track==='wrestling'&&x.category==='Warm-up'&&key(x.name)===key(name))){library.push({id:crypto.randomUUID(),track:'wrestling',category:'Warm-up',name,minutes:0,notes});warmupSeeded=true;}
    }
    if(warmupSeeded)persist('tp_exercise_library_v1',library);
    let strengthSeeded=false;
    for(const name of strengthItems){
      if(!library.some(x=>x.track==='wrestling'&&x.category==='Strength and Skill Based Activities'&&key(x.name)===key(name))){library.push({id:crypto.randomUUID(),track:'wrestling',category:'Strength and Skill Based Activities',name,minutes:0,notes:''});strengthSeeded=true;}
    }
    if(strengthSeeded)persist('tp_exercise_library_v1',library);
    let techniqueSeeded=false;
    for(const name of techniqueItems){
      if(!library.some(x=>x.track==='wrestling'&&x.category==='Introduction of New Techniques or Drills'&&key(x.name)===key(name))){
        library.push({id:crypto.randomUUID(),track:'wrestling',category:'Introduction of New Techniques or Drills',name,minutes:0,notes:''});techniqueSeeded=true;
      }
    }
    if(techniqueSeeded)persist('tp_exercise_library_v1',library);
    let liveSeeded=false;
    for(const name of liveItems){
      if(!library.some(x=>x.track==='wrestling'&&x.category==='Live Wrestling (High Pace Drills)'&&key(x.name)===key(name))){
        library.push({id:crypto.randomUUID(),track:'wrestling',category:'Live Wrestling (High Pace Drills)',name,minutes:0,notes:''});liveSeeded=true;
      }
    }
    if(liveSeeded)persist('tp_exercise_library_v1',library);
    let cooldownSeeded=false;
    for(const name of cooldownItems){
      if(!library.some(x=>x.track==='wrestling'&&x.category==='Cool Down Closing and Visualization'&&key(x.name)===key(name))){
        library.push({id:crypto.randomUUID(),track:'wrestling',category:'Cool Down Closing and Visualization',name,minutes:0,notes:''});cooldownSeeded=true;
      }
    }
    if(cooldownSeeded)persist('tp_exercise_library_v1',library);
    let announcementsSeeded=false;
    for(const name of announcementItems){
      if(!library.some(x=>x.track==='wrestling'&&x.category==='Announcements'&&key(x.name)===key(name))){
        library.push({id:crypto.randomUUID(),track:'wrestling',category:'Announcements',name,minutes:0,notes:''});announcementsSeeded=true;
      }
    }
    if(announcementsSeeded)persist('tp_exercise_library_v1',library);
    function warmupLibraryItems(){return library.filter(x=>x.track==='wrestling'&&key(x.category)==='warm-up').sort((a,b)=>a.name.localeCompare(b.name));}
    function warmupPanel(state,category){
      if(category!=='Warm-up'||state.track!=='wrestling')return '';
      const selected=state.warmupMode||'coach';
      const options=[['coach','Coach Jaime Warm-up'],['custom','Custom'],...warmupTemplates.map(t=>[`template:${t.id}`,t.name])];
      const items=selected==='coach'?coachWarmupItems.map(([name,notes])=>warmupLibraryItems().find(x=>x.name===name)||({name,notes,minutes:0})):selected==='custom'?[]:(warmupTemplates.find(t=>`template:${t.id}`===selected)?.rows||[]).map(r=>({id:r[4],name:r[0],minutes:r[1],notes:r[2]}));
      const action=selected==='custom'?'Add all Custom exercises':'Add full warm-up';
      const customContent=selected==='custom'?'<p>Choose from the complete Custom exercise list. Each exercise can be added individually.</p><button type="button" data-warmup-open-custom>Open Custom exercise list</button>':`<div class="warmup-items">${items.length?items.map(x=>`<div class="warmup-item"><span>${esc(x.name)}</span><button type="button" data-warmup-add="${esc(x.id||x.name)}">Add</button></div>`).join(''):'<p>No exercises in this warm-up group yet.</p>'}</div>`;
      return `<div class="warmup-controls"><label class="warmup-duration">Section time (min)<input type="number" min="0" max="1440" data-warmup-duration value="${Math.max(0,Number(state.warmupMinutes)||0)}"></label><label>Warm-up group<select data-warmup-mode>${options.map(([value,label])=>`<option value="${esc(value)}"${value===selected?' selected':''}>${esc(label)}</option>`).join('')}</select></label>${customContent}<div class="section-actions"><button type="button" data-warmup-add-all>${action}</button><button type="button" data-warmup-save>Save</button><button type="button" data-warmup-save-template>Save as template</button></div></div>`;
    }
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
        const items=state.rows.map((r,i)=>({r,i})).filter(x=>x.r[3]===category);const isWarmup=category==='Warm-up';
        const count=library.filter(x=>x.track===state.track&&key(x.category)===key(category)).length;
        const color=getSettings?.().categoryColors?.[category]||getSettings?.().color||'#982b2e';
        return `<section class="exercise-section" style="--section-color:${esc(color)}"><div class="section-heading"><h3>${esc(category)}</h3><span data-section-total="${c}">${isWarmup?Math.max(0,Number(state.warmupMinutes)||0):items.reduce((n,x)=>n+x.r[1],0)} min</span><button type="button" data-delete-section="${c}" aria-label="Delete section ${esc(category)}">×</button></div>${warmupPanel(state,category)}${items.map(({r,i})=>isWarmup ? `<div class="row warmup-row"><label class="warmup-name">Exercise<input data-i="${i}" data-k="0" maxlength="180" value="${esc(r[0])}" placeholder="Exercise or point name"></label><button type="button" class="remove" data-remove="${i}" aria-label="Remove exercise from session">×</button><details class="activity-notes"><summary>Details <span aria-hidden="true">⌄</span></summary><textarea data-i="${i}" data-k="2" maxlength="5000" rows="2" placeholder="Repetitions, instructions, or coaching points…">${esc(r[2])}</textarea></details></div>` : `<div class="row"><label>Exercise / point<input data-i="${i}" data-k="0" maxlength="180" value="${esc(r[0])}" placeholder="Exercise or point name"></label><label>Min<input type="number" min="0" max="1440" data-i="${i}" data-k="1" value="${r[1]}"></label><button type="button" class="remove" data-remove="${i}" aria-label="Remove exercise from session">×</button><details class="activity-notes"><summary>Details <span aria-hidden="true">⌄</span></summary><textarea data-i="${i}" data-k="2" maxlength="5000" rows="2" placeholder="Repetitions, instructions, or coaching points…">${esc(r[2])}</textarea></details></div>`).join('')||'<p class="empty-section">Add coaching points or exercises to this section.</p>'}<div class="section-actions"><button type="button" data-add-exercise="${c}">+ Add exercise</button><button type="button" data-library="${c}">Library · ${count}</button></div></section>`;
      }).join('');
    }
    function updateSummary(){const state=getState();state.categories.forEach((category,c)=>{const total=$('rows').querySelector(`[data-section-total="${c}"]`);if(total)total.textContent=(category==='Warm-up'?Math.max(0,Number(state.warmupMinutes)||0):state.rows.filter(r=>r[3]===category).reduce((n,r)=>n+r[1],0))+' min';const button=$('rows').querySelector(`[data-library="${c}"]`);if(button)button.textContent='Library · '+library.filter(x=>x.track===state.track&&key(x.category)===key(category)).length;});}
    function add(category){const state=getState();state.rows.push(['',0,'',category,'']);cache();render();$('rows').querySelector(`[data-i="${state.rows.length-1}"][data-k="0"]`).focus();}
    $('rows').addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;const state=getState();
      if(b.dataset.warmupSave!==undefined){savePlan?.();return;}
      if(b.dataset.warmupOpenCustom!==undefined){openCustomWarmup();return;}
      if(b.dataset.warmupAdd!==undefined){const item=warmupLibraryItems().find(x=>x.id===b.dataset.warmupAdd||x.name===b.dataset.warmupAdd);if(item&&!state.rows.some(r=>r[3]==='Warm-up'&&key(r[0])===key(item.name))){state.rows.push([item.name,item.minutes,item.notes,'Warm-up',item.id]);cache();render();toast('Exercise added to Warm-up');}return;}
      if(b.dataset.warmupAddAll!==undefined){const selected=state.warmupMode||'coach';const source=selected==='coach'?coachWarmupItems.map(([name])=>warmupLibraryItems().find(x=>x.name===name)).filter(Boolean):selected==='custom'?warmupLibraryItems():(warmupTemplates.find(t=>`template:${t.id}`===selected)?.rows||[]).map(r=>({id:r[4],name:r[0],minutes:r[1],notes:r[2]}));source.forEach(item=>{if(!state.rows.some(r=>r[3]==='Warm-up'&&key(r[0])===key(item.name)))state.rows.push([item.name,item.minutes,item.notes,'Warm-up',item.id]);});cache();render();toast('Warm-up group added to the session');return;}
      if(b.dataset.warmupSaveTemplate!==undefined){const rows=state.rows.filter(r=>r[3]==='Warm-up');if(!rows.length){toast('Add at least one Warm-up exercise first.');return;}const name=prompt('Template name','Warm-up group');if(!name?.trim())return;warmupTemplates=[{id:crypto.randomUUID(),name:name.trim(),rows:rows.map(r=>[...r])},...warmupTemplates].slice(0,50);persist('tp_warmup_templates',warmupTemplates);toast('Warm-up template saved');render();return;}
      if(b.dataset.addExercise!==undefined)add(state.categories[Number(b.dataset.addExercise)]);
      if(b.dataset.library!==undefined)openLibrary(state.categories[Number(b.dataset.library)]);
      if(b.dataset.deleteSection!==undefined){const category=state.categories[Number(b.dataset.deleteSection)];if(state.rows.some(r=>r[3]===category)&&!confirm('Remove this section and its exercises from the session? Your library will be kept.'))return;state.rows=state.rows.filter(r=>r[3]!==category);state.categories=state.categories.filter(c=>c!==category);cache();render();}
    });
    $('rows').addEventListener('input',e=>{if(e.target.dataset.warmupDuration!==undefined){const state=getState();state.warmupMinutes=Math.max(0,Number(e.target.value)||0);cache();updateProgress?.();}});$('rows').addEventListener('change',e=>{if(e.target.dataset.warmupMode!==undefined){getState().warmupMode=e.target.value;cache();render();}});
    function openCustomWarmup(){
      const dialog=$('warmupCustomDialog'),list=$('warmupCustomItems');if(!dialog||!list)return;
      list.innerHTML=warmupLibraryItems().map(x=>`<div class="warmup-item"><span>${esc(x.name)}</span><button type="button" data-warmup-modal-add="${esc(x.id)}">Add</button></div>`).join('');dialog.showModal();
    }
    $('warmupCustomItems')?.addEventListener('click',e=>{const b=e.target.closest('[data-warmup-modal-add]');if(!b)return;const item=warmupLibraryItems().find(x=>x.id===b.dataset.warmupModalAdd),state=getState();if(item&&!state.rows.some(r=>r[3]==='Warm-up'&&key(r[0])===key(item.name))){state.rows.push([item.name,item.minutes,item.notes,'Warm-up',item.id]);cache();render();toast('Exercise added to Warm-up');}});
    $('closeWarmupCustom')?.addEventListener('click',()=>$('warmupCustomDialog').close());
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
