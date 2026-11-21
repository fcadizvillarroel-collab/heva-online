const test=require('node:test');
const assert=require('node:assert/strict');
const TP=require('../lib/tp-metal-international.cjs');
const norm=(temaEspecifico,asignatura='Construcciones Metálicas')=>({asignatura,temaEspecifico,objetivoAprendizaje:'Objetivo seleccionado por el docente',tipoMaterial:'GUIA'});
test('Fuentes oficiales por países y dominios preautorizados',()=>{
 assert.equal(TP.sources.length,5);
 assert.ok(TP.sources.every(x=>TP.allowed.has(x.url)&&x.country!=='CL'));
 assert.equal(TP.chile.modules.length,9);
});
test('Tema soldadura ofrece módulo chileno y referencias extranjeras de unión',()=>{
 const a=TP.bibliography(norm('Tipos de soldadura SMAW, GMAW y GTAW'));
 assert.equal(a.aplica,true);
 assert.ok(a.modules.some(x=>x.id==='M05'));
 assert.ok(a.sources.some(x=>x.country==='ES'));
 assert.ok(a.sources.some(x=>x.country==='CO'));
 assert.ok(a.sources.some(x=>x.country==='EC'));
 assert.ok(a.sources.every(x=>x.country==='CL'||x.estado==='fuente_indice_verificada_contenido_no_recuperado'));
 assert.match(TP.prompt(a),/PROPUESTAS DIDÁCTICAS ORIGINALES/);
 assert.match(TP.prompt(a),/NO constituye homologación/);
});
test('Planos no hereda equivocadamente soldadura ni parámetros operativos',()=>{
 const a=TP.bibliography(norm('Lectura de planos CAD, escala y simbología'));
 assert.ok(a.modules.some(x=>x.id==='M01'));
 assert.ok(!a.modules.some(x=>x.id==='M05'));
 assert.ok(!a.sources.some(x=>x.id==='MX_CONALEP_SOLD'));
});
test('Otro ramo y un tema genérico no reciben referencias extranjeras técnicas',()=>{
 const a=TP.bibliography(norm('Revolución Industrial','Estudios Sociales'));
 assert.equal(a.aplica,false);
 assert.deepEqual(a.sources,[]);
 const b=TP.bibliography(norm('Historia de la humanidad'));
 assert.equal(b.modules.length,0);
 assert.equal(b.sources.length,1);
});
test('Se puede omitir bibliografía extranjera sin perder referencia chilena',()=>{
 const a=TP.bibliography(norm('Soldadura'),{includeForeign:false});
 assert.equal(a.sources.length,1);
 assert.equal(a.sources[0].country,'CL');
});
test('Propuestas técnicas incluyen seguridad y recursos visuales sin parámetros inventados',()=>{
 const a=TP.activityIdeas.M05;
 assert.ok(a.concepts.join(' ').includes('EPP'));
 assert.ok(a.tasks.some(x=>x.includes('riesgos')));
 assert.ok(a.visual.includes('Esquemas'));
});
test('Rutas de generación directa y por bloques usan el banco técnico',()=>{
 const fs=require('node:fs'),path=require('node:path');
 for(const pathName of ['api/generate.js','api/recover.js']){
  const s=fs.readFileSync(path.join(__dirname,'..',pathName),'utf8');
  assert.match(s,/TPInternational\.bibliography\(plan\)/);
  assert.match(s,/TPInternational\.prompt\(referenciasMetalmecanica\)/);
  assert.match(s,/material\.referenciasMetalmecanica=referenciasMetalmecanica/);
 }
});
