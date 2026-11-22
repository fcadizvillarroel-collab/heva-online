'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Pilot=require('../lib/textbook-verified-index-pilot.cjs');
const Matrix=require('../lib/oa-textbook-matrix.cjs');
const root=path.join(__dirname,'..');
const plan={asignatura:'Estudios Sociales',nivel:'I Nivel Medio',marcoCurricular:'Bases Curriculares EPJA 2024',objetivoAprendizaje:'Analizar elementos de continuidad y cambio entre periodos y procesos',temaEspecifico:'Guerra del Pacífico y ocupación de la Araucanía',usarTextosEscolares:true};
test('el índice oficial UCE provee exactamente 13 pistas de temas regulares documentados, nunca homologados',()=>{
 assert.equal(Pilot.mapping.length,13);
 assert.equal(new Set(Pilot.mapping.map(x=>x.regularOA)).size,13);
 assert.ok(Pilot.mapping.every(x=>x.indexPage>=176&&x.indexPage<=178));
 assert.ok(Pilot.mapping.every(x=>x.printed&&x.unit&&x.lesson));
});
test('identifica páginas concretas indicadas para Guerra del Pacífico y ocupación de Araucanía, pero no páginas inspeccionadas',()=>{
 const candidates=Pilot.candidates(plan);
 assert.equal(candidates.length,2);
 const byOA=Object.fromEntries(candidates.map(x=>[x.oaRegular,x]));
 assert.equal(byOA['HI1M OA 14'].paginasTEIndicadas,'160 a 167, 174');
 assert.equal(byOA['HI1M OA 15'].paginasTEIndicadas,'168, 169, 172 a 175');
 assert.equal(byOA['HI1M OA 14'].paginaPDF,null);
 assert.equal(byOA['HI1M OA 15'].paginaPDF,null);
 assert.equal(byOA['HI1M OA 14'].estado,'pagina_indicada_por_indice_oficial_no_inspeccionada');
});
test('la matriz no cuenta las páginas indicadas en índices como libros leídos ni citas reales',()=>{
 const matrix=Matrix.build(plan,{enabled:true,items:[]},{documents:[],fragments:[]});
 assert.equal(matrix.indicesConPaginasTE,2);
 assert.equal(matrix.fichasDeLibrosIdentificadas,3);
 assert.equal(matrix.cobertura.CL.fragmentosLibro,0);
 assert.equal(matrix.cobertura.MX.fragmentosLibro,0);
 assert.equal(matrix.estado,'indices_oficiales_con_paginas_te_pendientes_lectura');
 assert.equal(matrix.registros.filter(x=>x.tipo==='indice_paginas_texto_regular').length,2);
 assert.equal(matrix.registros.filter(x=>x.tipo==='ficha_libro_oficial').length,3);
 assert.equal(Matrix.linkActivities(matrix,[]).vinculosActividades.length,0);
 assert.match(Matrix.instruction(matrix),/páginas TE/);
});
test('no asigna páginas chilenas o libros mexicanos a otras asignaturas o temas sin coincidencia',()=>{
 const wrong=Matrix.build({...plan,asignatura:'Educación Matemática'},{enabled:true,items:[]},{documents:[],fragments:[]});
 assert.equal(wrong.indicesConPaginasTE,0);
 assert.equal(wrong.fichasDeLibrosIdentificadas,0);
 const off=Matrix.build({...plan,usarTextosEscolares:false},{enabled:true,items:[]},{documents:[],fragments:[]});
 assert.equal(off.registros.length,0);
 const mismatch=Matrix.build({...plan,temaEspecifico:'Civilizaciones de la antigüedad'},{enabled:true,items:[]},{documents:[],fragments:[]});
 assert.equal(mismatch.indicesConPaginasTE,0);
 assert.equal(mismatch.fichasDeLibrosIdentificadas,3,'Las fichas sociales SEP se localizan por asignatura; no afirman concordancia temática');
});
test('ficha SEP 2026–2027 enlaza el libro exacto, pero no proporciona contenidos ni páginas',()=>{
 const mx=Pilot.mexicoBook();
 assert.equal(mx.pais,'MX');
 assert.equal(mx.ciclo,'2026–2027');
 assert.match(mx.visor,/ciclo=2026&clave=S1ETA/);
 assert.equal(mx.paginaPDF,null);
 assert.equal(mx.capitulo,null);
 assert.equal(mx.fragmentoId,null);
});
test('la interfaz separa índice regular de páginas PDF efectivamente recuperadas',()=>{
 const txt=fs.readFileSync(path.join(root,'heva-teacher-ui.js'),'utf8');
 assert.match(txt,/Índices y fichas oficiales/);
 assert.match(txt,/no páginas PDF verificadas/);
 assert.match(txt,/Páginas TE indicadas/);
});
