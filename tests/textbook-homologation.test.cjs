const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../lib/textbook-reference-catalog.cjs');
const history={asignatura:'Estudios Sociales',nivel:'I Nivel Medio',marcoCurricular:'Decreto 257',objetivoAprendizaje:'Analizar las consecuencias de la industrialización en la sociedad',temaEspecifico:'Industrialización y revolución industrial',usarTextosEscolares:true};
test('Catálogo desactivado por defecto no incorpora fuentes ni inventa libros',()=>{
 const r=M.recommendations({...history,usarTextosEscolares:false});
 assert.equal(r.enabled,false);assert.equal(r.items.length,0);
});
test('Historia compatible produce ficha ministerial pero ninguna cita inventada',()=>{
 const r=M.recommendations(history);
 assert.equal(r.status,'candidata_por_tema_oa_pendiente_libro_y_pagina');
 assert.ok(r.items.some(x=>x.url.includes('aprendoenlinea.mineduc.gob.cl/recursos/historia-')));
 assert.ok(r.items.every(x=>!x.page&&!x.excerpt));
 assert.match(M.instruction(r),/No atribuyas definiciones, imágenes, citas, páginas/);
});
test('OA y tema sin coincidencia no se homologan por el solo nombre de la asignatura',()=>{
 const r=M.recommendations({...history,objetivoAprendizaje:'Evaluar la participación ciudadana',temaEspecifico:'Industrialización'});
 assert.equal(r.items.length,0);assert.equal(r.status,'pendiente_homologacion_docente');
});
test('Formación técnico profesional no se mezcla con libros generales por grado',()=>{
 const r=M.recommendations({...history,asignatura:'Construcciones Metálicas',temaEspecifico:'Tipos de soldadura',objetivoAprendizaje:'Aplicar los tipos de soldadura'});
 assert.equal(r.items.length,0);
});
test('No se toma 7.º básico regular como OA o nivel EPJA oficial',()=>{
 const r=M.recommendations({asignatura:'Matemática',nivel:'III Nivel Básico',objetivoAprendizaje:'Resolver ecuaciones lineales en la vida cotidiana',temaEspecifico:'Ecuaciones lineales',usarTextosEscolares:true});
 assert.ok(r.items.some(x=>x.title.includes('7.º básico')));
 assert.match(r.scope,/no constituye equivalencia curricular EPJA/);
});

test('El fragmento de muestra del texto escolar no se ofrece cuando no procede',()=>{
 const S=require('../lib/document-sources.cjs');
 const sample=S.registry.find(x=>x.id==='TEXTO_REG_HIST1_MUESTRA');
 assert.ok(sample);
 assert.ok(sample.url.startsWith('https://aprendoenlinea.mineduc.gob.cl/'));
 assert.equal(S.applicable(sample,{...history,usarTextosEscolares:false}),false);
 assert.equal(S.applicable(sample,{...history,usarTextosEscolares:true}),true);
 assert.equal(S.applicable(sample,{...history,asignatura:'Lenguaje y Comunicación',usarTextosEscolares:true}),false);
});
test('El código incluye la misma decisión tanto en generación directa como por bloques',()=>{
 const fs=require('node:fs'),path=require('node:path');
 for(const filename of ['api/generate.js','api/recover.js']){
  const code=fs.readFileSync(path.join(__dirname,'..',filename),'utf8');
  assert.match(code,/Textbooks\.recommendations\(plan\)/);
  assert.match(code,/textosEscolaresComplementarios/);
 }
});
