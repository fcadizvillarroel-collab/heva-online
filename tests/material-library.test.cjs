'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Library=require('../heva-material-library.js');

function entry(id,data){
 return {id,fecha:'28-11-2026',data};
}
const history=[
 entry('guide-v2',{materialId:'guide',version:2,titulo:'Peticiones en el barrio',asignatura:'Lenguaje',nivel:'I Medio',tipoMaterial:'GUIA',marcoCurricular:'Decreto 257',temaEspecifico:'Solicitudes formales',objetivoAprendizaje:'Redactar peticiones con claridad.'}),
 entry('quiz-v1',{materialId:'quiz',version:1,titulo:'Evaluación de solicitudes',asignatura:'Lenguaje',nivel:'I Medio',tipoMaterial:'EVALUACION',marcoCurricular:'Decreto 257',temaEspecifico:'Solicitudes formales',objetivoAprendizaje:'Redactar peticiones con claridad.'}),
 entry('guide-v1',{materialId:'guide',version:1,titulo:'Solicitud a la junta vecinal',asignatura:'Lenguaje',nivel:'I Medio',tipoMaterial:'GUIA',marcoCurricular:'Decreto 257',temaEspecifico:'Peticiones',objetivoAprendizaje:'Redactar peticiones con claridad.'}),
 entry('legacy-a',{titulo:'Proporciones',asignatura:'Matemática',nivel:'II Medio'}),
 entry('legacy-b',{titulo:'Proporciones',asignatura:'Matemática',nivel:'II Medio'}),
 entry('local',{titulo:'Solicitudes informales',asignatura:'Lenguaje',nivel:'I Medio',tipoMaterial:'GUIA'})
];

test('groups only explicit canonical material IDs and orders versions without changing the history',()=>{
 const snapshot=JSON.stringify(history);
 const records=Library.catalog([...history,null,{}]);
 assert.equal(records.length,5);
 assert.deepEqual(records[0].versions.map(version=>version.id),['guide-v2','guide-v1']);
 assert.equal(records[0].current.id,'guide-v2');
 assert.notEqual(records[2].key,records[3].key);
 assert.equal(JSON.stringify(history),snapshot);
});

test('search combines curriculum filters and tokens across data of a single version, ignoring accents',()=>{
 const records=Library.catalog(history);
 assert.deepEqual(Library.facets(records).tipoMaterial,['EVALUACION','GUIA']);
 const [previous]=Library.search(records,{query:'junta CLARIDAD',tipoMaterial:'guía',nivel:'i medio',marcoCurricular:'decreto 257'});
 assert.equal(previous.matched.id,'guide-v1');
 assert.equal(previous.current.id,'guide-v2');
 assert.equal(Library.search(records,{query:'barrio vecinal'}).length,0);
 assert.equal(Library.search(records,{query:'matematica',tipoMaterial:'GUIA'}).length,0);
});

test('finds the selected stored version after reshuffling and fails closed when deleted',()=>{
 const target=Library.catalog(history)[0].versions[1];
 assert.equal(Library.findVersion([history[3],...history],target),3);
 assert.equal(Library.findVersion(history.filter(item=>item.id!==target.id),target),-1);
 const withoutId=[{data:{titulo:'A'}},{data:{titulo:'B'}}];
 const legacy=Library.catalog(withoutId)[0].current;
 assert.equal(Library.findVersion(withoutId,legacy),0);
 assert.equal(Library.findVersion(withoutId.slice(1),legacy),-1);
});

test('related priorities use exact OA and visible reasons, excluding unrelated catalog entries',()=>{
 const records=Library.catalog(history);
 const result=Library.related(records,'material:guide');
 assert.deepEqual(result.map(v=>v.record.current.id),['quiz-v1','local']);
 assert.match(result[0].reason,/mismo OA/);
 assert.match(result[1].reason,/misma asignatura/);
 assert.doesNotMatch(result[1].reason,/mismo OA/);
 assert.deepEqual(Library.related(records,'missing'),[]);
});

test('the searchable content and inventory preserve material data without putting content in the inventory',()=>{
 const L=require('../heva-material-library.js');
 const records=L.catalog([{id:'guide',data:{titulo:'Guía de recursos',tipoMaterial:'GUIA',introduccionLectura:'Describe el presupuesto comunitario.'}}]);
 const results=L.search(records,{query:'presupuesto comunitario'});
 assert.equal(results.length,1);
 assert.match(L.report(results),/Guía de recursos/);
 assert.doesNotMatch(L.report(results),/Describe el presupuesto/);
});

test('optional concept lookup prioritizes literal results and preserves curriculum filters',()=>{
 const records=Library.catalog([
  entry('related',{titulo:'Cotización de útiles',asignatura:'Matemática'}),
  entry('exact',{titulo:'Presupuesto de útiles',asignatura:'Matemática'}),
  entry('other',{titulo:'Cotización de oficios',asignatura:'Lenguaje'})
 ]);
 assert.deepEqual(Library.search(records,{query:'presupuesto',concepts:true,asignatura:'Matemática'}).map(x=>[x.current.id,x.conceptMatch]),[['exact',false],['related',true]]);
 assert.deepEqual(Library.search(records,{query:'presupuesto útiles'}).map(x=>x.current.id),['exact']);
 assert.deepEqual(Library.search(records,{query:'presupuesto transporte',concepts:true}),[]);
});
