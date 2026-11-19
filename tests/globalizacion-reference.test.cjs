const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../heva-core.js'),Q=require('../heva-quality-gate.js');
const sample={tipoMaterial:'PRESENTACION',titulo:'Globalización: vida cotidiana',asignatura:'Estudios Sociales',nivel:'III NB',objetivoAprendizaje:'Reconocer relaciones de interdependencia',recursosVisualesHEVA:{imagenes:true,diagramas:true,graficos:true,recuadros:true},diapositivas:[
 {titulo:'¿Qué es globalización?',contenido:'La globalización es un proceso de conexiones entre países. Ejemplo: un producto fabricado en otro país se vende en Villarrica.'},
 {titulo:'Comercio internacional',contenido:'Producción: bienes y servicios. Intercambio: transporte. Consumo: compras locales.'},
 {titulo:'Actividad de aplicación',contenido:'Analiza cómo el retraso de un proveedor afecta a un negocio local.'}
]};
test('globalization fixture has teaching progression and does not invent sources',()=>{
 const sections=sample.diapositivas.map(d=>({title:d.titulo,text:d.contenido}));
 const report=Q.inspect({material:sample,sections,visuals:[]});
 assert.ok(!report.issues.some(i=>i.code==='EJEMPLO_AUSENTE'));
 assert.ok(!report.issues.some(i=>i.code==='PRACTICA_AUSENTE'));
 assert.ok(report.issues.some(i=>i.code==='VISUALES_AUSENTES'));
});
test('globalization slide exporter prepares content without discarding titles',()=>{
 const D=require('../heva-slide-design.js');
 const sections=sample.diapositivas.map(d=>({title:d.titulo,text:d.contenido}));
 const result=D.decorate(sample,sections,{});
 assert.equal(result.length,3);
 assert.equal(result[1].title,'Comercio internacional');
 assert.equal(result[2].title,'Actividad de aplicación');
});
