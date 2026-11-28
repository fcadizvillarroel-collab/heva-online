const test=require('node:test'),assert=require('node:assert/strict'),C=require('../heva-planning.js'),P=require('../heva-pedagogy.js'),S=require('../heva-studio.js'),R=require('../lib/recovery.cjs');
function plan(){return{tipoMaterial:'PLANIFICACION',asignatura:'Lenguaje y Comunicación',objetivoAprendizaje:'Expresarse oralmente con claridad y fluidez',temaEspecifico:'Presentar una solicitud',estrategiaDidactica:'MODELADO',cantAlternativas:0,cantDesarrollo:0,cantCasos:0,planificacionClase:{duracion:60,contenidos:['Organización y coherencia de ideas'],metodos:['modelado','simulacion'],agrupamientos:['parejas'],recursos:['texto'],comprobaciones:['oral','cotejo'],apoyos:['lectura'],materiales:[],modoMateriales:'existentes',detalleMetodos:'Simular una solicitud dirigida a una institución.',producto:'Presentación oral de un minuto',tiempos:{inicio:10,desarrollo:40,cierre:10}}}}
test('planning suggestions follow the objective and discipline without overwriting the objective',()=>{const p=plan(),before=JSON.stringify(p);assert.ok(C.suggestions(p).includes('Fluidez, ritmo y pausas'));assert.ok(C.suggestions({asignatura:'Educación Matemática',objetivoAprendizaje:'Resolver ecuaciones'}).includes('Unidades y cálculo'));assert.ok(C.suggestions({asignatura:'Ciencias Naturales',objetivoAprendizaje:'Explicar fenómenos'}).includes('Modelo explicativo'));assert.equal(JSON.stringify(p),before)});
test('planning input enforces real timing, selected methods and material decisions',()=>{const p=plan();assert.deepEqual(C.validate(p),[]);assert.deepEqual(S.validateExtras(p),[]);p.planificacionClase.tiempos.desarrollo=45;assert.ok(C.validate(p).some(x=>x.includes('sumar')));p.planificacionClase.tiempos.desarrollo=40;p.planificacionClase.metodos=['FAKE'];assert.ok(C.validate(p).some(x=>x.includes('metodos')));p.planificacionClase.metodos=['modelado'];p.planificacionClase.modoMateriales='crear';assert.ok(C.validate(p).some(x=>x.includes('materiales')));p.planificacionClase.materiales=['GUIA'];assert.deepEqual(C.validate(p),[])});
test('planning schema, primary and compact fallback honor duration and all selections',()=>{const p=plan(),m=P.schema('PLANIFICACION',p);assert.deepEqual(m.planClase.map(x=>x.minutos),[10,40,10]);assert.match(P.prompt(p),/Presentación oral de un minuto/);assert.match(R.fallbackPrompt(p,{},undefined),/Simular una solicitud/);assert.equal(R.batches(p).length,0);for(const [i,row]of m.planClase.entries()){row.metodosAplicados=i===1?['modelado','simulacion']:[];row.agrupamientos=['parejas'];row.recursosUsados=['texto'];row.comprobaciones=['oral','cotejo'];row.apoyosAplicados=['lectura'];}assert.deepEqual(C.audit(m,p),[]);m.planClase[1].metodosAplicados=['modelado'];assert.ok(C.audit(m,p).some(x=>x.includes('Simulación')))});
test('duration and existing ninety-minute plans remain compatible through display and export blocks',()=>{const p=plan(),m=P.finalize(P.schema('PLANIFICACION',p),p);assert.equal(m.planificacionClase.duracion,60);assert.ok(P.blocks(m).find(b=>b.title==='Diseño de la clase').text.includes('60 minutos'));assert.equal(C.duration({tipoMaterial:'PLANIFICACION'}),90);assert.deepEqual(P.schema('PLANIFICACION').planClase.map(x=>x.minutos),[15,60,15]);assert.ok(C.validate({...p,tipoMaterial:'GUIA'}).length)});
test('server planning contract rejects a different distribution even with the same total',()=>{const p=plan(),m=P.schema('PLANIFICACION',p);m.planClase[0].minutos=20;m.planClase[1].minutos=30;assert.ok(C.audit(m,p).some(x=>x.includes('tiempo de inicio')))});
test('planning accepts visible labels and actual reading activities without losing required coverage',()=>{
const p=plan(),m=P.schema('PLANIFICACION',p);p.planificacionClase.recursos=['texto','noticia'];p.planificacionClase.comprobaciones=['ticket'];
for(const row of m.planClase){row.metodosAplicados=['modelado','simulacion'];row.agrupamientos=['parejas'];row.apoyosAplicados=['lectura'];}
m.planClase[1].accionesEstudiantes='Leen y analizan una noticia sobre la comunicación en servicios públicos, identificando su idea central.';
m.ticketSalida={pregunta1:'¿Qué idea comunicarás primero al realizar una solicitud?'};
assert.deepEqual(C.audit(m,p),[]);
m.planClase[1].accionesEstudiantes='Realizan una exposición oral.';delete m.ticketSalida;
assert.equal(C.audit(m,p).filter(x=>/Texto o documento|Noticia|Ticket de salida/.test(x)).length,3);
m.planClase[1].recursosUsados=['Texto o documento','Noticia'];m.planClase[2].comprobaciones=['Ticket de salida'];assert.deepEqual(C.audit(m,p),[]);
});
test('selected planning ticket overrides the hidden generic switch in the generation prompt',()=>{const p=plan();p.incluirTicketSalida=false;p.planificacionClase.comprobaciones=['ticket'];assert.doesNotMatch(P.prompt(p),/No incluyas ticketSalida/);assert.match(P.prompt(p),/preguntas concretas en ticketSalida/);});
test('teacher planning includes subject explanations and editable moment fields in shared export blocks',()=>{const p=plan(),m=P.finalize(P.schema('PLANIFICACION',p),p);assert.ok(m.sintesisDocente.conceptos);m.sintesisDocente.ejemplo='Un saludo, una petición concreta y un agradecimiento.';m.planClase[1].consigna='Organiza tu solicitud en tres partes.';const blocks=P.blocks(m);assert.ok(blocks.some(b=>b.path==='sintesisDocente.ejemplo'&&b.text.includes('agradecimiento')));const row=blocks.find(b=>b.kind==='planning-moment'&&b.title.startsWith('Desarrollo'));assert.ok(row.fields.some(f=>f.path==='planClase.1.consigna'));assert.match(row.text,/Organiza tu solicitud/);assert.ok(!blocks.some(b=>b.title==='Instrucciones'));assert.match(P.prompt(p),/materia disciplinar/);});

const calendarCourse={asignatura:'Lenguaje y Comunicación',nivel:'I Medio',marcoCurricular:'Decreto 257'};
const leapPeriod={id:'curso-2028',nombre:'Abrir y cerrar solicitudes',horizonte:'unidad',inicio:'2028-02-28',fin:'2028-03-07',dias:[1,2],exclusiones:['2028-03-06'],duracion:60,curso:calendarCourse};

test('calendar uses civil dates without shifting days or inserting a holiday class',()=>{
 for(const horizonte of Object.keys(C.calendarHorizons)){
  const calendar=C.scheduleCalendar({...leapPeriod,horizonte});
  assert.deepEqual(calendar.sesiones.map(s=>s.fecha),['2028-02-28','2028-02-29','2028-03-07']);
  assert.deepEqual(calendar.curso,calendarCourse);
 }
 assert.throws(()=>C.scheduleCalendar({...leapPeriod,inicio:'2027-02-29'}),/intervalo válido/);
 assert.throws(()=>C.scheduleCalendar({...leapPeriod,exclusiones:['2028-02-30']}),/fechas excluidas/);
 assert.throws(()=>C.scheduleCalendar({...leapPeriod,dias:[]}),/día de clases/);
});

test('reprogramming retains the exact lesson goal, material link and supports without mutating the original',()=>{
 const calendar=C.scheduleCalendar(leapPeriod),original=JSON.stringify(calendar);
 const p=plan(),encargo={...calendarCourse,objetivoAprendizaje:p.objetivoAprendizaje,temaEspecifico:p.temaEspecifico,planificacionClase:p.planificacionClase};
 const changes={fecha:'2028-03-01',duracion:75,nota:'Proponer lectura acompañada a quienes faltaron.',materialId:'version-3',encargo};
 assert.throws(()=>C.updateSession(calendar,'2028-02-28',{...changes,fecha:'2028-02-29'}),/Ya hay una sesión/);
 assert.throws(()=>C.updateSession(calendar,'2028-02-28',{...changes,fecha:'2028-03-06'}),/fecha habilitada/);
 assert.throws(()=>C.updateSession(calendar,'2028-02-28',{...changes,encargo:{...encargo,nivel:'Otro'}}),/otro curso/);
 const updated=C.updateSession(calendar,'2028-02-28',changes);
 assert.equal(JSON.stringify(calendar),original);
 assert.deepEqual(updated.sesiones.map(x=>x.fecha),['2028-02-29','2028-03-01','2028-03-07']);
 const saved=updated.sesiones[1];
 assert.equal(saved.id,'2028-02-28');
 assert.equal(saved.materialId,'version-3');
 assert.equal(saved.encargo.objetivoAprendizaje,p.objetivoAprendizaje);
 assert.deepEqual(saved.encargo.planificacionClase.apoyos,['lectura']);
 assert.deepEqual(C.validate({tipoMaterial:'PLANIFICACION',planificacionClase:saved.encargo.planificacionClase}),[]);
 const suspended=C.updateSession(updated,saved.id,{...saved,suspendida:true});
 assert.equal(suspended.sesiones[1].suspendida,true);
 assert.equal(suspended.sesiones[1].materialId,'version-3');
});

test('calendar storage is local and updates the selected record without overwriting other calendars',()=>{
 const storage=new Map();
 const local={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 const first=C.scheduleCalendar(leapPeriod),other=C.scheduleCalendar({...leapPeriod,id:'otro',nombre:'Semestre I',horizonte:'semestral'});
 C.saveCalendar(local,first);C.saveCalendar(local,other);
 const updated=C.updateSession(first,'2028-02-28',{...first.sesiones[0],nota:'Sesión replanificada'});
 C.saveCalendar(local,updated);
 assert.deepEqual(C.readCalendars(local),[updated,other]);
 assert.deepEqual([...storage.keys()],['heva-calendarios-v1']);
});

test('an itinerary applies one literal OA in progressive classes and preserves occupied or suspended dates',()=>{
 const calendar=C.scheduleCalendar({...leapPeriod,fin:'2028-03-14'});
 const [first,second,third,fourth,fifth]=calendar.sesiones;
 const occupied=C.updateSession(calendar,second.id,{...second,materialId:'saved-version'});
 const prepared=C.updateSession(occupied,third.id,{...third,suspendida:true});
 const encargo={...calendarCourse,...plan()};
 assert.throws(()=>C.proposeItinerary(prepared,first.id,4,encargo),/faltan sesiones/);
 assert.throws(()=>C.proposeItinerary(prepared,first.id,3,{...encargo,nivel:'Otro'}),/otro curso/);
 const next=C.proposeItinerary(prepared,first.id,3,encargo);
 assert.deepEqual(next.sesiones.filter(s=>s.encargo).map(s=>s.id),[first.id,fourth.id,fifth.id]);
 assert.deepEqual(next.sesiones.filter(s=>s.encargo).map(s=>s.encargo.itinerario.titulo),['Explorar y modelar','Practicar con apoyo','Transferir y comprobar']);
 assert.deepEqual(next.sesiones[1],prepared.sesiones[1]);
 assert.deepEqual(next.sesiones[2],prepared.sesiones[2]);
 for(const {encargo:brief} of next.sesiones.filter(s=>s.encargo)){
  assert.equal(brief.objetivoAprendizaje,encargo.objetivoAprendizaje);
  assert.deepEqual(brief.planificacionClase.apoyos,encargo.planificacionClase.apoyos);
  assert.deepEqual(C.validate(brief),[]);
 }
 assert.equal(prepared.sesiones[0].encargo,null);
});

test('editing an itinerary reapplies its new activity and evidence to the canonical brief only once',()=>{
 const calendar=C.scheduleCalendar(leapPeriod),encargo={...calendarCourse,...plan()};
 const first=C.proposeItinerary(calendar,calendar.sesiones[0].id,2,encargo).sesiones[0].encargo;
 const fields={titulo:'Examinar modelos',actividad:'Comparar dos solicitudes impresas.',evidencia:'Justificar cuál comunica mejor la petición.'};
 const next=C.editItinerary(first,fields);
 assert.deepEqual(C.editItinerary(next,fields),next);
 assert.match(C.prompt(next),/Comparar dos solicitudes impresas/);
 assert.match(C.prompt(next),/Justificar cuál comunica mejor la petición/);
 assert.match(next.planificacionClase.detalleMetodos,/Simular una solicitud dirigida a una institución/);
 assert.doesNotMatch(C.prompt(next),/Recuperar experiencias del curso/);
 assert.throws(()=>C.editItinerary(first,{...fields,evidencia:''}),/evidencia/);
});
