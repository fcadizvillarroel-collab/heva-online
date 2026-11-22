'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Lab=require('../experimental/strategy-lab.js');
const catalog=require('../catalogo-publicado.json');
test('todos los OA publicados tienen una familia y estrategias accesibles',()=>{
 assert.equal(catalog.length,407,'Cambió la copia curricular; revisar auditoría antes de actualizar el umbral');
 const missing=catalog.filter(x=>x.estado==='APROBADO'&&x.referencia_comprobada===true).filter(x=>Lab.family(x.asignatura)==='otra'||Lab.items(x.asignatura).length===0);
 assert.deepEqual(missing.map(x=>[x.clave_interna,x.asignatura]),[],'Hay OA sin selector de asignatura');
});
test('Educación Física no se confunde con Física; Responsabilidad personal no con Historia',()=>{
 assert.equal(Lab.family('Educación Física y Salud'),'educacion_fisica');
 assert.equal(Lab.family('Responsabilidad Personal y Social'),'convivencia');
 assert.equal(Lab.family('Ciencias Naturales'),'ciencias');
 assert.equal(Lab.family('Pensamiento Computacional'),'digital');
 assert.equal(Lab.family('Artes Visuales'),'artes');
 assert.equal(Lab.family('Filosofía'),'filosofia');
});
test('cada OA aprobado tiene clave y texto distintos de un ejemplo ficticio',()=>{
 const approved=catalog.filter(x=>x.estado==='APROBADO'&&x.referencia_comprobada===true);
 assert.ok(approved.length>=400);
 assert.equal(new Set(approved.map(x=>x.clave_interna)).size,approved.length);
 assert.ok(approved.every(x=>x.texto_literal?.trim().length>20));
});
