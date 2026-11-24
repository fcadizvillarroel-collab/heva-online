'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Quality=require('../heva-quality-gate.js');
const Lab=require('../experimental/material-view.js');
const table={encabezados:['Dimensión','Situación','Consecuencia'],filas:[
 ['Económica','Venta de productos regionales','Cambios en mercados y precios'],
 ['Cultural','Intercambio de música y relatos','Transformación de costumbres']
]};
function slide(i,content=table){
 return{titulo:'Actividad '+i+' · dimensiones globales',funcion:'aplicación',
   contenido:{texto:'Compara las situaciones y justifica sus consecuencias con los datos de la tabla.',tabla:content}};
}
const base={tipoMaterial:'PRESENTACION',titulo:'Presentación EPJA de prueba',asignatura:'Estudios Sociales',
 objetivoAprendizaje:'Analizar conexiones sociales',diapositivas:[1,2,3,4,5].map(i=>slide(i))};
test('el auditor canónico detecta tablas repetidas aunque cambie el número del título',()=>{
 const q=Quality.inspect({material:base,sections:base.diapositivas.map(d=>({title:d.titulo,text:JSON.stringify(d.contenido)}))});
 assert.ok(q.issues.some(x=>x.code==='PPT_CONTENIDO_REPETIDO'));
});
test('el visor del laboratorio muestra la advertencia de HEVA sin crear otro evaluador',()=>{
 const q=Lab.audit(base,'PRESENTACION');
 assert.ok(q.warnings.some(s=>/Dos o más diapositivas repiten exactamente el mismo desarrollo/.test(s)));
 assert.ok(!q.issues.some(s=>/PPT_CONTENIDO_REPETIDO/.test(s)),'La auditoría heurística no bloquea automáticamente la exportación');
});
test('dos tablas realmente diferentes no producen el falso positivo de repetición',()=>{
 const m={...base,diapositivas:[1,2,3,4,5].map(i=>slide(i,{
   encabezados:table.encabezados,filas:[['Económica','Empresa '+i,'Resultado distinto '+i]]
 }))};
 assert.ok(!Quality.inspect({material:m}).issues.some(x=>x.code==='PPT_CONTENIDO_REPETIDO'));
 assert.ok(!Lab.audit(m,'PRESENTACION').warnings.some(s=>/Dos o más diapositivas repiten exactamente/.test(s)));
});
test('campos reordenados de una misma tabla continúan detectándose como duplicado',()=>{
 const reversed={filas:table.filas,encabezados:table.encabezados};
 const m={...base,diapositivas:[slide(1,table),slide(2,reversed),slide(3,table),slide(4,reversed),slide(5,table)]};
 assert.ok(Quality.inspect({material:m}).issues.some(x=>x.code==='PPT_CONTENIDO_REPETIDO'));
});
