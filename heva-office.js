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
function addContent(ppt,theme,slide,title,lines,section){
 const long=lines.join(' ').length>360;
 slide.addText(String(title).slice(0,125),{x:.73,y:.86,w:11.85,h:1.05,fontFace:'Aptos Display',fontSize:title.length>65?27:33,bold:true,color:theme.main,margin:0,breakLine:false,valign:'mid'});
 slide.addShape(ppt.ShapeType.rect,{x:.75,y:2.08,w:11.85,h:4.43,rectRadius:.14,radius:.14,line:{color:'E9DCCF',width:1},fill:{color:'FFFFFF'}});
 slide.addShape(ppt.ShapeType.rect,{x:.75,y:2.08,w:.1,h:4.43,line:{color:theme.accent},fill:{color:theme.accent}});
 const body=lines.map(line=>'•  '+line).join('\n\n');
 slide.addText(body,{x:1.1,y:2.36,w:11.05,h:3.88,fontFace:'Aptos',fontSize:long?20:23,color:theme.ink,margin:0,breakLine:false,valign:'top',paraSpaceAfterPt:8,fit:'shrink'});
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
 pages.forEach((page,i)=>{const slide=addChrome(ppt,theme,page.kind,i+2,total);addContent(ppt,theme,slide,page.title,page.lines,page.kind)});
 await ppt.writeFile({fileName:safeName(material.titulo)+(teacher?'_docente':'_estudiante')+'.pptx'});return ppt;
}

root.HEVAOffice={word,powerpoint,download};})(typeof globalThis!=='undefined'?globalThis:this);
