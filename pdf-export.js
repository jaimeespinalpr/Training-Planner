(() => {
  'use strict';
  let fontPromise;
  function fontData(){
    if(!fontPromise)fontPromise=fetch('vendor/DejaVuSans.ttf').then(r=>{if(!r.ok)throw Error('Font unavailable');return r.arrayBuffer();}).then(b=>{let s='';const bytes=new Uint8Array(b);for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}).catch(e=>{fontPromise=null;throw e;});
    return fontPromise;
  }
  async function build(plan,brand,trackTitle){
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({unit:'pt',format:'letter',compress:true,putOnlyUsedFonts:true});
    doc.addFileToVFS('Planner.ttf',await fontData());doc.addFont('Planner.ttf','Planner','normal');doc.setFont('Planner');
    const accent=/^#[0-9a-f]{6}$/i.test(brand.color)?brand.color:'#0d6b4a';
    const margin=30,width=552;
    const title=doc.splitTextToSize(String(plan.name||'Daily Training'),430,{fontSize:16});
    const club=doc.splitTextToSize(brand.club||'Training Planner',430,{fontSize:11});
    const footer=doc.splitTextToSize([brand.coach,brand.season,brand.footer].filter(Boolean).join(' • '),500,{fontSize:9});
    const footerHeight=footer.length*12+24;
    const top=Math.max(128,48+title.length*19+club.length*14+38);
    doc.setProperties({title:plan.name,author:brand.coach||brand.club,subject:`${trackTitle} — ${plan.date}`,creator:'Training Planner'});
    const header=()=>{
      doc.setDrawColor(accent);doc.setLineWidth(1);doc.rect(margin,26,width,top-36);
      doc.setFontSize(16);doc.setTextColor(accent);doc.text(title,40,49);
      doc.setFontSize(11);doc.setTextColor('#25352e');doc.text(club,40,49+title.length*19);
      doc.setFontSize(10);doc.text(`${plan.date}   |   ${trackTitle}`,40,top-36);
      doc.text(`Planned duration: ${plan.minutes} min  |  Exercises: ${plan.rows.reduce((n,r)=>n+Number(r[1]),0)} min`,40,top-21);
      if(brand.logo){const image=doc.getImageProperties(brand.logo);const ratio=Math.min(62/image.width,62/image.height);doc.addImage(brand.logo,'PNG',510,37,image.width*ratio,image.height*ratio,'club-logo','FAST');}
    };
    const body=[];
    const categories=[...new Set([...(plan.categories||[]),...plan.rows.map(r=>r[3]||'Activities')])];
    for(const category of categories){
      const rows=plan.rows.filter(r=>(r[3]||'Activities')===category);if(!rows.length)continue;
      body.push([{content:`${category} · ${rows.reduce((n,r)=>n+Number(r[1]),0)} min`,colSpan:2,styles:{fillColor:'#e5f0e9',textColor:accent,fontSize:12,cellPadding:8}}]);
      rows.forEach(r=>body.push([`${r[0]}${r[2]?'\n'+r[2]:''}`,`${r[1]} min`]));
    }
    doc.autoTable({
      startY:top,margin:{top,left:margin,right:margin,bottom:footerHeight+15},
      head:[['ACTIVITY','TIME']],
      body:body.length?body:[['No activities','—']],
      theme:'grid',styles:{font:'Planner',fontStyle:'normal',fontSize:11,cellPadding:10,lineColor:accent,lineWidth:0.35,overflow:'linebreak',textColor:'#25352e'},
      headStyles:{fillColor:accent,textColor:'#ffffff',fontStyle:'normal'},
      columnStyles:{0:{cellWidth:446},1:{cellWidth:106,halign:'center'}},
      rowPageBreak:'avoid',showHead:'everyPage',willDrawPage:header
    });
    const total=doc.getNumberOfPages();
    for(let p=1;p<=total;p++){doc.setPage(p);doc.setDrawColor(accent);doc.line(30,792-footerHeight,582,792-footerHeight);doc.setFont('Planner');doc.setFontSize(9);doc.setTextColor('#47574e');if(footer.length)doc.text(footer,306,792-footerHeight+15,{align:'center'});doc.text(`Training Planner · ${p} / ${total}`,306,780,{align:'center'});}
    const name=(plan.name||'Training').replace(/[\\/:*?"<>|\x00-\x1f]/g,'').trim().slice(0,90)||'Training';
    return new File([doc.output('arraybuffer')],`${name}_${plan.date}.pdf`,{type:'application/pdf'});
  }
  window.PlannerPDF={build};
})();
