(() => {
  'use strict';

  const layout={
    style:'daily-schedule',
    logo:{placement:'centered',maxWidth:132,maxHeight:92},
    watermark:{placement:'center',maxWidth:360,maxHeight:300,opacity:0.1},
    schedule:{rounded:true,labels:{title:'Daily Schedule',date:'Date',total:'Total Time'},columns:['ACTIVITY','TIME']},
    footer:{alignment:'right'}
  };

  let fontPromise,watermarkPromise,watermarkKey;
  function fontData(){
    if(!fontPromise)fontPromise=fetch('vendor/DejaVuSans.ttf')
      .then(r=>{if(!r.ok)throw Error('Font unavailable');return r.arrayBuffer();})
      .then(b=>{let s='';const bytes=new Uint8Array(b);for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);})
      .catch(e=>{fontPromise=null;throw e;});
    return fontPromise;
  }

  function validColor(value,fallback){return /^#[0-9a-f]{6}$/i.test(value)?value:fallback;}
  function positiveMinutes(value){return Math.max(0,Number(value)||0);}
  function officialWatermark(src,accent){
    if(!src||src!==window.YOUNG_GUNS_LOGO)return Promise.resolve(src);
    const key=accent+':'+src.length;
    if(watermarkPromise&&watermarkKey===key)return watermarkPromise;
    watermarkKey=key;
    watermarkPromise=(async()=>{
      const image=new Image();
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=src;if(image.complete&&image.naturalWidth)resolve();});
      const scale=Math.min(1,720/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,canvas.width,canvas.height);
      const pixels=context.getImageData(0,0,canvas.width,canvas.height);
      const rgb=[parseInt(accent.slice(1,3),16),parseInt(accent.slice(3,5),16),parseInt(accent.slice(5,7),16)];
      for(let i=0;i<pixels.data.length;i+=4){
        const strength=Math.max(pixels.data[i],pixels.data[i+1],pixels.data[i+2]);
        if(strength<24){pixels.data[i+3]=0;continue;}
        pixels.data[i]=rgb[0];pixels.data[i+1]=rgb[1];pixels.data[i+2]=rgb[2];
        pixels.data[i+3]=Math.round(pixels.data[i+3]*Math.min(1,(strength-24)/150));
      }
      context.putImageData(pixels,0,0);return canvas.toDataURL('image/png');
    })().catch(()=>src);
    return watermarkPromise;
  }

  async function build(plan,brand,trackTitle){
    const {jsPDF}=window.jspdf;
    const format=brand.pageSize==='a4'?'a4':'letter';
    const doc=new jsPDF({unit:'pt',format,compress:true,putOnlyUsedFonts:true});
    const pageWidth=doc.internal.pageSize.getWidth();
    const pageHeight=doc.internal.pageSize.getHeight();
    const font=await fontData();
    doc.addFileToVFS('Planner.ttf',font);
    doc.addFont('Planner.ttf','Planner','normal');
    doc.addFont('Planner.ttf','Planner','bold');
    doc.setFont('Planner');

    const accent=validColor(brand.color,'#982b2e');
    const textColor=validColor(brand.textColor,'#1a1a1a');
    const watermarkImage=await officialWatermark(brand.logo,accent);
    const fontSize=brand.visualSize==='large'?12:brand.visualSize==='compact'?8.5:10;
    const pageMargin=28;
    const cardLeft=pageMargin;
    const cardWidth=pageWidth-pageMargin*2;
    const footerLines=[brand.coach,brand.season,brand.footer].filter(Boolean).map(String);
    const footerHeight=Math.max(46,footerLines.length*11+18);
    const cardBottom=pageHeight-footerHeight-18;
    const logoTop=18;
    let logoBottom=logoTop;

    if(brand.logo){
      const image=doc.getImageProperties(brand.logo);
      const ratio=Math.min(layout.logo.maxWidth/image.width,layout.logo.maxHeight/image.height);
      logoBottom=logoTop+image.height*ratio;
    }else{
      logoBottom=58;
    }

    const planTitle=doc.splitTextToSize(String(plan.name||'Practice Plan'),pageWidth-96,{fontSize:12});
    const titleY=logoBottom+15;
    const cardTop=Math.max(142,titleY+(planTitle.length-1)*14+14);
    const tableTop=cardTop+56;
    const innerLeft=cardLeft+8;
    const innerWidth=cardWidth-16;
    const timeWidth=92;
    const activityWidth=innerWidth-timeWidth;

    doc.setProperties({
      title:plan.name,
      author:brand.coach||brand.club,
      subject:`${trackTitle} — ${plan.date}`,
      creator:'Training Planner'
    });

    function drawLogo(){
      if(brand.logo){
        const image=doc.getImageProperties(brand.logo);
        const ratio=Math.min(layout.logo.maxWidth/image.width,layout.logo.maxHeight/image.height);
        const width=image.width*ratio,height=image.height*ratio;
        if(brand.logo===window.YOUNG_GUNS_LOGO){doc.setFillColor('#080808');doc.roundedRect((pageWidth-width)/2-3,logoTop-3,width+6,height+6,4,4,'F');}
        doc.addImage(brand.logo,'PNG',(pageWidth-width)/2,logoTop,width,height,'club-logo','FAST');
      }else{
        doc.setFont('Planner','bold');doc.setFontSize(18);doc.setTextColor(accent);
        doc.text(brand.club||'Training Planner',pageWidth/2,42,{align:'center'});
      }
      doc.setFont('Planner','bold');doc.setFontSize(12);doc.setTextColor(textColor);
      doc.text(planTitle,pageWidth/2,titleY,{align:'center'});
    }

    function drawWatermark(){
      if(!watermarkImage||!doc.GState||!doc.setGState)return;
      try{
        const image=doc.getImageProperties(watermarkImage);
        const ratio=Math.min(layout.watermark.maxWidth/image.width,layout.watermark.maxHeight/image.height);
        const width=image.width*ratio,height=image.height*ratio;
        const availableHeight=cardBottom-tableTop;
        doc.setGState(new doc.GState({opacity:layout.watermark.opacity}));
        doc.addImage(watermarkImage,'PNG',(pageWidth-width)/2,tableTop+(availableHeight-height)/2,width,height,'watermark-logo','FAST');
        doc.setGState(new doc.GState({opacity:1}));
      }catch{/* Watermark is decorative; keep the export usable if unsupported. */}
    }

    function drawScheduleFrame(){
      doc.setDrawColor(accent);doc.setLineWidth(2);
      doc.roundedRect(cardLeft,cardTop,cardWidth,cardBottom-cardTop,12,12,'S');
      doc.setFont('Planner','bold');doc.setTextColor(textColor);
      doc.setFontSize(11);doc.text(layout.schedule.labels.title,cardLeft+14,cardTop+23);
      doc.setFontSize(8);doc.text(layout.schedule.labels.date,pageWidth/2,cardTop+14,{align:'center'});
      doc.setFontSize(10);doc.text(String(plan.date||''),pageWidth/2,cardTop+31,{align:'center'});
      doc.setFontSize(8);doc.text(layout.schedule.labels.total,cardLeft+cardWidth-14,cardTop+14,{align:'right'});
      doc.setFontSize(10);doc.text(`${positiveMinutes(plan.minutes)} min`,cardLeft+cardWidth-14,cardTop+31,{align:'right'});
      doc.setLineWidth(0.6);doc.line(innerLeft,cardTop+43,innerLeft+innerWidth,cardTop+43);
      drawWatermark();
    }

    function drawPage(){drawLogo();drawScheduleFrame();}

    const body=[];
    const categories=[...new Set([...(plan.categories||[]),...(plan.rows||[]).map(r=>r[3]||'Activities')])];
    for(const category of categories){
      const rows=(plan.rows||[]).filter(r=>(r[3]||'Activities')===category);
      if(!rows.length)continue;
      const total=category==='Warm-up'?positiveMinutes(plan.warmupMinutes):rows.reduce((sum,row)=>sum+positiveMinutes(row[1]),0);
      body.push([
        {content:category,styles:{fontStyle:'bold',textColor:accent,fontSize:fontSize+1,cellPadding:{top:7,right:8,bottom:5,left:8},lineWidth:{top:0.7,right:0.25,bottom:0.2,left:0.25}}},
        {content:`${total} min`,styles:{fontStyle:'bold',textColor:textColor,halign:'center',fontSize,cellPadding:{top:7,right:5,bottom:5,left:5},lineWidth:{top:0.7,right:0.25,bottom:0.2,left:0.25}}}
      ]);
      rows.forEach(row=>{
        const minutes=positiveMinutes(row[1]);
        const label=`${String(row[0]||'Activity')}${rows.length>1&&category!=='Warm-up'?` · ${minutes} min`:''}${row[2]?`\n${row[2]}`:''}`;
        body.push([
          {content:label,styles:{cellPadding:{top:6,right:8,bottom:8,left:8},lineWidth:{top:0,right:0.25,bottom:0.25,left:0.25}}},
          {content:'',styles:{cellPadding:5,lineWidth:{top:0,right:0.25,bottom:0.25,left:0.25}}}
        ]);
      });
    }

    doc.autoTable({
      startY:tableTop,
      margin:{top:tableTop,left:innerLeft,right:innerLeft,bottom:pageHeight-cardBottom+8},
      tableWidth:innerWidth,
      head:[[layout.schedule.columns[0],layout.schedule.columns[1]]],
      body:body.length?body:[['No activities','—']],
      theme:'grid',
      styles:{font:'Planner',fontStyle:'normal',fontSize,cellPadding:7,lineColor:accent,lineWidth:0.25,overflow:'linebreak',textColor,fillColor:false},
      headStyles:{font:'Planner',fontStyle:'bold',fillColor:false,textColor,cellPadding:{top:7,right:8,bottom:7,left:8},lineColor:accent,lineWidth:{top:0.8,right:0.25,bottom:0.8,left:0.25}},
      columnStyles:{0:{cellWidth:activityWidth},1:{cellWidth:timeWidth,halign:'center'}},
      rowPageBreak:'avoid',
      showHead:'everyPage',
      willDrawPage:drawPage
    });

    const totalPages=doc.getNumberOfPages();
    for(let page=1;page<=totalPages;page++){
      doc.setPage(page);doc.setFont('Planner','normal');doc.setFontSize(8.5);doc.setTextColor('#555555');
      doc.text(`Training Planner · ${page} / ${totalPages}`,pageMargin,pageHeight-23);
      if(footerLines.length){
        const footer=doc.splitTextToSize(footerLines.join('\n'),pageWidth*0.56,{fontSize:8.5});
        doc.text(footer,pageWidth-pageMargin,pageHeight-23-(footer.length-1)*10,{align:'right'});
      }
    }

    const name=(plan.name||'Training').replace(/[\\/:*?"<>|\x00-\x1f]/g,'').trim().slice(0,90)||'Training';
    return new File([doc.output('arraybuffer')],`${name}_${plan.date}.pdf`,{type:'application/pdf'});
  }

  window.PlannerPDF={build,layout};
})();
