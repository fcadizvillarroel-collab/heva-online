'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Quality=require('../heva-quality-gate.js');
const Subject=require('../experimental/subject-audit.cjs');
const oa='Comprender diferentes ámbitos en los que se expresa el fenómeno de la globalización a nivel nacional y a escala planetaria distinguiendo efectos positivos y negativos en la realidad vivida.';
const literalSource='Un informe económico regional de 2022 indica que las importaciones de maquinaria aumentaron un 35% en cinco años, mientras pequeños talleres artesanales redujeron su personal en un 20% por la competencia extranjera.';
const withFacts={tipoMaterial:'PRESENTACION',asignatura:'Estudios Sociales',objetivoAprendizaje:oa,diapositivas:[{
 titulo:'Fuentes estadísticas y testimoniales sobre economía global',
 funcion:'explicación',contenido:['Qué significa: Las importaciones pueden transformar el empleo de los talleres.', 'Ejemplo: '+literalSource]
}],respaldoDocumental:[]};
test('auditoría real detecta atribución estadística no comprobada en diapositiva',()=>{
 const q=Quality.inspect({material:withFacts});
 assert.ok(q.issues.some(i=>i.code==='CIFRA_ATRIBUIDA_SIN_RESPALDO'));
});
test('una cifra de una fuente expresamente simulada no se trata como estadística atribuida a informe real',()=>{
 const m={...withFacts,diapositivas:[{titulo:'Análisis de caso simulado',contenido:['Texto SIMULADO: '+literalSource]}]};
 assert.ok(!Quality.inspect({material:m}).issues.some(i=>i.code==='CIFRA_ATRIBUIDA_SIN_RESPALDO'));
});
test('texto simulado íntegro con comillas simples evita falsos faltantes de fuente',()=>{
 const source="A partir del siguiente texto SIMULADO: 'La apertura comercial permite a una familia comprar productos distintos y también expone a pequeños talleres a competir con proveedores extranjeros. La clase compara ambos efectos y sus consecuencias para el trabajo local'. Explique dos efectos.";
 const p={tipoMaterial:'PRESENTACION',asignatura:'Estudios Sociales',objetivoAprendizaje:oa,diapositivas:[{titulo:'Interpretación de fuente',contenido:[source]}]};
 const q=Subject.inspectAll(p);
 assert.ok(!q.incidencias.some(x=>x.tipo==='autosuficiencia'),JSON.stringify(q.incidencias));
});
test('sigue señalando referencia a segundo texto cuando no hay estímulo',()=>{
 const p={tipoMaterial:'PRESENTACION',asignatura:'Estudios Sociales',objetivoAprendizaje:oa,diapositivas:[{titulo:'Aplicación',contenido:['Analice el siguiente texto e identifique dos efectos locales. El documento fue entregado al inicio sin incluirlo aquí ni proporcionar su contenido.']}]};
 assert.ok(Subject.inspectAll(p).incidencias.some(x=>x.tipo==='autosuficiencia'));
});
test('no exige identificar un autor inexistente en documento simulado',()=>{
 const source='Se analiza un fragmento del documento SIMULADO sobre comercio; su texto sostiene que existen beneficios y riesgos económicos.';
 const noAuthor={...withFacts,diapositivas:[{titulo:'Análisis guiado',contenido:[source,'1. Identificar el autor o procedencia y la fecha del documento.']}]};
 assert.ok(Quality.inspect({material:noAuthor}).issues.some(x=>x.code==='FUENTE_SIMULADA_SIN_AUTORIA'));
 const known={...withFacts,diapositivas:[{titulo:'Análisis guiado',contenido:[source+' Autor: Docente HEVA.','1. Identificar el autor o procedencia y la fecha del documento.']}]};
 assert.ok(!Quality.inspect({material:known}).issues.some(x=>x.code==='FUENTE_SIMULADA_SIN_AUTORIA'));
});
