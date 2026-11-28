const assert=require('node:assert/strict');
const test=require('node:test');
const planning=require('../heva-planning.js');
const tracking=require('../heva-curriculum-tracking.js');
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};};
const profile={id:'curso a',name:'Curso A',marco:'EPJA',nivel:'III',asignatura:'Matemática'};
const course={marcoCurricular:profile.marco,nivel:profile.nivel,asignatura:profile.asignatura};
const catalog=[
 {clave_interna:'clave1',codigo_oficial:'OA 1',texto_literal:'Resolver problemas'},
 {clave_interna:'clave2',codigo_oficial:'OA 2',texto_literal:'Representar datos'},
 {clave_interna:'no-vigente',texto_literal:'Excluido',vigente:false},
];
function calendar(id='periodo-1'){
 return planning.scheduleCalendar({id,nombre:'Noviembre',horizonte:'mensual',
  inicio:'2026-11-02',fin:'2026-11-09',dias:[1],duracion:90,curso:course});
}
function addSession(base,date,plan={},suspendida=false){
 return planning.updateSession(base,date,{fecha:date,duracion:60,nota:'Retomar con material impreso.',
  materialId:'version-2',suspendida,encargo:{...course,objetivoAprendizaje:'Resolver problemas',
   temaEspecifico:'Proporciones',planificacionClase:{resumen:'Modelar un ejemplo.',contenidos:['Razones']},
   itinerario:{actividad:'Resolver una situación familiar.',evidencia:'Explicar el procedimiento.'},...plan}});
}
test('deriva el estado planificado desde sesiones activas y recupera actividades, evidencia y versión',()=>{
 const data=storage();
 const saved=addSession(calendar(),'2026-11-02',{objetivoId:'clave1'});
 const rows=tracking.build(data,profile,saved,catalog,[{id:'version-2',data:{titulo:'Guía de proporciones',version:2}}]);
 assert.deepEqual(rows.map(row=>row.estado),['planificado','pendiente']);
 assert.deepEqual(rows[0].sesiones[0],{id:'2026-11-02',fecha:'2026-11-02',suspendida:false,tema:'Proporciones',
  plan:'Modelar un ejemplo.',actividades:['Resolver una situación familiar.','Razones'],
  evidencia:'Explicar el procedimiento.', materialId:'version-2',material:'Guía de proporciones',version:2,
  nota:'Retomar con material impreso.'});
 assert.equal(tracking.build(data,profile,addSession(calendar(),'2026-11-02',{},true),catalog)[0].estado,'pendiente');
});
test('usa el literal para encargos anteriores solo cuando identifica un OA único',()=>{
 const saved=addSession(calendar(),'2026-11-02');
 assert.equal(tracking.build(storage(),profile,saved,catalog)[0].estado,'planificado');
 const ambiguous=[...catalog,{clave_interna:'clave3',texto_literal:catalog[0].texto_literal}];
 assert.ok(tracking.build(storage(),profile,saved,ambiguous).every(row=>row.estado==='pendiente'));
 const keyed=addSession(calendar(),'2026-11-02',{objetivoId:'desconocido'});
 assert.equal(tracking.build(storage(),profile,keyed,catalog)[0].estado,'pendiente');
});
test('conserva el avance docente y la recuperación por perfil y calendario',()=>{
 const data=storage(),saved=addSession(calendar(),'2026-11-02');
 tracking.setProgress(data,profile,saved,'clave1',{estado:'recuperacion',recuperacion:'Resolver un caso en papel.'});
 const [row]=tracking.build(data,profile,saved,catalog);
 assert.equal(row.estado,'recuperacion');
 assert.equal(row.recuperacion,'Resolver un caso en papel.');
 assert.equal(tracking.build(data,{...profile,id:'curso-b'},saved,catalog)[0].estado,'planificado');
 assert.equal(tracking.build(data,profile,calendar('periodo-2'),catalog)[0].estado,'pendiente');
 assert.throws(()=>tracking.build(data,{...profile,nivel:'IV'},saved,catalog),/mismo marco/);
 tracking.setProgress(data,profile,saved,'clave1',{estado:'',recuperacion:''});
 assert.equal(tracking.build(data,profile,saved,catalog)[0].estado,'planificado');
});
test('el informe conserva procedencia, detalle de sesión y el estado registrado',()=>{
 const data=storage(),saved=addSession(calendar(),'2026-11-02');
 tracking.setProgress(data,profile,saved,'clave1',{estado:'evaluado',recuperacion:'Guía impresa'});
 const rows=tracking.build(data,profile,saved,catalog);
 const report=tracking.report(profile,saved,rows,'Respaldo curricular local.');
 for(const text of ['Curso A','Respaldo curricular local.','Evaluado (registro docente)','Guía impresa',
  'Modelar un ejemplo.','Resolver una situación familiar.','Explicar el procedimiento.',
  'Versión vinculada no disponible','Retomar con material impreso.']){
  assert.ok(report.includes(text),text);
 }
 assert.throws(()=>tracking.setProgress(data,profile,saved,'clave1',{estado:'aprobado'}),/estado válido/);
});

test('elimina solo anotaciones del perfil y calendario elegidos y conserva sus sesiones',()=>{
 const data=storage(),saved=addSession(calendar(),'2026-11-02');
 const second={...profile,id:'curso-b'};
 const otherPeriod=calendar('periodo-2');
 planning.saveCalendar(data,saved);
 tracking.setProgress(data,profile,saved,'clave1',{estado:'evaluado',recuperacion:'Entregar guía'});
 tracking.setProgress(data,profile,saved,'clave2',{estado:'en_curso'});
 tracking.setProgress(data,second,saved,'clave1',{estado:'trabajado'});
 tracking.setProgress(data,profile,otherPeriod,'clave1',{estado:'trabajado'});
 tracking.clearProgress(data,profile,saved);
 assert.deepEqual(tracking.build(data,profile,saved,catalog).map(row=>[row.estado,row.recuperacion]),[
  ['planificado',''],['pendiente','']
 ]);
 assert.deepEqual(planning.readCalendars(data),[saved]);
 assert.equal(tracking.build(data,second,saved,catalog)[0].estado,'trabajado');
 assert.equal(tracking.build(data,profile,otherPeriod,catalog)[0].estado,'trabajado');
});
