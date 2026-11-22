'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Index=require('../lib/textbook-verified-index-2medio.cjs');
const Matrix=require('../lib/oa-textbook-matrix.cjs');
const root=path.join(__dirname,'..');
const base={tipoMaterial:'GUIA',asignatura:'Estudios Sociales',marcoCurricular:'Bases Curriculares EPJA 2024',nivel:'II NM',
 objetivoAprendizaje:'Analizar procesos históricos y establecer relaciones entre acontecimientos',
 usarTextosEscolares:true};
test('14 entradas de Historia segundo medio reproducen OA, unidad, lección y páginas del índice UCE, sin inventar libro leído',()=>{
 assert.equal(Index.entries.length,14);
 assert.equal(new Set(Index.entries.map(x=>x.oa)).size,14);
 assert.ok(Index.entries.every(x=>[193,194,195].includes(x.pagIndice)&&x.paginas&&x.unidad&&x.leccion));
 const results=Index.chile({...base,temaEspecifico:'Guerra Fría y fin de la Guerra Fría'});
 assert.deepEqual(results.map(x=>x.oaRegular),['HI2M OA 08','HI2M OA 11']);
 assert.equal(results[0].paginasTEIndicadas,'84 a 99');
 assert.equal(results[1].paginasTEIndicadas,'112 a 119');
 assert.equal(results[0].paginaPDF,null);
 assert.equal(results[0].estado,'pagina_indicada_por_indice_oficial_no_inspeccionada');
});
test('ONU, posguerra y globalización se asignan a referencias distintas y no se equiparan al OA EPJA',()=>{
 const onu=Index.chile({...base,temaEspecifico:'Segunda Guerra Mundial y descolonización'});
 const globalization=Index.chile({...base,temaEspecifico:'Globalización y sociedad de la información'});
 assert.deepEqual(onu.map(r=>r.oaRegular),['HI2M OA 04']);
 assert.deepEqual(globalization.map(r=>r.oaRegular),['HI2M OA 11']);
 assert.ok(onu.every(r=>r.correspondencia.tipo==='coincidencia_tematica_preliminar'));
});
test('el índice se filtra por tema y familia, sin mezclar Matemática con Historia',()=>{
 assert.deepEqual(Index.chile({...base,temaEspecifico:'Ecuaciones lineales'}),[]);
 assert.deepEqual(Index.chile({...base,asignatura:'Matemática',temaEspecifico:'Guerra Fría'}),[]);
});
test('catálogo CONALITEG identifica tres libros oficiales de sociales y tres de ciencias, sin leer páginas',()=>{
 assert.equal(Index.books.length,6);
 const social=Index.mexico({...base,temaEspecifico:'Guerra Fría'});
 assert.deepEqual(social.map(x=>x.grado),[1,2,3]);
 assert.deepEqual(social.map(x=>x.visor.match(/clave=([^&]+)/)[1]),['S1ETA','S2ETA','S3ETA']);
 assert.ok(social.every(x=>x.paginaPDF===null&&x.capitulo===null&&x.fragmentoId===null));
 const math=Index.mexico({...base,asignatura:'Matemática'});
 assert.deepEqual(math.map(x=>x.visor.match(/clave=([^&]+)/)[1]),['S1SAA','S2SAA','S3SAA']);
 assert.deepEqual(Index.mexico({...base,asignatura:'Construcciones Metálicas'}),[]);
 assert.deepEqual(Index.mexico({...base,usarTextosEscolares:false}),[]);
});
test('la matriz integra referencias pero no declara páginas mexicanas ni chilenas verificadas',()=>{
 const m=Matrix.build({...base,temaEspecifico:'Guerra Fría'},{enabled:true,items:[]},{documents:[],fragments:[]});
 assert.equal(m.indicesConPaginasTE,1,'Guerra Fría se vincula a OA 08; fin de Guerra Fría requiere un tema explícito');
 assert.equal(m.fichasDeLibrosIdentificadas,3);
 assert.equal(m.cobertura.CL.fragmentosLibro,0);
 assert.equal(m.cobertura.MX.fragmentosLibro,0);
 assert.equal(m.estado,'indices_oficiales_con_paginas_te_pendientes_lectura');
 assert.equal(Matrix.linkActivities(m,[]).vinculosActividades.length,0);
 assert.match(Matrix.instruction(m),/páginas TE/);
});
