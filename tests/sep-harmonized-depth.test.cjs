const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const SEP=require('../lib/sep-textbook-catalog.cjs');
const Textbooks=require('../lib/textbook-reference-catalog.cjs');
const Deep=require('../heva-deep-materials.cjs');
const plan={asignatura:'Estudios Sociales',nivel:'I Nivel Medio',marcoCurricular:'Decreto 257',temaEspecifico:'La Revolución Industrial: industrialización y cambios sociales',objetivoAprendizaje:'Analizar las transformaciones de la industrialización en la sociedad',usarTextosEscolares:true,tipoMaterial:'GUIA'};
test('SEP: catálogos oficiales indexados; no es un PDF consultado',()=>{
 assert.match(SEP.SECONDARY,/^https:\/\/libros\.conaliteg\.gob\.mx/);
 const items=SEP.recommendations({enabled:true,subject:'sociales',topicMatched:true});
 assert.equal(items.length,1);
 assert.equal(items[0].role,'catalogo_oficial_extranjero');
 assert.equal(items[0].country,'MX');
 assert.equal(items[0].status,'indice_pendiente_verificacion_documento_y_pagina');
 assert.ok(!items[0].page&&!items[0].excerpt);
});
test('SEP: no correspondencia técnica automática con soldadura',()=>{
 assert.deepEqual(SEP.recommendations({enabled:true,subject:'tp_metal',topicMatched:true}),[]);
 assert.deepEqual(SEP.recommendations({enabled:false,subject:'sociales',topicMatched:true}),[]);
});
test('Armoniza catálogos de Chile y México pero conserva sus distinciones',()=>{
 const x=Textbooks.recommendations(plan);
 assert.equal(x.status,'candidata_por_tema_oa_pendiente_libro_y_pagina');
 assert.ok(x.items.some(y=>y.country==='MX'&&y.url===SEP.SECONDARY));
 assert.ok(x.items.some(y=>y.country!=='MX'));
 assert.match(Textbooks.instruction(x),/NO se ha leído el texto completo/);
 const off=Textbooks.recommendations({...plan,usarTextosEscolares:false});
 assert.equal(off.items.length,0);
 const unrelated=Textbooks.recommendations({...plan,temaEspecifico:'Transformaciones de la industria',objetivoAprendizaje:'Expresar oralmente ideas con coherencia'});
 assert.equal(unrelated.items.length,0);
});
test('Prompts profundos y estrategias idóneas de seis disciplinas',()=>{
 const checks=[
 ['Estudios Sociales','fuente auténtica'],
 ['Matemática','comprobación'],
 ['Lenguaje y Comunicación','oral'],
 ['Ciencias Naturales','hipótesis'],
 ['Inglés','diálogo'],
 ['Construcciones Metálicas','soldadura']
 ];
 for(const [asignatura,token] of checks){
  const p=Deep.guidance({...plan,asignatura});
  assert.match(p,/CANTIDADES|conteos globales/i);
  assert.ok(p.toLowerCase().includes(token),asignatura+' '+token);
 }
});
test('Evaluación no contiene solución y guía exige modelo y autonomía',()=>{
 assert.match(Deep.guidance({...plan,tipoMaterial:'EVALUACION'}),/no entregues ejemplo resuelto/);
 assert.match(Deep.guidance({...plan,tipoMaterial:'GUIA'}),/ejemplo guiado/);
 assert.match(Deep.guidance({...plan,tipoMaterial:'PRESENTACION'}),/diapositivas legibles/);
});
test('Revisión de profundidad es orientativa, no certificado de calidad',()=>{
 const issues=Deep.advisory({tipoMaterial:'GUIA',introduccionLectura:'Breve',actividadesGuiadas:[]},plan);
 assert.ok(issues.some(x=>x.code==='CONTENIDO_BREVE'));
 assert.ok(issues.some(x=>x.code==='MODELADO_INCOMPLETO'));
});
test('Tanto generación como recuperación incorporan la mejora',()=>{
 for(const file of ['api/generate.js','api/recover.js']){
  const s=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  assert.match(s,/DeepMaterials\.advisory/);
  assert.match(s,/Textbooks\.recommendations/);
 }
 const prompt=fs.readFileSync(path.join(__dirname,'../heva-pedagogy.js'),'utf8');
 assert.match(prompt,/heva-deep-materials\.cjs/);
});
