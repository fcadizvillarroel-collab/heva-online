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

test('abrir una pieza del paquete no crea versiones si la actual ya está guardada',()=>{
 const planGeneracion={marcoCurricular:'Decreto 257',nivel:'III NB',asignatura:'Estudios Sociales',objetivoAprendizaje:'Reconocer fuentes',temaEspecifico:'Fuentes del barrio'};
 const current={tipoMaterial:'GUIA',titulo:'Guía guardada',materialId:'guia',version:2,planGeneracion};
 const target={tipoMaterial:'EVALUACION',titulo:'Evaluación guardada',materialId:'evaluacion',version:1,planGeneracion};
 const opened=W.openPackageMaterial(current,target,()=>[{data:structuredClone(current)}],()=>assert.fail('No debe escribir una versión redundante'));
 assert.deepEqual(opened,target);
 assert.notEqual(opened,target);
});

test('abrir otra pieza exige confirmar en el historial los cambios antes de navegar',()=>{
 const planGeneracion={marcoCurricular:'Decreto 257',nivel:'III NB',asignatura:'Estudios Sociales',objetivoAprendizaje:'Reconocer fuentes',temaEspecifico:'Fuentes del barrio'};
 const current={tipoMaterial:'GUIA',titulo:'Guía recién editada',materialId:'guia',version:2,planGeneracion};
 const target={tipoMaterial:'EVALUACION',titulo:'Evaluación guardada',planGeneracion};
 const history=[{data:{...current,titulo:'Guía anterior'}}];
 assert.throws(()=>W.openPackageMaterial(current,target,()=>history,()=>{
  current.version=3; // El guardado compartido captura la excepción de cuota.
 }),/sigue abierto/);
 assert.equal(current.version,2);
 assert.equal(current.titulo,'Guía recién editada');
 assert.deepEqual(W.openPackageMaterial(current,target,()=>history,()=>{
  current.version=3;
  history.unshift({data:structuredClone(current)});
 }),target);
 assert.equal(history[0].data.version,3);
 assert.equal(history[0].data.titulo,'Guía recién editada');
});

test('un respaldo de perfiles es portátil, excluye OA y conserva las preferencias locales homónimas',()=>{
 const storage=()=>({value:null,getItem(){return this.value;},setItem(_,value){this.value=value;}});
 const first=storage(),second=storage();
 W.saveProfile(first,{...course,objetivoAprendizaje:'OA que no se exporta'});
 W.saveProfile(first,{...course,name:'Otro curso'});
 W.saveProfile(second,{...course,tipo:'EVALUACION'});
 const backup=W.exportProfiles(first);
 assert.equal(backup.includes('OA que no se exporta'),false);
 assert.deepEqual(W.importProfiles(second,backup),{added:1,kept:1});
 assert.equal(W.readProfiles(second).find(profile=>profile.id==='mi curso').tipo,'EVALUACION');
 const saved=second.value;
 assert.throws(()=>W.importProfiles(second,backup.replace('"Otro curso"','"Mi curso"')),/inválidos o repetidos/);
 assert.equal(second.value,saved);
});

const packagePlan={
 marcoCurricular:'DECRETO_257_2009',nivel:'III_BASICO',asignatura:'Estudios Sociales',
 objetivoAprendizaje:'Reconocer fuentes de información histórica.',temaEspecifico:'Fuentes del barrio',
 tipoMaterial:'PLANIFICACION',planificacionClase:{modoMateriales:'crear',materiales:['GUIA','PRESENTACION']},
 documentosBase:[{titulo:'No copiar dos veces'}],instrumentosEvaluacion:{pareados:5}
};
const packageOrigin={...packagePlan,planGeneracion:packagePlan,titulo:'Plan de la unidad',materialId:'plan'};
const responseFor=plan=>({exito:true,material:{...plan,planGeneracion:plan,versionPedagogica:3,titulo:'Pieza '+plan.tipoMaterial}});

test('la generación de piezas conserva la unidad y continúa tras una interrupción desde el historial',async()=>{
 const history=[],requests=[],commits=[];
 const operations={
  readHistory:()=>history,reference:'Contenido vigente de la planificación.',
  defaults:type=>require('../heva-pedagogy.js').contract(type).defaults,
  save:material=>history.unshift({data:structuredClone(material)}),
  commit:plan=>commits.push(plan.tipoMaterial),
  generate:async plan=>{
   requests.push(plan);
   if(plan.tipoMaterial==='PRESENTACION'&&requests.length===2)throw Error('Proveedor agotado');
   return responseFor(plan);
  }
 };
 await assert.rejects(W.generateMissingPackage(packageOrigin,['GUIA','PRESENTACION','GUIA'],operations),/Proveedor agotado/);
 assert.deepEqual(commits,['GUIA']);
 assert.equal(history[0].data.planificacionOrigen,'plan');
 assert.deepEqual((await W.generateMissingPackage(structuredClone(packageOrigin),['GUIA','PRESENTACION'],operations)).map(m=>m.tipoMaterial),['PRESENTACION']);
 assert.deepEqual(requests.map(plan=>plan.tipoMaterial),['GUIA','PRESENTACION','PRESENTACION']);
 assert.deepEqual(requests[1],requests[2]);
 assert.deepEqual(commits,['GUIA','PRESENTACION']);
 for(const plan of requests){
  assert.equal(plan.objetivoAprendizaje,packagePlan.objetivoAprendizaje);
  assert.equal(plan.temaEspecifico,packagePlan.temaEspecifico);
  assert.equal(plan.planificacionClase,null);
  assert.equal(plan.textoReferencia,operations.reference);
  assert.equal(plan.documentosBase,undefined);
  assert.deepEqual(plan.instrumentosEvaluacion,{});
  assert.doesNotThrow(()=>require('../lib/recovery.cjs').planOf(plan));
 }
 assert.deepEqual([requests[1].cantAlternativas,requests[1].cantDesarrollo,requests[1].cantCasos],[0,0,0]);
});

test('una respuesta incompatible o una copia no guardada no consumen el avance de la pieza',async()=>{
 const operations={
  readHistory:()=>[],reference:'Texto de la unidad',defaults:()=>[4,2,2],
  commit:()=>assert.fail('El avance debe seguir disponible.'),
  save:()=>{},generate:async plan=>responseFor(plan)
 };
 await assert.rejects(W.generateMissingPackage(packageOrigin,['GUIA'],operations),/No se confirmó el guardado/);
 operations.generate=async plan=>responseFor({...plan,objetivoAprendizaje:'OA distinto'});
 operations.save=()=>assert.fail('No debe guardar otro OA.');
 await assert.rejects(W.generateMissingPackage(packageOrigin,['GUIA'],operations),/no corresponde/);
});

test('la memoria docente es local, editable y aislada por asignatura o curso',()=>{
 const storage={data:new Map(),getItem(key){return this.data.get(key);},setItem(key,value){this.data.set(key,value);}};
 const scope={ambito:'curso',marco:course.marco,nivel:course.nivel,asignatura:course.asignatura};
 const subject={...scope,ambito:'asignatura'};
 W.saveProfile(storage,course);
 assert.deepEqual(W.saveTeacherMemory(storage,scope,['pasos','impresion','impresion','dato no permitido']),['pasos','impresion']);
 assert.deepEqual(W.readTeacherMemory(storage,{...scope,asignatura:' ESTUDIOS SOCIALES '}),['pasos','impresion']);
 assert.deepEqual(W.readTeacherMemory(storage,{...scope,nivel:'IV_BASICO'}),[]);
 assert.deepEqual(W.readTeacherMemory(storage,subject),[]);
 W.saveTeacherMemory(storage,subject,['lectura']);
 assert.deepEqual(W.readTeacherMemory(storage,{...subject,nivel:'IV_BASICO'}),['lectura']);
 assert.deepEqual(W.saveTeacherMemory(storage,scope,['impresion']),['impresion']);
 assert.equal(W.exportProfiles(storage).includes('impresion'),false);
 assert.throws(()=>W.saveTeacherMemory(storage,{...scope,asignatura:''},['lectura']),/Selecciona una asignatura/);
 W.saveTeacherMemory(storage,scope,[]);
 assert.deepEqual(W.readTeacherMemory(storage,scope),[]);
 assert.deepEqual(W.readTeacherMemory(storage,subject),['lectura']);
});

test('solo las preferencias elegidas explícitamente se incorporan a un encargo compatible',()=>{
 const selected=['pasos','lectura','información privada'];
 assert.deepEqual(W.teacherMemoryExtras(selected,false,'GUIA'),{});
 const guide=W.teacherMemoryExtras(selected,true,'GUIA');
 assert.equal(guide.preferenciasDocentesHEVA.length,2);
 assert.match(guide.instruccionesDocente,/OA EPJA/);
 assert.doesNotMatch(guide.instruccionesDocente,/información privada/);
 const evaluation=W.teacherMemoryExtras(selected,true,'EVALUACION');
 assert.deepEqual(evaluation.preferenciasDocentesHEVA,[W.teacherPreferences.lectura]);
 assert.deepEqual(W.teacherMemoryExtras(['pasos'],true,'EVALUACION'),{});
});

test('la memoria docente consentida llega a la base y a los bloques de diapositivas',()=>{
 const R=require('../lib/recovery.cjs');
 const plan={...packagePlan,tipoMaterial:'PRESENTACION',planificacionClase:null,documentosBase:[],instrumentosEvaluacion:{},cantAlternativas:0,cantDesarrollo:0,cantCasos:0};
 function prompts(input){
  const p=R.planOf(input);
  return [R.basePrompt(p),R.itemPrompt(p,{titulo:'Base'},R.batches(p)[0],[])];
 }
 for(const prompt of prompts({...plan,...W.teacherMemoryExtras(['impresion'],true,'PRESENTACION')})){
  assert.match(prompt,/INDICACIONES COMPLEMENTARIAS DEL DOCENTE:[^\n]*material impreso/);
 }
 for(const prompt of prompts({...plan,...W.teacherMemoryExtras(['impresion'],false,'PRESENTACION')})){
  assert.doesNotMatch(prompt,/INDICACIONES COMPLEMENTARIAS DEL DOCENTE:/);
 }
});

test('el contexto institucional es opcional, se conserva en el respaldo y filtra campos ajenos',()=>{
 let snapshot;
 const storage={getItem:()=>snapshot,setItem:(_key,value)=>{snapshot=value;}};
 const context={establecimiento:'CEA de ejemplo',modalidad:'EPJA',curso:'A-3',recursos:'Material impreso',contexto:'Presencial'};
 W.saveProfile(storage,{...course,institucional:{...context,estudiantes:['Ejemplo'],token:'secreto'}});
 assert.deepEqual(W.readProfiles(storage)[0].institucional,context);
 const backup=W.exportProfiles(storage);
 assert.deepEqual(W.parseProfileBackup(backup)[0].institucional,context);
 assert.doesNotMatch(backup,/estudiantes|token|secreto/);
});
