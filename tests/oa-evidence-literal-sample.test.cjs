'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Sample=require('../lib/textbook-sample-inspection.cjs');
const Matrix=require('../lib/oa-textbook-matrix.cjs');
const root=path.join(__dirname,'..');
const base={tipoMaterial:'GUIA',asignatura:'Estudios Sociales',nivel:'I Nivel Medio',
 objetivoAprendizaje:'Analizar cambios de procesos históricos',temaEspecifico:'Guerra del Pacífico y ocupación de la Araucanía',
 usarTextosEscolares:true};
test('las nueve entradas inspeccionadas son del índice del PDF, no de páginas leídas del libro',()=>{
 assert.equal(Sample.sample.length,9);
 assert.ok(Sample.sample.every(x=>[4,5].includes(x.paginaIndiceImpresa)));
 assert.ok(Sample.sample.every(x=>[6,7].includes(x.paginaIndicePDF)));
 assert.ok(Sample.sample.every(x=>x.comienzoLibro>0&&x.tituloLeccion));
 const r=Sample.candidates(base);
 assert.equal(r.length,1,'La expansión y ocupación comparten lección 2 de unidad 3');
 assert.equal(r[0].unidadRegular,3);
 assert.equal(r[0].leccionRegular,2);
 assert.equal(r[0].paginaInicioLeccionImpresa,152);
 assert.equal(r[0].paginaIndiceImpresa,5);
 assert.equal(r[0].paginaIndicePDF,7);
 assert.equal(r[0].paginaPDF,null);
 assert.equal(r[0].fragmentoId,null);
});
test('la muestra distingue índice inspeccionado de página documental que prueba contenido',()=>{
 const r=Matrix.build(base,{enabled:true,items:[]},{documents:[],fragments:[]});
 assert.equal(r.indicesPDFInspeccionados,1);
 assert.equal(r.registros.filter(x=>x.tipo==='indice_de_libro_inspeccionado').length,1);
 assert.equal(r.cobertura.CL.fragmentosLibro,0);
 assert.equal(r.cobertura.MX.fragmentosLibro,0);
 const attempts=Matrix.linkActivities(r,[{fuenteId:null,seccion:'ALT-1',page:7,cita:'Ocupación de la Araucanía'}]);
 assert.equal(attempts.vinculosActividades.length,0);
});
test('la atribución de cita requiere texto literal, fuente y página verificadas',()=>{
 const draft={enabled:true,registros:[{pais:'CL',tipo:'fragmento_libro',
  titulo:'Fuente real',fragmentoId:'F-1',paginaPDF:12,extractoVerificable:'La industrialización transformó las formas de trabajo durante el siglo XIX.'},
  {pais:'MX',tipo:'ficha_libro_oficial',fragmentoId:null,paginaPDF:null,extractoVerificable:''}]};
 const correct={fuenteId:'F-1',seccion:'ALT-1',page:12,cita:'transformó las formas de trabajo'};
 const wrong={...correct,seccion:'ALT-2',cita:'Este contenido mexicano no figura en el documento'};
 const otherPage={...correct,seccion:'ALT-3',page:13};
 const short={...correct,seccion:'ALT-4',cita:'trabajo'};
 const duplicated={...correct};
 const result=Matrix.linkActivities(draft,[correct,wrong,otherPage,short,duplicated]);
 assert.equal(result.vinculosActividades.length,1);
 assert.equal(result.vinculosActividades[0].citaComprobada,correct.cita);
 assert.match(result.vinculosActividades[0].estado,/pendiente_pertinencia_docente/);
});
test('sin selección de libros escolares no se agregan fichas ni índices de PDF',()=>{
 assert.equal(Matrix.build({...base,usarTextosEscolares:false},{enabled:false,items:[]},{documents:[],fragments:[]}).registros.length,0);
 assert.deepEqual(Sample.candidates({...base,asignatura:'Matemática'}),[]);
});
test('panel docente muestra claramente el alcance real de la inspección',()=>{
 const ui=fs.readFileSync(path.join(root,'heva-teacher-ui.js'),'utf8');
 assert.match(ui,/Solo se examinó el índice/);
 assert.match(ui,/Índice inspeccionado en PDF de muestra/);
 assert.doesNotThrow(()=>new (require('node:vm').Script)(ui));
});
