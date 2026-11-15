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

function renderDeck(material){
 const slides=[];
 class Deck{constructor(){this.ShapeType={rect:'rect',line:'line',roundRect:'roundRect'}}addSlide(){const slide={texts:[],addText(t){this.texts.push(String(t))},addShape(){},addNotes(){}};slides.push(slide);return slide}async writeFile(){}}
 const context={HEVA:{material:m=>m,blocks:m=>m.blocks||[]},HEVATemplates:{layout:()=>({theme:{main:'8B2635',accent:'C77638',background:'FFF7ED',ink:'302723'}})},PptxGenJS:Deck};
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
