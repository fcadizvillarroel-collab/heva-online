const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const T=require('../heva-templates.js');
const D=require('../heva-slide-design.js');
const office=fs.readFileSync(path.join(__dirname,'../heva-office.js'),'utf8');
const root={HEVATemplates:T,HEVASlideDesign:D,HEVAVisualAssets:{},HEVAContextAssets:{}};
new Function('globalThis','HEVA',office)(root,{material:m=>m,blocks:()=>[]});
const sample=theme=>({tipoMaterial:'PRESENTACION',plantillaVisual:theme,asignatura:'Lenguaje y Comunicación',nivel:'III Nivel Básico',titulo:'Registro formal e informal',diapositivas:[
 {titulo:'Características principales',funcion:'explicación',contenido:['Destinatario y contexto: cómo cambia el trato.','Mensaje y propósito: expresar la idea.','Registro y adecuación: escoger recursos lingüísticos.'],notasDocente:'Mostrar ejemplos.'},
 {titulo:'Formal versus informal',funcion:'explicación',contenido:['Formal: Solicito su atención.','Informal: Hola, ¿cómo estás?'],notasDocente:'Comparar.'}
]});
test('Cada estilo visual tiene nombre, acento, fondo y tipografía propios',()=>{
 const themes=['azul','gemini_calido','editorial_calido'].map(x=>T.layout(sample(x)).theme);
 assert.equal(new Set(themes.map(x=>x.main)).size,3);
 assert.equal(new Set(themes.map(x=>x.background)).size,3);
 assert.ok(themes.every(x=>x.font&&x.soft&&x.accent));
});
test('Los tres temas construyen diapositivas compuestas y no sólo texto plano',()=>{
 for(const name of ['azul','gemini_calido','editorial_calido']){
  const preview=root.HEVAOffice.preview(sample(name));
  assert.ok(preview.pages.length>=3);
  assert.ok(preview.visualSummary.composedPages>=2,name);
  assert.ok(preview.visualSummary.cardPages>=1,name);
 }
});
test('Selección automática usa asignatura y permite elección explícita',()=>{
 assert.equal(T.choose(sample('editorial_calido')),'editorial_calido');
 assert.equal(T.choose({...sample('auto'),asignatura:'Educación Matemática'}),'azul');
 assert.equal(T.choose({...sample('auto'),asignatura:'Lenguaje y Comunicación'}),'editorial_calido');
});
test('Diagrama de registro oral no utiliza seguridad de Construcciones Metálicas',()=>{
 const diagram=D.diagramPlan({title:'Registro formal versus informal',text:'Comunicación oral'},'Lenguaje y Comunicación','registro formal e informal');
 assert.deepEqual(diagram.labels,['SITUACIÓN','DESTINATARIO','REGISTRO']);
 assert.doesNotMatch(JSON.stringify(diagram),/EPP|soldadura|seguridad laboral/i);
});
