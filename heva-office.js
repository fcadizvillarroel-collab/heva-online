(function(root){
const safeName=s=>s.replace(/[^\p{L}\p{N} -]/gu,'').slice(0,90)||'HEVA_material';
function download(blob,name){let a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
async function word(m,teacher=false){
 if(!root.docx)throw Error('No se cargó el exportador Word local. Recarga la página.');
 const material=HEVA.material(m),visual=root.HEVATemplates.layout(material);
 const {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType}=root.docx;
 const blocks=HEVA.blocks(material,teacher);
 const main=visual.theme.main,ink=visual.theme.ink,children=[];
 const line=(value,opts={})=>new Paragraph({children:[new TextRun({text:String(value),size:opts.size||visual.wordSize,font:material.accesibilidadVisual?.fuente||'Arial',characterSpacing:Math.round((material.accesibilidadVisual?.espaciado||0)*(opts.size||visual.wordSize)*10),bold:!!opts.bold,color:opts.color||ink})],spacing:{before:opts.before||0,after:opts.after??110},keepNext:!!opts.keepNext});
 children.push(line('ESCUELA HÉCTOR VALENZUELA CEA · EPJA',{bold:true,color:main,size:20,after:260}));
 children.push(new Paragraph({text:material.titulo||'Material educativo',heading:HeadingLevel.TITLE,spacing:{after:220},keepNext:true}));
 children.push(line([material.asignatura,material.nivel,material.temaEspecifico].filter(Boolean).join(' · '),{color:main,after:260}));
 for(const block of blocks){
  if(block.path==='titulo'||(block===blocks[0]&&block.title===material.titulo))continue;
  if(block.kind==='option'){children.push(line(block.title+' '+block.text,{after:115}));continue;}
  children.push(new Paragraph({text:block.title,heading:HeadingLevel.HEADING_2,spacing:{before:220,after:110},keepNext:true}));
  if(block.kind==='planning-moment'){for(const field of block.fields){children.push(line(field.title,{bold:true,color:main,keepNext:true,after:70}));for(const paragraph of field.text.split(/\n+/).filter(Boolean))children.push(line(paragraph,{after:140}));}continue;}
  for(const paragraph of String(block.text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)){
   children.push(line(paragraph,{after:140}));
  }
  if(!teacher&&/preguntaReflexion$|actividadesGuiadas\.\d+\.consigna$|actividadAutonoma\.consigna$/.test(block.path||'')){
   for(let j=0;j<3;j++)children.push(line('___________________________________________________________________',{size:19,color:'9A9A9A',after:155}));
  }
 }
 const doc=new Document({styles:{paragraphStyles:[{id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',run:{font:material.accesibilidadVisual?.fuente||'Arial',size:Math.max(visual.wordSize,28),bold:true,color:main},paragraph:{keepNext:true}},{id:'Title',name:'Title',basedOn:'Normal',next:'Normal',run:{font:material.accesibilidadVisual?.fuente||'Arial',size:Math.max(visual.wordSize+8,36),bold:true,color:main},paragraph:{keepNext:true}}],default:{document:{run:{font:material.accesibilidadVisual?.fuente||'Arial',size:visual.wordSize},paragraph:{spacing:{line:Math.round(240*(material.accesibilidadVisual?.interlineado||1.3))}}}}},sections:[{properties:{page:{margin:{top:1080,bottom:1080,left:1080,right:1080}}},children}]});
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
 if(measureContext){measureContext.font=size+'pt Aptos';return measureContext.measureText(String(value)).width*72/96;}
 return [...String(value)].reduce((n,c)=>n+(/[ilI.,:;!|' ]/.test(c)?.3:/[MW@#%]/.test(c)?.88:.57)*size,0);
}
function lineCount(value,width,size){const limit=width*72;let count=0;for(const paragraph of String(value).split('\n')){let used=0;count++;for(const word of paragraph.split(/\s+/).filter(Boolean)){const w=textWidth(word,size),gap=used?textWidth(' ',size):0;if(used&&used+gap+w>limit){count++;used=0;}if(w>limit){count+=Math.ceil(w/limit)-1;used=w%limit;}else used+= (used?gap:0)+w;}}return count;}
function fitsText(lines,width,height,size){return lineCount(lines.join('\n\n'),width,size)*size*1.28<=Math.max(0,height-.12)*72;}
function paginatePresentation(section,large=false){
 const size=large?26:23,activity=classifySlide(section.title,[],0)==='activity',height=activity?2.82:3.65,width=10.65;
 const source=slideText(section.text).split(/\n+/).map(x=>x.trim()).filter(Boolean),pieces=[];
 for(const paragraph of source){if(fitsText([paragraph],width,height,size)){pieces.push(paragraph);continue;}
  // Prefer sentence boundaries. Very long sentences continue at word boundaries.
  const sentences=paragraph.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)||[paragraph];let current='';
  for(const sentence of sentences){if(fitsText([current+(current?' ':'')+sentence.trim()],width,height,size)){current+=(current?' ':'')+sentence.trim();continue;}if(current){pieces.push(current);current='';}for(const word of sentence.trim().split(/\s+/)){if(current&&!fitsText([current+' '+word],width,height,size)){pieces.push(current);current='';}current+=(current?' ':'')+word;}}
  if(current)pieces.push(current);
 }
 const pages=[];let page=[];for(const piece of pieces){if(page.length&&!fitsText([...page,piece],width,height,size)){pages.push(page);page=[];}page.push(piece);}if(page.length)pages.push(page);return pages.length?pages:[['Contenido pendiente de desarrollar']];
}
function addChrome(ppt,theme,section,num,total){
 const slide=ppt.addSlide();slide.background={color:theme.background};
 slide.addShape(ppt.ShapeType.rect,{x:0,y:0,w:13.333,h:.16,line:{color:theme.main},fill:{color:theme.main}});
 slide.addShape(ppt.ShapeType.rect,{x:0,y:.16,w:.18,h:7.34,line:{color:theme.accent},fill:{color:theme.accent}});
 slide.addText('HEVA  /  EDUCACIÓN DE PERSONAS JÓVENES Y ADULTAS',{x:.72,y:.33,w:10.7,h:.25,fontSize:10,bold:true,color:theme.main,margin:0});
 slide.addShape(ppt.ShapeType.line,{x:.72,y:6.96,w:11.88,h:0,line:{color:'DDCDBE',width:1}});
 slide.addText('ESCUELA HÉCTOR VALENZUELA CEA · VILLARRICA',{x:.72,y:7.06,w:9.9,h:.18,fontSize:9,color:theme.ink,margin:0});
 slide.addText(String(num)+' / '+String(total),{x:11.45,y:7.04,w:1.1,h:.2,fontSize:10,color:theme.main,bold:true,align:'right',margin:0});
 return slide;
}
function classifySlide(title,lines,index){
 const t=title.toLowerCase();
 if(/selección múltiple|alternativa|opción\s+[a-d]/i.test(t))return 'question';
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
  return true;
 }
 if(kind==='process'||kind==='chronology'){
  const items=lines;if(!items.length||items.length>4||items.some(t=>!fitsText([t],(11.6-(items.length-1)*.16)/items.length-.46,1.98,26)))return false;
  tx(title,.8,.83,11.7,.9,31,theme.main,true);
  const n=items.length,w=(11.6-(n-1)*.16)/n;
  items.forEach((line,i)=>{const x=.86+i*(w+.16);shape(x,2.35,w,3.65,i%2?'F1E7DB':'FFFFFF');shape(x+.22,2.68,.68,.68,theme.main);tx(String(i+1),x+.28,2.74,.54,.5,21,'FFFFFF',true);tx(line.replace(/^\s*\d+[.)]\s*/,''),x+.23,3.58,w-.46,1.98,n>=4?17:20);if(i<n-1)tx('→',x+w-.03,3.13,.3,.35,17,theme.accent,true)});
  return true;
 }
 return false;
}
function drawBalance(ppt,theme,slide){
 const line=(x,y,w,h,width=2)=>slide.addShape(ppt.ShapeType.line,{x,y,w,h,line:{color:theme.main,width}});
 line(6.6,3.1,0,2.2,3);line(4.1,3.3,5,0,3);line(5.15,3.3,0,1.0);line(8.05,3.3,0,1.0);
 line(4.3,4.35,1.7,0);line(7.2,4.35,1.7,0);line(5.75,5.35,1.7,0,3);
 slide.addText('MISMA OPERACIÓN EN AMBOS LADOS',{x:3.1,y:5.63,w:7,h:.45,fontSize:18,bold:true,color:theme.main,align:'center',margin:0});
}
function addContent(ppt,theme,slide,title,lines,section,index=0){
 if(drawSemanticVisual(ppt,theme,slide,title,lines))return;
 const kind=classifySlide(title,lines,index),rect=(x,y,w,h,color)=>slide.addShape(ppt.ShapeType.rect,{x,y,w,h,line:{color,transparency:100},fill:{color}});
 const text=(value,x,y,w,h,size,color,bold=false,extra={})=>slide.addText(String(value),{x,y,w,h,fontFace:bold?'Aptos Display':'Aptos',fontSize:size,color,bold,margin:0,breakLine:false,valign:'mid',fit:'shrink',...extra});
 const clean=lines.map(x=>x.replace(/^[-•]\s*/,'').trim()).filter(Boolean);
 let titleSize=title.length>65?27:33;while(titleSize>20&&!fitsText([title],11.75,1.08,titleSize))titleSize--;text(title,.78,.85,11.75,1.08,titleSize,theme.main,true);
 if(kind==='question'){
  rect(.8,2.12,11.73,4.45,'FFFFFF');rect(.8,2.12,.13,4.45,theme.accent);
  text(clean.join('\n\n'),1.25,2.45,10.8,3.78,21,theme.ink,false,{valign:'top'});
 }else if(kind==='activity'){
  rect(.8,2.12,11.73,4.45,theme.main);rect(1.18,2.5,1.15,.09,theme.accent);
  text('ACTIVIDAD DE APLICACIÓN',1.18,2.73,10.6,.38,16,'FFE2BE',true);
  text(clean.join('\n\n'),1.18,3.3,10.7,2.82,23,'FFFFFF',false,{valign:'top'});
 }else if(kind==='compare'&&clean.length>=2&&clean.every(t=>fitsText([t],5.02,1.35,26))){
  const marker=clean.findIndex((x,i)=>i>0&&/^(Método\s*B|Opción\s*B|Segunda|En cambio|Por otro lado)/i.test(x));
  const mid=marker>0?marker:Math.ceil(clean.length/2);
  [clean.slice(0,mid),clean.slice(mid)].forEach((part,j)=>{
   const x=.8+j*6;rect(x,2.15,5.73,4.35,j?'E9E2D8':'F7EBDD');rect(x,2.15,5.73,.12,j?theme.accent:theme.main);
   text(j?'SEGUNDA PERSPECTIVA':'PRIMERA PERSPECTIVA',x+.32,2.55,5.05,.38,15,theme.main,true);
   text(part.join('\n\n'),x+.32,3.15,5.02,2.88,20,theme.ink,false,{valign:'top'});
  });
 }else if(kind==='timeline'&&clean.length>=2&&clean.length<=5&&clean.every(t=>fitsText([t],10.65,.64,26))){
  rect(1.06,2.3,.07,3.95,theme.accent);
  clean.slice(0,5).forEach((line,j)=>{const y=2.3+j*.79;rect(.96,y+.15,.27,.27,theme.main);text(line,1.5,y,10.65,.64,20,theme.ink)});
 }else if(kind==='cards'&&clean.length>=2&&clean.length<=4&&clean.every(t=>fitsText([t],5.2,1.4,26))){
  const items=clean.slice(0,4),cols=items.length<=2?items.length:2,rows=Math.ceil(items.length/cols),gap=.16;
  const w=(11.7-gap*(cols-1))/cols,h=(4.45-gap*(rows-1))/rows;
  items.forEach((line,j)=>{const x=.82+(j%cols)*(w+gap),y=2.13+Math.floor(j/cols)*(h+gap);
   rect(x,y,w,h,j%2?'F1E7DB':'FFFFFF');rect(x,y,.085,h,theme.accent);
   text(String(j+1).padStart(2,'0'),x+.25,y+.16,.64,.38,15,theme.main,true);
   text(line,x+.26,y+.59,w-.52,h-.74,items.length>4?17:20,theme.ink,false,{valign:'top'});
  });
 }else if(kind==='feature'){
  rect(.8,2.13,4.1,4.4,theme.main);text(String(index+1).padStart(2,'0'),1.2,3.12,3.3,1.6,76,'FFFFFF',true);
  rect(5.1,2.13,7.42,4.4,'FFFFFF');
  text(clean.join('\n\n'),5.46,2.52,6.7,3.55,22,theme.ink,false,{valign:'top'});
 }else{
  rect(.8,2.13,11.73,4.4,'FFFFFF');rect(.8,2.13,.13,4.4,theme.accent);
  if(/balanza/i.test(title)&&clean.join(' ').length<180){drawBalance(ppt,theme,slide);text(clean.join('\n\n'),1.3,2.38,10.65,.7,20,theme.ink,false,{valign:'top'});}else{  text(clean.join('\n\n'),1.3,2.48,10.65,3.65,23,theme.ink,false,{valign:'top'});}
 }
}
function presentationPages(material,teacher=false){
 const visual=root.HEVATemplates.layout(material);
 const isPresentation=String(material.tipoMaterial||m.tipoMaterial||'').toUpperCase()==='PRESENTACION'&&Array.isArray(material.diapositivas)&&material.diapositivas.length>0;
 let sections=[];
 if(isPresentation){
  sections=material.diapositivas.map((d,i)=>({title:d.titulo||'Diapositiva '+(i+1),text:slideText(d.contenido),kind:'slide',notes:d.notasDocente||''}));
 }else{
  let blocks=[];HEVA.blocks(material,teacher).forEach(item=>{let prev=blocks.at(-1);if(item.kind==='option'&&prev?.group===item.group)prev.text+='\n'+item.title+' '+item.text;else blocks.push({...item})});
  sections=blocks.map(item=>({title:item.title,text:slideText(item.text),kind:item.kind||'section'}));
 }
 const story=root.HEVAPedagogy?.newsText(material);if(isPresentation&&story)sections.unshift({title:'Noticia didáctica · SIMULADA',text:story,kind:'resource'});
 const pages=sections.flatMap((section,index)=>{
  // Keep a complete multiple-choice question and its alternatives together.
  const isQuestion=/selección múltiple|alternativa|pregunta\s*\d+/i.test(section.title);
  const maxChars=isQuestion?1500:850;
  return (isPresentation?paginatePresentation(section,visual.large):chunksOf(section.text,maxChars,isQuestion?12:5)).map((lines,part)=>({...section,lines,title:section.title+(part?' · continuación':'')}));
 });
 const used=new Map();for(const page of pages){const key=page.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();const n=(used.get(key)||0)+1;used.set(key,n);if(n>1)page.title+=' ('+n+')';}
 const news=material.fuentesDocumentales?.noticias?.items||[];
 if(isPresentation&&news.length){const source={title:'Fuentes de noticias consultadas',kind:'sources',text:news.map(n=>n.publisher+' · '+String(n.publishedAt||'').slice(0,10)+' · '+n.title+'\n'+n.url).join('\n')};paginatePresentation(source,visual.large).forEach((lines,i)=>pages.push({...source,lines,title:source.title+(i?' · continuación':'')}));}
 return pages;
}
function renderCover(ppt,theme,material,total){
 const cover=addChrome(ppt,theme,'Portada',1,total);
 cover.addShape(ppt.ShapeType.rect,{x:.75,y:1.15,w:11.85,h:4.95,line:{color:theme.main,transparency:100},fill:{color:theme.main}});
 cover.addShape(ppt.ShapeType.rect,{x:1.08,y:1.57,w:1.25,h:.09,line:{color:theme.accent},fill:{color:theme.accent}});
 cover.addText(String(material.titulo||'Presentación educativa'),{x:1.08,y:1.95,w:10.7,h:2.15,fontFace:'Aptos Display',fontSize:Math.max(22,Math.min(38,material.titulo?.length>100?28:38)),bold:true,color:'FFFFFF',margin:0,breakLine:false,valign:'mid',fit:'shrink'});
 cover.addText([material.asignatura,material.nivel,material.temaEspecifico].filter(Boolean).join('  ·  '),{x:1.1,y:4.55,w:10.6,h:.75,fontSize:18,color:'FFF0E0',margin:0,fit:'shrink'});
 cover.addText('HEVA VISUAL · MOTOR 2026.11',{x:1.1,y:5.57,w:5.8,h:.26,fontSize:10,color:'FFFFFF',margin:0});
}
// Preview records exactly the shapes and text boxes used by the PPTX renderer.
function preview(m,teacher=false){
 const material=HEVA.material(m),visual=root.HEVATemplates.layout(material),pages=presentationPages(material,teacher),record=[];
 const ppt={ShapeType:{rect:'rect',roundRect:'roundRect',line:'line'},addSlide(){const page={elements:[],background:{color:visual.theme.background}};record.push(page);return Object.defineProperties({addShape:(shape,options)=>page.elements.push({kind:'shape',shape,...options}),addText:(text,options)=>page.elements.push({kind:'text',text:String(text),...options}),addNotes:()=>{}},{background:{set(v){page.background=v}}});}};
 renderCover(ppt,visual.theme,material,pages.length+1);
 pages.forEach((page,i)=>{const slide=addChrome(ppt,visual.theme,page.kind,i+2,pages.length+1);if(visual.large){const add=slide.addText;slide.addText=(text,options)=>add(text,{...options,fontSize:Math.max(26,options.fontSize||26)});}addContent(ppt,visual.theme,slide,page.title,page.lines,page.kind,i);});
 return {pages:record,width:13.333,height:7.5,limitation:'Comparte paginación y geometría con PPTX. Las fuentes y saltos de línea pueden variar en PowerPoint; comprobar el archivo final.'};
}
async function powerpoint(m,teacher=false){
 if(!root.PptxGenJS)throw Error('No se cargó el exportador PowerPoint. Recarga la página.');
 const material=HEVA.material(m),visual=root.HEVATemplates.layout(material),theme=visual.theme;
 const ppt=new root.PptxGenJS();ppt.layout='LAYOUT_WIDE';ppt.author='Escuela Héctor Valenzuela CEA';ppt.subject=material.objetivoAprendizaje||'';ppt.title=material.titulo;
 ppt.lang='es-CL';ppt.theme={headFontFace:'Aptos Display',bodyFontFace:'Aptos',lang:'es-CL'};
 const pages=presentationPages(material,teacher);
 const total=pages.length+1;
 renderCover(ppt,theme,material,total);
 pages.forEach((page,i)=>{const slide=addChrome(ppt,theme,page.kind,i+2,total);if(visual.large){const originalAddText=slide.addText.bind(slide);slide.addText=(text,options)=>originalAddText(text,{...options,fontSize:Math.max(26,options.fontSize||26)});}addContent(ppt,theme,slide,page.title,page.lines,page.kind,i);if(page.notes&&typeof slide.addNotes==='function')slide.addNotes(page.notes)});
 await ppt.writeFile({fileName:safeName(material.titulo)+(teacher?'_docente':'_estudiante')+'.pptx'});return ppt;
}

function auditExport(m,teacher=false){
 const material=HEVA.material(m),blocks=HEVA.blocks(material,teacher),issues=[];
 const text=blocks.map(b=>String(b.text||'')).join('\n');
 const slides=blocks.reduce((n,b)=>n+chunksOf(b.text,/selección múltiple/i.test(b.title)?1500:850,5).length,1);
 if(slides>35)issues.push({level:'warning',code:'PPT_EXTENSO',detail:'La conversión podría producir '+slides+' diapositivas. Revise la necesidad de cada sección; no se recorta contenido.'});
 if(/(?:Paso\s*\d+\s*:\s*Paso\s*\d+)/i.test(text))issues.push({level:'warning',code:'PASO_REPETIDO',detail:'Se detectó una etiqueta de paso duplicada en el contenido original.'});
 if(/(?:imagin(?:e|ar)|visualic(?:e|ar))\s+(?:una\s+)?balanza/i.test(text))issues.push({level:'info',code:'BALANZA_VISUAL',detail:'Conviene acompañar la metáfora de la balanza con un diagrama.'});
 if(/evaluaci[oó]n|prueba/i.test(material.tipoMaterial||'')&&!/puntaje|puntos/i.test(text))issues.push({level:'warning',code:'SIN_PUNTAJE',detail:'No se identificó un puntaje explícito en la evaluación.'});
 if(/(?:Caso\s*\d+|pregunta\s*\d+)/i.test(text)&&/\b2\s*puntos\b/i.test(text)&&/justific|comprob|represent|resuelv/i.test(text))issues.push({level:'info',code:'REVISAR_RUBRICA',detail:'Hay actividades de varios pasos con puntajes bajos; verifique la rúbrica y el desglose.'});
 return {estimatedSlides:slides,issues,wordAndPowerpointShareContent:true};
}
root.HEVAOffice={word,powerpoint,download,auditExport,preview,presentationPages,paginatePresentation,classifySlide};})(typeof globalThis!=='undefined'?globalThis:this);
