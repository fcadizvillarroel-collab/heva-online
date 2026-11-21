const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const HEVA=require('../heva-core.js');
const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'../catalogo-publicado.json'),'utf8'));
test('HEVA mantiene 407 registros curriculares sin editarlos',()=>assert.equal(rows.length,407));
test('alias Convivencia Social y Ciudadanía conserva nueve objetivos',()=>{
 const list=HEVA.catalog(rows,{marco:'DECRETO_257_2009',nivel:'II_MEDIO_TP',asignatura:'Convivencia Social y Ciudadanía'});
 assert.ok(list.length>0,'Debe recuperar al menos un objetivo');
 assert.ok(list.every(o=>/convivencia social/i.test(o.asignatura)));
});
test('alias Tecnología de la Información recupera objetivos correspondientes',()=>{
 const list=HEVA.catalog(rows,{marco:'DECRETO_257_2009',nivel:'I_MEDIO_TP',asignatura:'Tecnologías de la Información (TIC)'});
 assert.ok(list.length>0,'Debe recuperar objetivos del catálogo con su denominación oficial');
});
test('Gemini transmite credencial en cabecera, no en URL',()=>{
 const file=fs.readFileSync(path.join(__dirname,'../api/_providers.cjs'),'utf8');
 assert.match(file,/x-goog-api-key/);
 assert.doesNotMatch(file,/:generateContent\?key=/);
});
test('Cargador de UI incluye rescate local y referencias TP',()=>{
 const file=fs.readFileSync(path.join(__dirname,'../heva-ui.js'),'utf8');
 assert.match(file,/catalogo-publicado\.json/);
 assert.match(file,/objetivosConstruccionesMetalicas/);
 assert.match(file,/finally\{if\(serial===catalogRequest\)sel\.disabled=false\}/);
});
test('Los elementos DOCX tienen shading válido y lineRule automático',()=>{
 for(const name of ['heva-office.js','heva-guide-visuals.js']){
 const data=fs.readFileSync(path.join(__dirname,'..',name),'utf8');
 assert.doesNotMatch(data,/shading:\{fill/);
 }
 const office=fs.readFileSync(path.join(__dirname,'../heva-office.js'),'utf8');
 assert.match(office,/lineRule:'auto'/);
});
