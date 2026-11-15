(function(root){
const safeName=s=>s.replace(/[^\p{L}\p{N} -]/gu,'').slice(0,90)||'HEVA_material';
function download(blob,name){let a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
async function word(m,teacher=false){if(!root.docx)throw Error('No se cargó el exportador Word local. Recarga la página.');let visual=root.HEVATemplates.layout(m);let {Document,Packer,Paragraph,TextRun,HeadingLevel}=root.docx;let blocks=HEVA.blocks(HEVA.material(m),teacher);let children=[new Paragraph({children:[new TextRun({text:'ESCUELA HÉCTOR VALENZUELA · EPJA',bold:true,color:visual.theme.main})]})];blocks.forEach((b,i)=>{if(b.kind==='option'){children.push(new Paragraph({children:[new TextRun({text:b.title+' '+b.text,size:visual.wordSize})],spacing:{after:90}}));return}children.push(new Paragraph({heading:i===0?HeadingLevel.TITLE:HeadingLevel.HEADING_1,text:b.title}));b.text.split('\n').forEach(l=>children.push(new Paragraph({children:[new TextRun({text:l,size:visual.wordSize})],spacing:{after:140}})))});let blob=await Packer.toBlob(new Document({sections:[{properties:{},children}]}));download(blob,safeName(m.titulo)+(teacher?'_docente':'_estudiante')+'.docx');return blob}
function wrap(text,max=66){let out=[],line='';String(text).split('\n').forEach(par=>{par.split(/\s+/).forEach(w=>{if((line+' '+w).length>max){if(line)out.push(line);line=w}else line+=(line?' ':'')+w});out.push(line);line=''});return out}
function slideText(value){return (Array.isArray(value)?value.join('\n'):String(value??'')).replace(/\r/g,'').trim()}
function chunksOf(text,maxChars=450,maxLines=7){
 const paragraphs=slideText(text).split(/\n+/).map(x=>x.trim()).filter(Boolean);
 const lines=[];for(const paragraph of paragraphs){let words=paragraph.split(/\s+/),line='';for(const word of words){if((line+' '+word).trim().length>72&&line){lines.push(line);line=word}else line+=(line?' ':'')+word}if(line)lines.push(line)}
 const pages=[];let page=[],length=0;for(const line of lines){if(page.length&&(page.length>=maxLines||length+line.length>maxChars)){pages.push(page);page=[];length=0}page.push(line);length+=line.length}if(page.length)pages.push(page);return pages.length?pages:[['Contenido pendiente de desarrollar']];
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
 const t=(title+' '+lines.join(' ')).toLowerCase();
 if(/actividad|ejercicio|desafío|reflexión|pregunta|aplicación|debate/.test(t))return 'activity';
 if(/comparación|comparar|diferencias|versus|ventajas y desventajas/.test(t))return 'compare';
 if(/cronología|línea de tiempo|etapas|proceso histórico|evolución/.test(t))return 'timeline';
 if(/causas|consecuencias|factores|características|elementos/.test(t))return 'cards';
 return ['editorial','cards','feature'][index%3];
}
function addContent(ppt,theme,slide,title,lines,section,index=0){
 const kind=classifySlide(title,lines,index),rect=(x,y,w,h,color)=>slide.addShape(ppt.ShapeType.rect,{x,y,w,h,line:{color,transparency:100},fill:{color}});
 const text=(value,x,y,w,h,size,color,bold=false,extra={})=>slide.addText(String(value),{x,y,w,h,fontFace:bold?'Aptos Display':'Aptos',fontSize:size,color,bold,margin:0,breakLine:false,valign:'mid',fit:'shrink',...extra});
 const clean=lines.map(x=>x.replace(/^[-•]\s*/,'').trim()).filter(Boolean);
 text(title.slice(0,125),.78,.85,11.75,1.08,title.length>65?27:33,theme.main,true);
 if(kind==='activity'){
  rect(.8,2.12,11.73,4.45,theme.main);rect(1.18,2.5,1.15,.09,theme.accent);
  text('ACTIVIDAD DE APLICACIÓN',1.18,2.73,10.6,.38,16,'FFE2BE',true);
  text(clean.join('\n\n'),1.18,3.3,10.7,2.82,23,'FFFFFF',false,{valign:'top'});
 }else if(kind==='compare'&&clean.length>=2){
  const mid=Math.ceil(clean.length/2);
  [clean.slice(0,mid),clean.slice(mid)].forEach((part,j)=>{
   const x=.8+j*6;rect(x,2.15,5.73,4.35,j?'E9E2D8':'F7EBDD');rect(x,2.15,5.73,.12,j?theme.accent:theme.main);
   text(j?'SEGUNDA PERSPECTIVA':'PRIMERA PERSPECTIVA',x+.32,2.55,5.05,.38,15,theme.main,true);
   text(part.join('\n\n'),x+.32,3.15,5.02,2.88,20,theme.ink,false,{valign:'top'});
  });
 }else if(kind==='timeline'&&clean.length>=2){
  rect(1.06,2.3,.07,3.95,theme.accent);
  clean.slice(0,5).forEach((line,j)=>{const y=2.3+j*.79;rect(.96,y+.15,.27,.27,theme.main);text(line,1.5,y,10.65,.64,20,theme.ink)});
 }else if(kind==='cards'&&clean.length>=2){
  const items=clean.slice(0,6),cols=items.length<=3?items.length:2,rows=Math.ceil(items.length/cols),gap=.16;
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
  text(clean.join('\n\n'),1.3,2.48,10.65,3.65,23,theme.ink,false,{valign:'top'});
 }
}
async function powerpoint(m,teacher=false){
 if(!root.PptxGenJS)throw Error('No se cargó el exportador PowerPoint. Recarga la página.');
 const material=HEVA.material(m),visual=root.HEVATemplates.layout(material),theme=visual.theme;
 const ppt=new root.PptxGenJS();ppt.layout='LAYOUT_WIDE';ppt.author='Escuela Héctor Valenzuela CEA';ppt.subject=material.objetivoAprendizaje||'';ppt.title=material.titulo;
 ppt.lang='es-CL';ppt.theme={headFontFace:'Aptos Display',bodyFontFace:'Aptos',lang:'es-CL'};
 const isPresentation=material.tipoMaterial==='PRESENTACION'&&material.diapositivas.length>0;
 let sections=[];
 if(isPresentation){
  sections=material.diapositivas.map((d,i)=>({title:d.titulo||'Diapositiva '+(i+1),text:slideText(d.contenido),kind:'slide'}));
 }else{
  let blocks=[];HEVA.blocks(material,teacher).forEach(item=>{let prev=blocks.at(-1);if(item.kind==='option'&&prev?.group===item.group)prev.text+='\n'+item.title+' '+item.text;else blocks.push({...item})});
  sections=blocks.map(item=>({title:item.title,text:slideText(item.text),kind:item.kind||'section'}));
 }
 const pages=sections.flatMap((section,index)=>chunksOf(section.text).map((lines,part)=>({...section,lines,title:section.title+(part?' · continuación':'')})));
 const total=pages.length+1;
 let cover=addChrome(ppt,theme,'Portada',1,total);
 cover.addShape(ppt.ShapeType.rect,{x:.75,y:1.15,w:11.85,h:4.95,line:{color:theme.main,transparency:100},fill:{color:theme.main}});
 cover.addShape(ppt.ShapeType.rect,{x:1.08,y:1.57,w:1.25,h:.09,line:{color:theme.accent},fill:{color:theme.accent}});
 cover.addText(String(material.titulo||'Presentación educativa'),{x:1.08,y:1.95,w:10.7,h:2.15,fontFace:'Aptos Display',fontSize:38,bold:true,color:'FFFFFF',margin:0,breakLine:false,valign:'mid',fit:'shrink'});
 cover.addText([material.asignatura,material.nivel,material.temaEspecifico].filter(Boolean).join('  ·  '),{x:1.1,y:4.55,w:10.6,h:.75,fontSize:18,color:'FFF0E0',margin:0,fit:'shrink'});
 pages.forEach((page,i)=>{const slide=addChrome(ppt,theme,page.kind,i+2,total);addContent(ppt,theme,slide,page.title,page.lines,page.kind,i)});
 await ppt.writeFile({fileName:safeName(material.titulo)+(teacher?'_docente':'_estudiante')+'.pptx'});return ppt;
}

root.HEVAOffice={word,powerpoint,download};})(typeof globalThis!=='undefined'?globalThis:this);
