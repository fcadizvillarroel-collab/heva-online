const test=require('node:test'),assert=require('node:assert/strict');
const catalog=require('../catalogo-publicado.json');
const D=require('../heva-slide-design.js'),Q=require('../heva-quality-gate.js');
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const subjects=new Set(['consumo y calidad de vida','insercion laboral','filosofia','tecnologias de la informacion y de las telecomunicaciones','educacion artistica','lengua castellana y comunicacion','convivencia social','ciencias naturales','educacion matematica','educacion fisica y salud','artes visuales','pensamiento computacional','responsabilidad personal y social','educacion financiera','emprendimiento y empleabilidad','ingles','educacion ciudadana','historia, geografia y ciencias sociales','matematica','lenguaje y comunicacion','educacion fisica','idioma extranjero (ingles comunicativo)','estudios sociales','idioma extranjero ingles']);
test('the published curricular catalog has 407 individually addressable OAs',()=>{
 assert.equal(catalog.length,407);
 assert.equal(new Set(catalog.map(x=>x.clave_interna)).size,407);
 for(const oa of catalog){
  assert.ok(oa.texto_literal?.trim(),oa.clave_interna);
  assert.ok(oa.codigo_oficial?.trim(),oa.clave_interna);
  assert.ok(oa.marco?.trim(),oa.clave_interna);
  assert.ok(oa.nivel?.trim(),oa.clave_interna);
  assert.ok(oa.asignatura?.trim(),oa.clave_interna);
  assert.ok(oa.fuente_documento?.trim(),oa.clave_interna);
  assert.ok(subjects.has(normalize(oa.asignatura)),oa.asignatura);
 }
});
for(const oa of catalog)test('OA metadata and material audit: '+oa.clave_interna,()=>{
 const material={tipoMaterial:'GUIA',asignatura:oa.asignatura,nivel:oa.nivel,objetivoAprendizaje:oa.texto_literal,titulo:'Aplicación del OA',recursosVisualesHEVA:{imagenes:false,diagramas:false,graficos:false}};
 const sections=[{title:'Concepto',text:'Un concepto se define y explica porque es importante. Ejemplo: aplicación de la habilidad. Actividad: analiza y resuelve un caso.'}];
 const result=D.decorate(material,sections);
 assert.equal(result.length,1);
 assert.equal(result[0].image,null);
 const report=Q.inspect({material,sections,visuals:result});
 assert.ok(!report.issues.some(x=>x.code==='OA_NO_VISIBLE'),oa.clave_interna);
 assert.ok(!report.issues.some(x=>x.code==='VISUALES_AUSENTES'),oa.clave_interna);
 assert.ok(report.score>=0&&report.score<=100);
});
