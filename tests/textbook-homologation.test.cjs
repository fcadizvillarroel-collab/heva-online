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
