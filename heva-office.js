(function(root){
const safeName=s=>s.replace(/[^\p{L}\p{N} -]/gu,'').slice(0,90)||'HEVA_material';
function download(blob,name){let a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
async function word(m,teacher=false){
 if(!root.docx)throw Error('No se cargó el exportador Word local. Recarga la página.');
 const material=HEVA.material(m),visual=root.HEVATemplates.layout(material);
 const {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType}=root.docx;
 const originalBlocks=HEVA.blocks(material,teacher),blocks=root.HEVAGuideVisuals?.plan(material,originalBlocks,root.HEVAContextAssets,HEVA.blocks(material,false).length)||originalBlocks;
 const main=visual.theme.main,ink=visual.theme.ink,children=[];
 const line=(value,opts={})=>new Paragraph({children:[new TextRun({text:String(value),size:opts.size||visual.wordSize,font:material.accesibilidadVisual?.fuente||'Arial',characterSpacing:Math.round((material.accesibilidadVisual?.espaciado||0)*(opts.size||visual.wordSize)*10),bold:!!opts.bold,color:opts.color||ink})],spacing:{before:opts.before||0,after:opts.after??110},...(opts.box?{shading:{type:'clear',fill:visual.theme.background},border:{left:{color:main,size:16,space:8,style:'single'}},indent:{left:160,right:100}}:{}),keepNext:!!opts.keepNext});
 children.push(line('ESCUELA HÉCTOR VALENZUELA CEA · EPJA',{bold:true,color:main,size:20,after:260}));
 children.push(new Paragraph({text:material.titulo||'Material educativo',heading:HeadingLevel.TITLE,spacing:{after:220},keepNext:true}));
 children.push(line([material.asignatura,material.nivel,material.temaEspecifico].filter(Boolean).join(' · '),{color:main,after:260}));
 for(const [blockIndex,block] of blocks.entries()){
  if(block.path==='titulo'||(block===blocks[0]&&block.title===material.titulo))continue;
  if(block.kind==='option'){
   // Mantener la pregunta A–D completa; evita que el enunciado quede
   // solo al final de una página y las opciones aparezcan en la siguiente.
   const next=blocks[blockIndex+1];
   const keepNext=Boolean(next?.kind==='option'&&next.group===block.group);
   children.push(line(block.title+' '+block.text,{after:115,keepNext}));
   continue;
  }
  children.push(new Paragraph({text:block.title,heading:HeadingLevel.HEADING_2,spacing:{before:220,after:110},keepNext:true}));
  if(block.kind==='planning-moment'){for(const field of block.fields){children.push(line(field.title,{bold:true,color:main,keepNext:true,after:70}));for(const paragraph of field.text.split(/\n+/).filter(Boolean))children.push(line(paragraph,{after:140}));}continue;}
  const extra=block.guideVisual;
  if(!extra?.chart&&!extra?.diagram&&!extra?.comparison&&!extra?.timeline)for(const paragraph of String(block.text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)){
   children.push(line(paragraph,{after:140,box:!!extra?.box,keepNext:block.kind==='question'||/^ejemploGuiado\.pasos\.\d+\.accion$/.test(block.path||'')}));
  }
  if(extra)children.push(...root.HEVAGuideVisuals.render(root.docx,extra,line,visual.theme));
  if(!teacher&&/preguntaReflexion$|actividadesGuiadas\.\d+\.consigna$|actividadAutonoma\.consigna$/.test(block.path||'')){
   for(let j=0;j<3;j++)children.push(line('___________________________________________________________________',{size:19,color:'9A9A9A',after:155}));
  }
 }
 const doc=new Document({styles:{paragraphStyles:[{id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',run:{font:material.accesibilidadVisual?.fuente||'Arial',size:Math.max(visual.wordSize,28),bold:true,color:main},paragraph:{keepNext:true}},{id:'Title',name:'Title',basedOn:'Normal',next:'Normal',run:{font:material.accesibilidadVisual?.fuente||'Arial',size:Math.max(visual.wordSize+8,36),bold:true,color:main},paragraph:{keepNext:true}}],default:{document:{run:{font:material.accesibilidadVisual?.fuente||'Arial',size:visual.wordSize},paragraph:{spacing:{line:Math.round(240*(material.accesibilidadVisual?.interlineado||1.3)),lineRule:'auto'}}}}},sections:[{properties:{page:{margin:{top:1080,bottom:1080,left:1080,right:1080}}},children}]});
 const blob=await Packer.toBlob(doc);
 download(blob,safeName(material.titulo)+(teacher?'_docente':'_estudiante')+'.docx');
 return blob;
}
function wrap(text,max=66){let out=[],line='';String(text).split('\n').forEach(par=>{par.split(/\s+/).forEach(w=>{if((line+' '+w).length>max){if(line)out.push(line);line=w}else line+=(line?' ':'')+w});out.push(line);line=''});return out}
function slideText(value){return (Array.isArray(value)?value.join('\n'):String(value??'')).replace(/\r/g,'').trim()}
function chunksOf(value,maxChars=850,maxItems=5){
 const raw=slideText(value);
 // Keep each author-written paragraph or labelled item intact. Splitting at
 // arbitrary character boundaries destroys mathematical and historical meaning.
 const paragraphs=raw.split(/\n+/).map(x=>x.trim()).filter(Boolean);
 const items=paragraphs; // Never break a mathematical step, question, or instruction mid-paragraph.
 const pages=[];let page=[],length=0;
 for(const item of items){if(page.length&&(page.length>=maxItems||length+item.length>maxChars)){pages.push(page);page=[];length=0}page.push(item);length+=item.length;}
 if(page.length)pages.push(page);
 return pages.length?pages:[['Contenido pendiente de desarrollar']];
}
// Conservative text measurement shared by pagination and layout selection.
let measureContext;
function textWidth(value,size){
 if(measureContext===undefined){try{measureContext=root.document?.createElement('canvas')?.getContext('2d')||null;}catch{measureContext=null;}}
 if(measureContext){measureContext.font=size+'pt Arial';return measureContext.measureText(String(value)).width*72/96;}
 return [...String(value)].reduce((n,c)=>n+(/[ilI.,:;!|' ]/.test(c)?.3:/[MW@#%]/.test(c)?.88:.57)*size,0);
}
function lineCount(value,width,size){const limit=width*72;let count=0;for(const paragraph of String(value).split('\n')){let used=0;count++;for(const word of paragraph.split(/\s+/).filter(Boolean)){const w=textWidth(word,size),gap=used?textWidth(' ',size):0;if(used&&used+gap+w>limit){count++;used=0;}if(w>limit){count+=Math.ceil(w/limit)-1;used=w%limit;}else used+= (used?gap:0)+w;}}return count;}
function fitsText(lines,width,height,size){return lineCount(lines.join('\n\n'),width,size)*size*1.28<=Math.max(0,height-.12)*72;}
function paginatePresentation(section,large=false){
 const activity=root.HEVASlideDesign?.role(section)==='activity'||classifySlide(section.title||'',[],0)==='activity';
 const size=26,height=section.image?4.1:activity?3.65:4.05,width=section.image?6.7:11.0;
 const dataRows=slideText(section.text).split(/\n+/).map(x=>x.trim()).filter(Boolean);
 if(section.visualOptions?.graficos!==false&&root.HEVASlideDesign?.role(section)!=='activity'&&root.HEVASlideDesign?.dataChart(dataRows)&&fitsText([dataRows.join('\n')],5.15,3.9,26))return[dataRows];
 const source=slideText(section.text).split(/\n+/).map(x=>x.trim()).filter(Boolean),pieces=[];
 for(const paragraph of source){if(fitsText([paragraph],width,height,size)){pieces.push(paragraph);continue;}
  // Prefer sentence boundaries. Very long sentences continue at word boundaries.
  const sentences=paragraph.match(/[\s\S]+?(?:[.!?]+(?=\s|$)|$)/g)||[paragraph];let current='';
  for(const sentence of sentences){if(fitsText([current+(current?' ':'')+sentence.trim()],width,height,size)){current+=(current?' ':'')+sentence.trim();continue;}if(current){pieces.push(current);current='';}for(const word of sentence.trim().split(/\s+/)){if(current&&!fitsText([current+' '+word],width,height,size)){pieces.push(current);current='';}current+=(current?' ':'')+word;}}
  if(current)pieces.push(current);
 }
 const pages=[];let page=[];for(const piece of pieces){const pageWidth=pages.length?11.0:width;if(page.length&&(page.length>=3||!fitsText([...page,piece],pageWidth,height,size))){pages.push(page);page=[];}page.push(piece);}if(page.length)pages.push(page);return pages.length?pages:[['Contenido pendiente de desarrollar']];
}
function addChrome(ppt,theme,section,num,total){
 const slide=ppt.addSlide();slide.background={color:theme.background};
 if(section==='activity')theme={...theme,main:'FFFFFF',ink:'FFFFFF'};
 slide.addShape(ppt.ShapeType.rect,{x:0,y:0,w:13.333,h:theme.layout==='editorial'?.12:.07,line:{color:theme.main},fill:{color:theme.main}});

 slide.addText('HEVA  /  EDUCACIÓN DE PERSONAS JÓVENES Y ADULTAS',{x:.72,y:.33,w:10.7,h:.25,fontFace:theme.font||'Aptos',fontSize:10,bold:true,color:theme.main,margin:0,charSpacing:theme.layout==='editorial'?1.2:0});
 slide.addShape(ppt.ShapeType.line,{x:.72,y:6.96,w:11.88,h:0,line:{color:theme.soft||'DDCDBE',width:1}});
 slide.addText('ESCUELA HÉCTOR VALENZUELA CEA · VILLARRICA',{x:.72,y:7.06,w:9.9,h:.18,fontSize:9,color:theme.ink,margin:0});
 slide.addText(String(num)+' / '+String(total),{x:11.45,y:7.04,w:1.1,h:.2,fontSize:10,color:theme.main,bold:true,align:'right',margin:0});
 return slide;
}
function classifySlide(title,lines,index){
 const t=title.toLowerCase();
 if(/idea clave|concepto central|definición/.test(t))return 'feature';
 if(/selección múltiple|pregunta de alternativas|alternativas?\s*\d+|^alternativas?$|opción\s+[a-d]\b/i.test(t))return 'question';
 if(/actividad|ejercicio|desafío|reflexión|pregunta|aplicación|debate|práctica|ticket de salida/.test(t))return 'activity';
 if(/comparación|comparar|diferencias|versus|ventajas y desventajas/.test(t))return 'compare';
 if(/cronología|línea de tiempo|etapas|proceso histórico|evolución/.test(t))return 'timeline';
 if(/causas|consecuencias|factores|características|elementos/.test(t))return 'cards';
 return 'editorial';
}
function visualKind(title,lines){
 const t=String(title).toLowerCase(),body=lines.join(' ');
 if(/línea de tiempo|cronología|etapas históricas|periodización/.test(t))return 'chronology';
 if(/resoluci[oó]n|despej|comprobaci[oó]n|modelamiento|análisis de fuente/.test(t)&&/[xX]\s*[+=\-]|(?:\d+)\s*[xX]/.test(body))return 'equation';
 if(/procedimiento|pasos|secuencia|síntesis del proceso|proceso de resolución/.test(t)&&/(?:paso\s*\d|^\s*\d+\.)/im.test(body))return 'process';
 return null;
}
function drawSemanticVisual(ppt,theme,slide,title,lines){
 const kind=visualKind(title,lines);if(!kind)return false;
 const tx=(v,x,y,w,h,size=20,color=theme.ink,bold=false)=>slide.addText(String(v),{x,y,w,h,fontFace:'Aptos',fontSize:size,color,bold,margin:.05,fit:'shrink',valign:'mid'});
 const shape=(x,y,w,h,c)=>slide.addShape(ppt.ShapeType.roundRect,{x,y,w,h,rectRadius:.12,line:{color:c,transparency:100},fill:{color:c}});
 if(kind==='equation'){
  const source=lines.join(' ');
  const matches=[...source.matchAll(/(?:\d[\d.,]*\s*[xX]|[xX])\s*(?:[+\-]\s*\d[\d.,]*)?\s*=\s*(?:\d[\d.,]*\s*(?:[+\-]\s*\d[\d.,]*)?|\d[\d.,]*\s*\/\s*\d[\d.,]*)/g)].map(x=>x[0]);
  const equations=[...new Set(matches)];
  if(!equations.length||equations.length>4||source.length>420||lines.some(t=>!fitsText([t],3.2,1.32,26)))return false; // Preserve long explanatory text instead of replacing it with extracted equations.
  tx(title,.8,.83,11.7,.9,31,theme.main,true);
  shape(.85,2.02,11.62,1.15,theme.main);tx(equations[0],1.18,2.16,10.9,.8,33,'FFFFFF',true);
  const other=equations.slice(1),steps=other.length?other:lines;
  // Keep the complete explanation in speaker notes when equations carry the visual.
  if(typeof slide.addNotes==='function')slide.addNotes(lines.join('\n'));
  const n=Math.max(1,steps.length),w=(11.6-(n-1)*.18)/n;
  steps.forEach((line,i)=>{const x=.86+i*(w+.18);shape(x,3.56,w,2.7,i%2?'F1E7DB':'FFFFFF');tx('TRANSFORMACIÓN '+(i+1),x+.18,3.82,w-.36,.38,13,theme.main,true);tx(line,x+.2,4.42,w-.4,1.32,n>2?19:23);});
  slide.hevaVisualType='diagram';return true;
 }
 if(kind==='process'||kind==='chronology'){
  const items=lines;if(!items.length||items.length>4||items.some(t=>!fitsText([t],(11.6-(items.length-1)*.16)/items.length-.46,1.98,26)))return false;
  tx(title,.8,.83,11.7,.9,31,theme.main,true);
  const n=items.length,w=(11.6-(n-1)*.16)/n;
  // Las fechas deben venir del material: nunca reconstruirlas ni inventarlas.
  const dates=kind==='chronology'?items.map(line=>line.match(/^\s*(\d{3,4})\s*:\s*(\S.+)$/)):[],dated=dates.length===n&&dates.every(Boolean);
  items.forEach((line,i)=>{const x=.86+i*(w+.16),label=dated?dates[i][1]:String(i+1);shape(x,2.35,w,3.65,i%2?'F1E7DB':'FFFFFF');shape(x+.22,2.68,dated?1.36:.68,.68,theme.main);tx(label,x+.28,2.74,dated?1.24:.54,.5,dated?21:21,'FFFFFF',true);tx(line.replace(/^\s*\d+[.)]\s*/,''),x+.23,3.58,w-.46,1.98,n>=4?22:26);if(i<n-1)tx('→',x+w-.03,3.13,.3,.35,17,theme.accent,true)});
  slide.hevaVisualType='diagram';return true;
 }
 return false;
}
function drawBalance(ppt,theme,slide){
 const line=(x,y,w,h,width=2)=>slide.addShape(ppt.ShapeType.line,{x,y,w,h,line:{color:theme.main,width}});
 line(6.6,3.1,0,2.2,3);line(4.1,3.3,5,0,3);line(5.15,3.3,0,1.0);line(8.05,3.3,0,1.0);
 line(4.3,4.35,1.7,0);line(7.2,4.35,1.7,0);line(5.75,5.35,1.7,0,3);
 slide.addText('MISMA OPERACIÓN EN AMBOS LADOS',{x:3.1,y:5.63,w:7,h:.45,fontSize:18,bold:true,color:theme.main,align:'center',margin:0});
}
function addContent(ppt,theme,slide,title,lines,section,index=0,scene={}){
 const resources=scene.visualOptions||{imagenes:true,diagramas:true,graficos:true,recuadros:true},illustration=resources.imagenes?scene.image:null;
 if(resources.diagramas&&!illustration){if(drawSemanticVisual(ppt,theme,slide,title,lines))return;}
 const kind=classifySlide(title,lines,index),clean=lines.map(x=>x.replace(/^[-•]\s*/,'').trim()).filter(Boolean);
 const activity=scene.design==='activity'||kind==='activity',activityStyle=activity&&resources.recuadros,ink=activityStyle?'FFFFFF':theme.ink,main=activityStyle?'FFFFFF':theme.main;
 // A single canvas: no nested cards, decorative counters or repeated panel grids.
 if(activityStyle)slide.background={color:theme.main};
 const text=(value,x,y,w,h,size,color,bold=false)=>slide.addText(String(value),{x,y,w,h,fontFace:theme.font||'Aptos',fontSize:size,color,bold,margin:0,breakLine:false,valign:'top',fit:'shrink',paraSpaceAfterPt:12});
 const relation=resources.diagramas&&!activity?root.HEVASlideDesign?.relation(clean):null;
 const chart=resources.graficos&&scene.allowDataChart!==false&&!activity&&fitsText([clean.join('\n')],5.15,3.9,26)?root.HEVASlideDesign?.dataChart(clean):null;
 const titleSize=title.length>85?28:title.length>60?32:36;
 text(title,.85,.92,illustration&&!chart?7.05:11.6,1.18,illustration&&!chart?Math.min(titleSize,32):titleSize,main,true);
 if(chart){
  text(clean.join('\n'),.86,2.4,5.15,3.9,26,ink);
  text('Unidad: '+chart.unit,6.6,2.08,5.65,.35,16,main,true);
  slide.addChart(ppt.ChartType.bar,[{name:chart.unit,labels:chart.labels,values:chart.values}],{x:6.45,y:2.65,w:5.95,h:3.65,barDir:'bar',showLegend:false,showValue:true,showTitle:false,catAxisLabelFontSize:18,valAxisLabelFontSize:14,dataLabelFontSize:18,valAxisMinVal:0,chartColors:[theme.main],showBorder:false,showCatName:false,showShadow:false});
  return;
 }
 // Pares disciplinarios editables basados exclusivamente en el texto real.
 const pair=resources.recuadros&&!illustration?root.HEVASlideDesign?.comparisonPairs(clean):null;
 if(pair&&pair.every(entry=>fitsText([entry.text],5.0,2.75,25))){
   pair.forEach((entry,j)=>{
     const x=.86+j*6.03;
     slide.addShape(ppt.ShapeType.roundRect,{x,y:2.4,w:5.6,h:3.85,rectRadius:.13,
       line:{color:theme.accent,width:1.3},fill:{color:j===0?(theme.panel||'FFFFFF'):(theme.soft||'F1E7DB')}});
     text(entry.label.toUpperCase(),x+.32,2.75,4.96,.45,17,theme.main,true);
     text(entry.text,x+.32,3.54,4.96,2.35,25,theme.ink);
   });
   slide.hevaVisualType=pair.some(entry=>/Registro (formal|informal)/.test(entry.label))?'dialogue':'diagram';return;
 }
 const addPicture=()=>{const box=root.HEVASlideDesign.contain(illustration,{x:8.45,y:1.75,w:4.03,h:4.82});slide.addImage({data:illustration.data,...box,altText:illustration.alt});if(illustration.generated)text('IMAGEN ILUSTRATIVA GENERADA',8.45,6.66,4.03,.18,9,main);if(typeof slide.addNotes==='function')slide.addNotes(illustration.alt);};
 if(relation){
  const nodeX=illustration ? .85 : 1.15,nodeW=illustration?6.7:11.0,innerW=nodeW-.5;
  const heights=clean.map(t=>lineCount(t,innerW,26)*26*1.28/72+.3),height=heights.reduce((a,n)=>a+n,0)+(clean.length-1)*.25;
  if(height<=4.05){let y=2.35+(4.05-height)/2;clean.forEach((line,j)=>{const h=heights[j],dark=j===0&&theme.main!=='111111';slide.addShape(ppt.ShapeType.roundRect,{x:nodeX,y,w:nodeW,h,rectRadius:.1,line:{color:theme.main,width:1},fill:{color:dark?theme.main:(theme.panel||'FFFFFF')}});text(line,nodeX+.25,y+.15,innerW,h-.3,26,dark?'FFFFFF':ink);y+=h;if(j<clean.length-1){slide.addShape(ppt.ShapeType.downArrow,{x:nodeX+nodeW/2-.175,y:y+.025,w:.35,h:.2,line:{color:theme.accent,transparency:100},fill:{color:theme.accent}});y+=.25;}});if(illustration)addPicture();slide.hevaVisualType='diagram';return;}
 }
 if(illustration){addPicture();text(clean.join('\n\n'),.86,2.35,6.7,4.1,26,ink);return;}
 if(!resources.recuadros){text(clean.join('\n\n'),.86,2.4,11.0,4.05,26,ink);return;}
 if(activity)text('TRABAJO EN CLASE',.86,2.14,11.4,.32,14,'FFFFFF',true);
 const top=activity?2.7:2.4;
 // Tres tarjetas editables, con colores del tema elegido.
 if(!activity&&resources.recuadros&&clean.length===3&&
    clean.every(line=>fitsText([line],3.36,2.82,21))&&
    (kind==='cards'||scene.design==='concept'||theme.layout==='editorial')){
   const width=3.72,gap=.19;
   clean.forEach((line,j)=>{
     const x=.86+j*(width+gap);
     slide.addShape(ppt.ShapeType.roundRect,{x,y:2.55,w:width,h:3.64,rectRadius:.12,line:{color:theme.soft||theme.accent,width:1},fill:{color:j%2===0?(theme.panel||'FFFFFF'):(theme.soft||'F1E7DB')}});
     slide.addShape(ppt.ShapeType.rect,{x:x+.2,y:2.83,w:.7,h:.08,line:{color:theme.accent,transparency:100},fill:{color:theme.accent}});
     text(String(j+1).padStart(2,'0'),x+.2,3.06,.65,.42,17,theme.main,true);
     text(line,x+.24,3.68,width-.48,2.25,21,theme.ink);
   });
   slide.hevaVisualType='cards';
   return;
 }
 if(resources.diagramas&&scene.design==='example'&&clean.length>=2&&clean.length<=3&&clean.every(t=>fitsText([t],10.4,1.05,26))){
  clean.forEach((line,j)=>{const y=2.3+j*1.34;text(String(j+1),.86,y,.65,.8,38,main,true);text(line,1.85,y,10.4,1.05,26,ink);});return;
 }

 if(activity&&clean.length===2&&fitsText([clean[0]],11.5,1.7,26)&&fitsText([clean[1]],11.5,1.6,30)){
  text(clean[0],.86,2.7,11.5,1.7,26,ink);
  slide.addShape(ppt.ShapeType.roundRect,{x:.8,y:4.5,w:11.73,h:1.98,rectRadius:.12,line:{color:'FFFFFF',width:1.5,transparency:20},fill:{color:theme.main}});
  text(clean[1],1.1,4.7,11.0,1.6,30,ink,true);return;
 }
 if(scene.design==='closing'&&clean.length&&fitsText([clean[0]],11.5,1.7,32)&&fitsText(clean.slice(1),11.5,1.65,26)){
  text(clean[0],.86,2.4,11.5,1.7,32,main,true);
  text(clean.slice(1).join('\n\n'),.86,4.6,11.5,1.65,26,ink);return;
 }
 // Comparison stays a real two-column comparison only when both halves fit.
 const mid=Math.ceil(clean.length/2),halves=[clean.slice(0,mid),clean.slice(mid)];
 if(kind==='compare'&&clean.length>=2&&halves.every(x=>fitsText(x,4.9,3.3,26))){
  const panelHeight=Math.min(4.15,Math.max(2.6,...halves.map(part=>lineCount(part.join('\n\n'),4.9,26)*26*1.28/72+.75))),panelY=2.3+(4.15-panelHeight)/2;
  halves.forEach((part,j)=>{const x=.86+j*6.03;slide.addShape(ppt.ShapeType.roundRect,{x,y:panelY,w:5.6,h:panelHeight,rectRadius:.12,line:{color:theme.accent,width:1},fill:{color:theme.main==='111111'?'FFFFFF':j?(theme.soft||'F1E7DB'):(theme.panel||'FFFFFF')}});text(part.join('\n\n'),x+.35,panelY+.35,4.9,panelHeight-.7,26,ink);});
 }else{
  // Every remaining interior receives a real composition, including legacy
  // decks without role metadata and topics with no matching illustration.
  const mono=theme.main==='111111';
  if(!activity&&clean.length===2&&clean.every(t=>fitsText([t],4.9,3.35,26))){
   clean.forEach((line,j)=>{const x=.85+j*6.03,dark=j===0&&!mono;slide.addShape(ppt.ShapeType.roundRect,{x,y:2.3,w:5.6,h:4.15,rectRadius:.12,line:{color:theme.main,width:1,transparency:dark?100:75},fill:{color:dark?theme.main:(theme.panel||'FFFFFF')}});text(line,x+.35,2.72,4.9,3.35,26,dark?'FFFFFF':ink);});
  }else{
   const heights=clean.map(t=>lineCount(t,10.9,26)*26*1.28/72+.34),total=heights.reduce((a,n)=>a+n,0)+Math.max(0,clean.length-1)*.17;
   if(!activity&&clean.length>=2&&clean.length<=3&&total<=4.05){
    let y=2.35+(4.05-total)/2;clean.forEach((line,j)=>{const h=heights[j];slide.addShape(ppt.ShapeType.roundRect,{x:.85,y,w:11.65,h,rectRadius:.08,line:{color:theme.accent,width:.8},fill:{color:mono||j%2===0?(theme.panel||'FFFFFF'):(theme.soft||theme.background)}});slide.addShape(ppt.ShapeType.rect,{x:.85,y,w:.1,h,line:{color:theme.accent,transparency:100},fill:{color:theme.accent}});text(line,1.2,y+.17,10.9,h-.34,26,ink);y+=h+.17;});
   }else{
    const y=activity?2.55:2.2,h=activity?3.95:4.4;
    slide.addShape(ppt.ShapeType.roundRect,{x:.8,y,w:11.73,h,rectRadius:.12,line:{color:activity?'FFFFFF':theme.accent,width:1},fill:{color:activity?theme.main:(theme.panel||'FFFFFF')}});
    slide.addShape(ppt.ShapeType.rect,{x:.8,y,w:.12,h,line:{color:theme.accent,transparency:100},fill:{color:theme.accent}});
    const size=!activity&&clean.length===1&&fitsText(clean,11.0,4.05,28)?28:26;
    text(clean.join('\n\n'),1.15,activity?2.7:2.4,11.0,activity?3.65:4.05,size,ink);
   }
  }
 }
}
function presentationPages(material,teacher=false){
 const visual=root.HEVATemplates.layout(material);
 const isPresentation=String(material.tipoMaterial||'').toUpperCase()==='PRESENTACION'&&Array.isArray(material.diapositivas)&&material.diapositivas.length>0;
 let sections=[];
 if(isPresentation){
  sections=material.diapositivas.map((d,i)=>({title:d.titulo||'Diapositiva '+(i+1),text:slideText(d.contenido),kind:'slide',role:d.funcion||'',image:d.imagenHEVA,hideImage:d.ocultarImagenHEVA===true,notes:d.notasDocente||''}));
 }else{
  let blocks=[];const rawBlocks=HEVA.blocks(material,teacher),sourceBlocks=root.HEVAGuideVisuals?.attach(material,rawBlocks,HEVA.blocks(material,false).length)||rawBlocks;sourceBlocks.forEach(item=>{let prev=blocks.at(-1);if(item.kind==='option'&&prev?.group===item.group)prev.text+='\n'+item.title+' '+item.text;else blocks.push({...item})});
  sections=blocks.map(item=>({title:item.title,text:slideText(item.text),kind:item.kind||'section',image:item.image,hideImage:item.hideImage}));
 }
 const story=root.HEVAPedagogy?.newsText(material);if(isPresentation&&story)sections.unshift({title:'Noticia didáctica · SIMULADA',text:story,kind:'resource'});
 sections=root.HEVASlideDesign?.decorate(material,sections,root.HEVAGuideVisuals?.enabled(material)&&root.HEVASlideDesign.image(material.imagenGuiaHEVA)?{}:root.HEVAContextAssets)||sections;
 sections=sections.map(s=>({...s,visualOptions:root.HEVASlideDesign?.options(material)||{imagenes:true,diagramas:true,graficos:true,recuadros:true},allowDataChart:['PRESENTACION','GUIA','TALLER','ACCESIBLE'].includes(material.tipoMaterial)}));
 const pages=sections.flatMap((section,index)=>{
  // Keep a complete multiple-choice question and its alternatives together.
  const isQuestion=/selección múltiple|alternativa|pregunta\s*\d+/i.test(section.title);
  const maxChars=isQuestion?1500:850;
  const groups=isQuestion?chunksOf(section.text,maxChars,12):paginatePresentation(section,visual.large),rendered=groups.map((lines,part)=>({...section,lines,image:part?null:section.image,title:section.title+(part?' · continuación':'')}));
  if(section.image&&section.visualOptions.graficos&&section.allowDataChart&&section.design!=='activity'&&classifySlide(section.title,groups[0],index)!=='activity'&&root.HEVASlideDesign?.dataChart(groups[0])&&fitsText([groups[0].join('\n')],5.15,3.9,26)){rendered[0].image=null;rendered.push({...section,title:section.title+' · imagen de apoyo',lines:[section.image.alt],image:section.image,allowDataChart:false,design:'editorial'});}
  return rendered;
 });
 const used=new Map();for(const page of pages){const key=page.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();const n=(used.get(key)||0)+1;used.set(key,n);if(n>1)page.title+=' ('+n+')';}
 const news=material.fuentesDocumentales?.noticias?.items||[];
 if(isPresentation&&news.length){const source={title:'Fuentes de noticias consultadas',kind:'sources',text:news.map(n=>n.publisher+' · '+String(n.publishedAt||'').slice(0,10)+' · '+n.title+'\n'+n.url).join('\n')};paginatePresentation(source,visual.large).forEach((lines,i)=>pages.push({...source,lines,title:source.title+(i?' · continuación':'')}));}
 return pages;
}
function renderCover(ppt,theme,material,total){
 const cover=ppt.addSlide(),contrast=theme.background==='FFFFFF'&&theme.main==='111111';
 const editorial=theme.layout==='editorial',clean=theme.layout==='clean',warm=theme.layout==='warm';
 // La fotografía genérica nunca debe definir el tema de una asignatura.
 const image=material.imagenPortadaHEVA===true&&!editorial&&!clean&&root.HEVASlideDesign?.options(material).imagenes!==false?root.HEVAVisualAssets?.cover:null;
 cover.background={color:contrast?'FFFFFF':editorial?theme.background:(theme.cover||theme.main)};
 if(image&&!contrast)cover.addImage({data:image,x:0,y:0,w:13.333,h:7.5,altText:'Cuaderno y materiales de estudio. Imagen decorativa generada.'});
 const color=contrast?'111111':editorial?theme.main:'FFFFFF',title=String(material.titulo||'Presentación educativa');
 const size=title.length>100?30:title.length>65?35:editorial?43:44;
 if(editorial){
  cover.addShape(ppt.ShapeType.rect,{x:0,y:0,w:.22,h:7.5,line:{color:theme.main,transparency:100},fill:{color:theme.main}});
  cover.addShape(ppt.ShapeType.rect,{x:.85,y:1.56,w:2.25,h:.07,line:{color:theme.accent,transparency:100},fill:{color:theme.accent}});
 }else if(clean){
  cover.addShape(ppt.ShapeType.rect,{x:0,y:0,w:13.333,h:.12,line:{color:theme.accent,transparency:100},fill:{color:theme.accent}});
  cover.addShape(ppt.ShapeType.roundRect,{x:9.9,y:1.1,w:2.35,h:4.35,rectRadius:.18,line:{color:theme.accent,transparency:100},fill:{color:theme.accent,transparency:18}});
 }
 cover.addText('HEVA  /  APRENDER Y APLICAR',{x:.85,y:.7,w:7,h:.4,fontFace:theme.font||'Aptos',fontSize:14,bold:true,color,margin:0});
 cover.addText(title,{x:.85,y:2,w:image&&!contrast?6.25:11.6,h:2.8,fontFace:theme.font||'Aptos',fontSize:size,bold:true,color,margin:0,valign:'mid',fit:'shrink'});
 cover.addText([material.asignatura,material.nivel].filter(Boolean).join(' · '),{x:.85,y:5.3,w:image&&!contrast?6.2:11.6,h:.65,fontSize:20,color,margin:0,fit:'shrink'});
 cover.addText('ESCUELA HÉCTOR VALENZUELA CEA · VILLARRICA',{x:.85,y:6.85,w:10.5,h:.3,fontSize:10,color,margin:0});
 if(typeof cover.addNotes==='function'&&image&&!contrast)cover.addNotes('Imagen de portada decorativa generada para HEVA. No constituye una fuente ni evidencia curricular.');
}
// Preview records exactly the shapes and text boxes used by the PPTX renderer.
function preview(m,teacher=false){
 const material=HEVA.material(m),visual=root.HEVATemplates.layout(material),pages=presentationPages(material,teacher),record=[];
 const ppt={ChartType:{bar:'bar'},ShapeType:{rect:'rect',roundRect:'roundRect',line:'line',downArrow:'downArrow'},addSlide(){const page={elements:[],background:{color:visual.theme.background}};record.push(page);return Object.defineProperties({addChart:(chartType,data,options)=>page.elements.push({kind:'chart',chartType,data,...options}),addImage:(options)=>page.elements.push({kind:'image',...options}),addShape:(shape,options)=>page.elements.push({kind:'shape',shape,...options}),addText:(text,options)=>page.elements.push({kind:'text',text:String(text),...options}),addNotes:()=>{}},{background:{set(v){page.background=v}},hevaVisualType:{set(v){page.visualKind=v}}});}};
 renderCover(ppt,visual.theme,material,pages.length+1);
 pages.forEach((page,i)=>{const slide=addChrome(ppt,visual.theme,page.visualOptions?.recuadros===false?'plain':page.design==='activity'?'activity':classifySlide(page.title,page.lines,i),i+2,pages.length+1);if(visual.large){const add=slide.addText;slide.addText=(text,options)=>add(text,{...options,fontSize:(options.fontSize>=17?Math.max(26,options.fontSize):options.fontSize)});}addContent(ppt,visual.theme,slide,page.title,page.lines,page.kind,i,page);});
 return {pages:record,visualSummary:{interiorPages:record.length-1,interiorImages:record.slice(1).reduce((n,p)=>n+p.elements.filter(x=>x.kind==='image').length,0),charts:record.reduce((n,p)=>n+p.elements.filter(x=>x.kind==='chart').length,0),diagrams:record.filter(p=>p.visualKind==='diagram').length,composedPages:record.slice(1).filter(p=>p.elements.some(x=>x.kind==='shape'&&x.shape==='roundRect')).length,cardPages:record.filter(p=>p.visualKind==='cards').length},width:13.333,height:7.5,limitation:'Comparte paginación y geometría con PPTX. Las fuentes y saltos de línea pueden variar en PowerPoint; comprobar el archivo final.'};
}
async function powerpoint(m,teacher=false){
 if(!root.PptxGenJS)throw Error('No se cargó el exportador PowerPoint. Recarga la página.');
 const material=HEVA.material(m),visual=root.HEVATemplates.layout(material),theme=visual.theme;
 const ppt=new root.PptxGenJS();ppt.layout='LAYOUT_WIDE';ppt.author='Escuela Héctor Valenzuela CEA';ppt.subject=material.objetivoAprendizaje||'';ppt.title=material.titulo;
 ppt.lang='es-CL';ppt.theme={headFontFace:theme.font||'Aptos Display',bodyFontFace:theme.font||'Aptos',lang:'es-CL'};
 const pages=presentationPages(material,teacher);
 const total=pages.length+1;
 renderCover(ppt,theme,material,total);
 pages.forEach((page,i)=>{const slide=addChrome(ppt,theme,page.visualOptions?.recuadros===false?'plain':page.design==='activity'?'activity':classifySlide(page.title,page.lines,i),i+2,total);if(visual.large){const originalAddText=slide.addText.bind(slide);slide.addText=(text,options)=>originalAddText(text,{...options,fontSize:(options.fontSize>=17?Math.max(26,options.fontSize):options.fontSize)});}addContent(ppt,theme,slide,page.title,page.lines,page.kind,i,page);if(page.notes&&typeof slide.addNotes==='function')slide.addNotes(page.notes)});
 await ppt.writeFile({fileName:safeName(material.titulo)+(teacher?'_docente':'_estudiante')+'.pptx'});return ppt;
}

function auditExport(m,teacher=false){
 const material=HEVA.material(m),blocks=HEVA.blocks(material,teacher),issues=[];
 const text=blocks.map(b=>String(b.text||'')).join('\n');
 const isPresentation=String(material.tipoMaterial||'').toUpperCase()==='PRESENTACION';
 const slides=isPresentation?presentationPages(material,teacher).length+1:0;
 if(isPresentation&&slides>35)issues.push({level:'warning',code:'PPT_EXTENSO',detail:'La conversión podría producir '+slides+' diapositivas. Revise la necesidad de cada sección; no se recorta contenido.'});
 if(/(?:Paso\s*\d+\s*:\s*Paso\s*\d+)/i.test(text))issues.push({level:'warning',code:'PASO_REPETIDO',detail:'Se detectó una etiqueta de paso duplicada en el contenido original.'});
 if(/(?:imagin(?:e|ar)|visualic(?:e|ar))\s+(?:una\s+)?balanza/i.test(text))issues.push({level:'info',code:'BALANZA_VISUAL',detail:'Conviene acompañar la metáfora de la balanza con un diagrama.'});
 if(/evaluaci[oó]n|prueba/i.test(material.tipoMaterial||'')&&!/puntaje|puntos/i.test(text))issues.push({level:'warning',code:'SIN_PUNTAJE',detail:'No se identificó un puntaje explícito en la evaluación.'});
 if(/(?:Caso\s*\d+|pregunta\s*\d+)/i.test(text)&&/\b2\s*puntos\b/i.test(text)&&/justific|comprob|represent|resuelv/i.test(text))issues.push({level:'info',code:'REVISAR_RUBRICA',detail:'Hay actividades de varios pasos con puntajes bajos; verifique la rúbrica y el desglose.'});
 // Use actual PPT preview elements, rather than assumed section properties,
 // to avoid false visual-coverage warnings for editable charts and diagrams.
 const plannedPages=presentationPages(material,teacher);
 let renderedVisuals=[];
 try{renderedVisuals=preview(material,teacher).pages.slice(1).map(page=>({image:page.elements.some(e=>e.kind==='image'),chart:page.elements.some(e=>e.kind==='chart'),diagram:page.visualKind==='diagram'||page.visualKind==='dialogue'}));}
 catch{renderedVisuals=plannedPages.map(p=>({image:!!p.image,chart:!!p.chart,diagram:!!p.diagram}));}
 const withVisuals=renderedVisuals.filter(p=>p.image||p.chart||p.diagram).length;
 const requested=root.HEVASlideDesign?.options(material)||{};
 if(['PRESENTACION','GUIA','TALLER','ACCESIBLE'].includes(material.tipoMaterial)&&['imagenes','diagramas','graficos'].some(k=>requested[k]!==false)&&plannedPages.length>=10&&withVisuals/Math.max(1,plannedPages.length)<.15)issues.push({level:'warning',code:'COBERTURA_VISUAL_BAJA',detail:'Solo '+withVisuals+' de '+plannedPages.length+' páginas tienen recursos visuales planificados. Revise su pertinencia y distribución; una portada decorativa no basta.'});
 const sectionData=blocks.map(b=>({title:b.title,text:b.text})); const q=root.HEVAQualityGate?.inspect({material,sections:sectionData,visuals:renderedVisuals}); if(q)for(const issue of q.issues)issues.push({level:'warning',code:issue.code,detail:issue.detail}); const evidence=root.HEVAEvidenceGate?.inspect({material,sections:sectionData,visuals:renderedVisuals}); if(evidence)for(const issue of evidence.issues)issues.push({level:'warning',code:issue.code,detail:issue.detail}); const approval=root.HEVAApprovalAudit?.review({material,sections:sectionData,visuals:renderedVisuals}); if(approval)for(const issue of approval.issues)issues.push({level:'warning',code:issue.code,detail:issue.detail}); return {estimatedSlides:slides,issues,qualityScore:q?.score??null,qualityScoreIsHeuristic:true,pedagogicallyApproved:approval?approval.aprobado:false,documentaryEvidence:evidence||null,approvalEvidence:approval||null,wordAndPowerpointShareContent:true};
}
root.HEVAOffice={word,powerpoint,download,auditExport,preview,presentationPages,paginatePresentation,classifySlide};})(typeof globalThis!=='undefined'?globalThis:this);
