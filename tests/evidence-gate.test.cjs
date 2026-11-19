const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../heva-evidence-gate.js');
test('generic OA prototype is not pedagogically approved',()=>{
 const result=E.inspect({material:{tipoMaterial:'GUIA',objetivoAprendizaje:'Interpretar mensajes publicitarios'},
 sections:[{title:'Comprender y aplicar',text:'¿Qué habilidad solicita este objetivo? Explica con tus palabras. Describe un ejemplo concreto relacionado con tu vida cotidiana, laboral o ciudadana. ¿Qué evidencia permitiría comprobar que lograste el objetivo?'}],
 visuals:[{image:'data:image/png;base64,AAA'}]});
 assert.equal(result.aprobado,false);
 assert.ok(result.issues.some(x=>x.code==='ACTIVIDADES_GENERICAS'));
 assert.ok(result.issues.some(x=>x.code==='REVISION_PEDAGOGICA_PENDIENTE'));
});
test('unverified documentary map is flagged',()=>{
 const result=E.inspect({material:{tipoMaterial:'PRESENTACION',fuentesVisualesVerificadas:[]},
 sections:[{text:'Mapa histórico de un conflicto'}],visuals:[{id:'map1',documentary:true,sourceUrl:'https://example.org/map.png'}]});
 assert.ok(result.issues.some(x=>x.code==='FUENTE_DOCUMENTAL_NO_VERIFICADA'));
});
test('complete signed evidence is distinguishable from heuristic score',()=>{
 const result=E.inspect({material:{tipoMaterial:'GUIA',revisionPedagogica:{validada:true,revisor:'Docente responsable',fecha:'2026-11-19',oaVerificado:true},revisionVisual:{validada:true,paginasRevisadas:4},fuentesVisualesVerificadas:[{id:'m1',titulo:'Mapa de ejemplo',autorInstitucion:'Archivo institucional',url:'https://example.org/m1',licencia:'CC BY',pertinenciaOA:'Ubicación espacial',verificada:true}]},sections:[{title:'Contenido',text:'La actividad plantea un caso real con análisis de causas y consecuencias.'}],visuals:[{id:'m1',documentary:true,sourceUrl:'https://example.org/m1'}]});
 assert.equal(result.aprobado,true);
});
