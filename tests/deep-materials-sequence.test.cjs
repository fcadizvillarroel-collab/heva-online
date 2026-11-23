'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Deep=require('../heva-deep-materials.cjs');
const base={asignatura:'Estudios Sociales',nivel:'I_MEDIO',objetivoAprendizaje:'Analizar causas y consecuencias de un proceso histórico',temaEspecifico:'Guerra del Pacífico'};
test('HEVA Online desarrolla primero el caso, después la solución y finalmente transferencia',()=>{
 const presentation=Deep.guidance({...base,tipoMaterial:'PRESENTACION'});
 const guide=Deep.guidance({...base,tipoMaterial:'GUIA'});
 assert.match(presentation,/ANTES de mostrar su resolución/);
 assert.match(presentation,/transferencia distinta/);
 assert.match(guide,/solución razonada y una comprobación/);
 assert.match(guide,/Evita repetir ese mismo caso/);
});
test('las evaluaciones no ofrecen el ejemplo resuelto antes de responder',()=>{
 const exam=Deep.guidance({...base,tipoMaterial:'EVALUACION'});
 assert.match(exam,/no entregues ejemplo resuelto/);
 assert.doesNotMatch(exam,/plantea el caso o desafío completo ANTES/);
});
test('la profundidad disciplinar y el uso de fuentes no se sustituyen por una plantilla',()=>{
 const guide=Deep.guidance({...base,tipoMaterial:'GUIA'});
 assert.match(guide,/PERFIL DISCIPLINAR SOCIALES/);
 assert.match(guide,/No atribuyas a un documento palabras no recuperadas/);
});
