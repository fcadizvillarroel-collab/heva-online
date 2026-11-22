'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('../lib/oa-textbook-matrix.cjs');
const Didactic=require('../lib/oa-textbook-didactic-scaffold.cjs');
const Bridge=require('../lib/oa-pedagogical-bridge.cjs');
const plan={
 tipoMaterial:'PLANIFICACION',asignatura:'Estudios Sociales',nivel:'I Nivel Medio',
 marcoCurricular:'Bases Curriculares EPJA 2024',
 objetivoAprendizaje:'Analizar causas y consecuencias de los procesos históricos que transformaron a la sociedad chilena.',
 temaEspecifico:'Revolución Industrial',usarTextosEscolares:true
};
const digest='a'.repeat(64);
const original={documents:[{id:'EPJA24',role:'curriculo',status:'consultada',title:'Bases EPJA',sha256:digest}],
 fragments:[{uso:'objetivo_literal',documentId:'EPJA24',id:'OA1',page:21,sha256:digest,
  url:'https://epja.mineduc.cl/fuente.pdf#page=21',text:plan.objetivoAprendizaje}]};
test('marcador uso objetivo_literal no acredita un OA si el extracto no coincide',()=>{
 const wrong={documents:original.documents,fragments:[{...original.fragments[0],text:'Este texto no contiene el objetivo curricular que se busca.'}]};
 assert.equal(M.build(plan,{items:[]},wrong).verificacionOA.estado,'pendiente_cotejo_literal');
 const verified=M.build(plan,{items:[]},original);
 assert.equal(verified.verificacionOA.estado,'localizado_literalmente_en_pdf_epja');
 assert.equal(verified.verificacionOA.paginaPDF,21);
 const alteredHash={documents:original.documents,fragments:[{...original.fragments[0],sha256:'b'.repeat(64)}]};
 assert.equal(M.build(plan,{items:[]},alteredHash).verificacionOA.estado,'pendiente_cotejo_literal');
 const noUrl={documents:original.documents,fragments:[{...original.fragments[0],url:'http://ejemplo.cl/oa.pdf'}]};
 assert.equal(M.build(plan,{items:[]},noUrl).verificacionOA.estado,'pendiente_cotejo_literal');
});
test('propuesta de 90 minutos documenta solo estructura pedagógica de fuente inspeccionada',()=>{
 const result=Didactic.plan90(plan);
 assert.equal(result.etapas.length,5);
 assert.deepEqual(result.etapas.map(x=>x.minutos),[10,20,25,20,15]);
 assert.equal(result.etapas.reduce((n,x)=>n+x.minutos,0),90);
 assert.deepEqual(result.fuente.paginasImpresas,[6,7]);
 assert.deepEqual(result.fuente.paginasPDF,[8,9]);
 assert.match(result.validacion,/pendiente_revision_docente/);
 assert.match(Didactic.prompt(result),/no en una lección leída/);
});
test('metodología del texto regular solo se usa cuando se activaron textos y en Sociales',()=>{
 assert.equal(Didactic.plan90({...plan,usarTextosEscolares:false}),null);
 assert.equal(Didactic.plan90({...plan,asignatura:'Matemática'}),null);
 const bridge=Bridge.build(plan,{registros:[]});
 assert.equal(bridge.secuenciaDocumentada90.tiempoTotalMinutos,90);
 assert.match(Bridge.instructions(bridge),/PATRÓN DIDÁCTICO DOCUMENTADO/);
 const other=Bridge.build({...plan,asignatura:'Matemática'},{registros:[]});
 assert.equal(other.secuenciaDocumentada90,null);
 assert.doesNotMatch(Bridge.instructions(other),/PATRÓN DIDÁCTICO DOCUMENTADO/);
});
test('la interfaz muestra distribución horaria, originalidad y ausencia de aprobación docente',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../heva-teacher-ui.js'),'utf8');
 assert.match(ui,/Propuesta didáctica de/);
 assert.match(ui,/No demuestra que se hayan revisado capítulos completos/);
 const source=fs.readFileSync(path.join(__dirname,'../lib/oa-textbook-didactic-scaffold.cjs'),'utf8');
 assert.match(source,/NO contenido de las lecciones no incluidas/);
});
