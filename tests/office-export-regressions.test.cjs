const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../heva-office.js'),'utf8');
function office(){
 const sandbox={HEVA:{material:m=>m,blocks:m=>m.blocks||[]},HEVATemplates:{layout:()=>({theme:{main:'8B2635',accent:'C77638',background:'FFF7ED',ink:'302723'},wordSize:26})}};
 sandbox.globalThis=sandbox;vm.runInNewContext(code,sandbox);return sandbox.HEVAOffice;
}
test('exporters and audit are available',()=>{const o=office();assert.equal(typeof o.word,'function');assert.equal(typeof o.powerpoint,'function');assert.equal(typeof o.auditExport,'function')});
test('assessment missing scoring is flagged',()=>{const result=office().auditExport({tipoMaterial:'EVALUACION',blocks:[{title:'Pregunta 1',text:'2x+4=12'}]});assert.ok(result.issues.some(x=>x.code==='SIN_PUNTAJE'))});
test('no invented warning for scored assessment',()=>{const result=office().auditExport({tipoMaterial:'EVALUACION',blocks:[{title:'Datos',text:'Puntaje total: 10 puntos'}]});assert.ok(!result.issues.some(x=>x.code==='SIN_PUNTAJE'))});
test('balance visual prompt is identified',()=>{const result=office().auditExport({tipoMaterial:'GUIA',blocks:[{title:'Explicación',text:'Imaginar una balanza para resolver la igualdad'}]});assert.ok(result.issues.some(x=>x.code==='BALANZA_VISUAL'))});

function renderDeck(material,large=false){
 const slides=[];
 class Deck{constructor(){this.ShapeType={rect:'rect',line:'line',roundRect:'roundRect'}}addSlide(){const slide={texts:[],boxes:[],addText(t,options){this.texts.push(String(t));this.boxes.push({text:String(t),...options})},addShape(){},addNotes(n){this.notes=n}};slides.push(slide);return slide}async writeFile(){}}
 const context={HEVA:{material:m=>m,blocks:m=>m.blocks||[]},HEVATemplates:{layout:()=>({large,theme:{main:'8B2635',accent:'C77638',background:'FFF7ED',ink:'302723'}})},PptxGenJS:Deck};
 vm.runInNewContext(code,context);
 return context.HEVAOffice.powerpoint(material).then(()=>slides);
}
test('PowerPoint preserves fifth card and fifth process step',async()=>{
 for(const title of ['Características','Procedimiento paso a paso']){
  const lines=Array.from({length:5},(_,i)=>`Paso ${i+1}: contenido completo número ${i+1}`);
  const slides=await renderDeck({titulo:'Prueba',tipoMaterial:'PRESENTACION',diapositivas:[{titulo:title,contenido:lines}]});
  const exported=slides.flatMap(s=>s.texts).join(' ');
  for(const line of lines)assert.ok(exported.includes(line),line);
 }
});
test('Convivencia Social is not classified as history',()=>{
 const audit=require('../experimental/subject-audit.cjs');
 assert.equal(audit.inspectAll({asignatura:'Convivencia Social'}).disciplina,'instrumental');
});

test('presentation exports teacher notes and real news provenance',async()=>{
 const slides=await renderDeck({titulo:'Clima',tipoMaterial:'PRESENTACION',diapositivas:[{titulo:'Evidencia',contenido:['Datos para analizar'],notasDocente:'Explicación y retroalimentación del docente'}],fuentesDocumentales:{noticias:{items:[{title:'Una noticia',publisher:'Noticias ONU',publishedAt:'2026-11-13T12:00:00Z',url:'https://news.un.org/es/story/123'}]}}});
 assert.ok(slides.some(s=>s.notes==='Explicación y retroalimentación del docente'));
 assert.ok(slides.some(s=>s.texts.join(' ').includes('Noticias ONU · 2026-11-13')));
});
test('dense presentation paragraphs paginate without losing content in normal and large print',async()=>{const phrase='Esta explicación conecta el concepto con una situación concreta y explica su significado.';const paragraph=Array.from({length:30},()=>phrase).join(' ');for(const large of [false,true]){const slides=await renderDeck({titulo:'Contenido extenso',tipoMaterial:'PRESENTACION',diapositivas:[{titulo:'Ejercicio de aplicación',contenido:[paragraph],notasDocente:'Criterios docentes'}]},large);assert.ok(slides.length>4);const text=slides.flatMap(s=>s.texts).join(' ');assert.equal(text.split(phrase).length-1,30);for(const box of slides.flatMap(s=>s.boxes)){assert.ok(box.y+box.h<=7.5);if(box.y>=3.2&&box.fontSize>=23)assert.ok(box.text.length<650);}}});
test('dense cards fall back to full-width reading instead of overflowing narrow boxes',async()=>{const text='Una explicación desarrollada del concepto con un ejemplo concreto para interpretar sus relaciones. '.repeat(4);const slides=await renderDeck({titulo:'Conceptos',tipoMaterial:'PRESENTACION',diapositivas:[{titulo:'Características',contenido:[text,text]}]});const body=slides.flatMap(s=>s.boxes).filter(b=>b.text.includes('Una explicación'));assert.ok(body.length>=2);assert.ok(body.every(b=>b.w>=10));});
