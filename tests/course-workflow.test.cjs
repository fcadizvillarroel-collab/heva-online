const {test}=require('node:test'),assert=require('node:assert/strict');
const W=require('../heva-course-workflow.js');
const course={name:'Mi curso',marco:'DECRETO_257_2009',nivel:'III_BASICO',asignatura:'Estudios Sociales',tipo:'GUIA'};
test('los perfiles persistentes solo guardan preferencias permitidas y se aplican al reabrir',()=>{
 const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 W.saveProfile(storage,{...course,objetivoAprendizaje:'OA original'});
 W.saveProfile(storage,{...course,name:' mi CURSO ',tipo:'EVALUACION'});
 assert.deepEqual(W.readProfiles(storage),[{...course,id:'mi curso',name:'mi CURSO',tipo:'EVALUACION'}]);
 assert.throws(()=>W.saveProfile(storage,{...course,tipo:'INVENTADO'}));
 W.removeProfile(storage,'mi curso');
 assert.deepEqual(W.readProfiles(storage),[]);
 assert.deepEqual(W.readProfiles({getItem(){throw Error('privado')}}),[]);
});
test('el paquete agrupa versiones guardadas de la misma unidad y conserva el material activo',()=>{
 const guide={tipoMaterial:'GUIA',titulo:'Guía activa',planGeneracion:{marcoCurricular:'Decreto 257',nivel:'III NB',asignatura:'Estudios Sociales',objetivoAprendizaje:'Reconocer fuentes',temaEspecifico:'Fuentes del barrio'}};
 const previous={...guide,titulo:'Guía antigua'};
 const matching={...guide,tipoMaterial:'EVALUACION',titulo:'Prueba de la unidad'};
 const other={...matching,planGeneracion:{...guide.planGeneracion,objetivoAprendizaje:'Reconocer fuentes distintas'}};
 const differentFramework={...matching,planGeneracion:{...guide.planGeneracion,marcoCurricular:'Bases 2024'}};
 const groups=W.packageFor(guide,[previous,other,differentFramework,matching].map(data=>({data})));
 assert.equal(groups.find(g=>g.type==='GUIA').material,guide);
 assert.equal(groups.find(g=>g.type==='EVALUACION').material,matching);
 assert.equal(groups.find(g=>g.type==='TALLER').material,null);
 assert.equal(W.packageFor({tipoMaterial:'GUIA'},[]),null);
});
