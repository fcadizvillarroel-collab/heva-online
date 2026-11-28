(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.HEVACurriculumTracking=factory();
})(globalThis,function(){
 'use strict';
 const storageKey='heva-seguimiento-curricular-v1';
 const states=Object.freeze({
  pendiente:'Pendiente',planificado:'Planificado',en_curso:'En curso',
  trabajado:'Trabajado',evaluado:'Evaluado',recuperacion:'Recuperación pendiente',recuperado:'Recuperado'
 });
 const asText=value=>typeof value==='string'?value.trim():'';
 function matchesCourse(profile,calendar){
  const course=calendar?.curso;
  return Boolean(profile&&course&&profile.marco===course.marcoCurricular&&profile.nivel===course.nivel&&profile.asignatura===course.asignatura);
 }
 function scope(profile,calendar){
  if(!profile?.id||!calendar?.id||!matchesCourse(profile,calendar))throw Error('Selecciona un perfil y un calendario del mismo marco, nivel y asignatura.');
  return JSON.stringify([profile.id,profile.marco,profile.nivel,profile.asignatura,calendar.id]);
 }
 function read(storage){
  const data=JSON.parse(storage.getItem(storageKey)||'{}');
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('El seguimiento local no se pudo leer.');
  return data;
 }
 function setProgress(storage,profile,calendar,key,progress){
  const id=scope(profile,calendar);
  if(typeof key!=='string'||!key||key.length>300)throw Error('Selecciona un objetivo de aprendizaje del catálogo.');
  const estado=asText(progress.estado),recuperacion=asText(progress.recuperacion);
  if(estado&&!Object.hasOwn(states,estado))throw Error('Selecciona un estado válido.');
  if(recuperacion.length>1500)throw Error('La actividad de recuperación admite hasta 1.500 caracteres.');
  const data=read(storage),values=new Map(Object.entries(data[id]||{}));
  if(estado||recuperacion)values.set(key,{estado,recuperacion});
  else values.delete(key);
  if(values.size)data[id]=Object.fromEntries(values);
  else delete data[id];
  storage.setItem(storageKey,JSON.stringify(data));
 }
 function clearProgress(storage,profile,calendar){
  const id=scope(profile,calendar),data=read(storage);
  if(!Object.hasOwn(data,id))return;
  delete data[id];
  storage.setItem(storageKey,JSON.stringify(data));
 }
 function build(storage,profile,calendar,catalog,history=[]){
  const records=read(storage)[scope(profile,calendar)]||{};
  const rows=new Map();
  const literal=new Map();
  for(const item of catalog){
   if(item.vigente===false||item.estado==='RECHAZADO'||!item.clave_interna||!item.texto_literal||rows.has(item.clave_interna))continue;
   const key=item.clave_interna;
   rows.set(key,{key,codigo:item.codigo_oficial||key,texto:item.texto_literal,sesiones:[]});
   literal.set(item.texto_literal,literal.has(item.texto_literal)?null:key);
  }
  const materials=new Map(history.filter(entry=>entry?.id&&entry.data).map(entry=>[entry.id,entry.data]));
  for(const session of calendar.sesiones||[]){
   const plan=session.encargo;
   if(!plan)continue;
   const knownKey=plan.oaPrincipal?.clave||plan.objetivoId;
   const key=knownKey||literal.get(plan.objetivoAprendizaje);
   if(!rows.has(key))continue;
   const material=materials.get(session.materialId);
   rows.get(key).sesiones.push({
    id:session.id,fecha:session.fecha,suspendida:session.suspendida===true,
    tema:asText(plan.temaEspecifico),plan:asText(plan.planificacionClase?.resumen),
    actividades:[asText(plan.itinerario?.actividad),...(plan.planificacionClase?.contenidos||[])].filter(Boolean),
    evidencia:asText(plan.itinerario?.evidencia||plan.planificacionClase?.producto),
    materialId:session.materialId||'',material:material?.titulo||'',version:material?.version||null,
    nota:asText(session.nota)
   });
  }
  return [...rows.values()].map(row=>{
   const saved=Object.hasOwn(records,row.key)?records[row.key]:null;
   const estadoManual=Object.hasOwn(states,saved?.estado)?saved.estado:'';
   return {...row,estadoManual,estado:estadoManual||(row.sesiones.some(s=>!s.suspendida)?'planificado':'pendiente'),recuperacion:asText(saved?.recuperacion)};
  });
 }
 function report(profile,calendar,rows,source){
  const lines=['Seguimiento curricular HEVA',profile.name+' · '+profile.asignatura+' · '+profile.nivel,
   profile.marco+' · '+calendar.nombre+' · '+calendar.inicio+' a '+calendar.fin,source,''];
  for(const row of rows){
   lines.push(row.codigo+' · '+states[row.estado]+(row.estadoManual?' (registro docente)':' (según calendario)'),row.texto);
   if(row.recuperacion)lines.push('Recuperación del OA: '+row.recuperacion);
   for(const session of row.sesiones){
    lines.push('  '+session.fecha+(session.suspendida?' · suspendida':'')+' · '+(session.tema||'Sin tema'));
    if(session.plan)lines.push('  Plan: '+session.plan);
    if(session.actividades.length)lines.push('  Actividades y contenidos: '+session.actividades.join(' · '));
    if(session.evidencia)lines.push('  Evidencia prevista: '+session.evidencia);
    if(session.materialId)lines.push('  Material: '+(session.material||'Versión vinculada no disponible')+(session.version?' · v'+session.version:''));
    if(session.nota)lines.push('  Nota o ajuste de sesión: '+session.nota);
   }
   lines.push('');
  }
  return lines.join('\n');
 }
 return {states,matchesCourse,setProgress,clearProgress,build,report};
});
