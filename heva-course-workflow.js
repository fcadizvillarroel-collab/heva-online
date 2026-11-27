(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.HEVACourseWorkflow=factory();
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const profileStorageKey='heva-perfiles-curso-v1';
 const profileBackupSchema='heva-perfiles-curso-v1';
 const courseFields=['marco','nivel','asignatura','tipo'];
 const materialTypes=['PLANIFICACION','GUIA','PRESENTACION','TALLER','EVALUACION','ACCESIBLE'];
 const unitFields=['marcoCurricular','nivel','asignatura','objetivoAprendizaje','temaEspecifico'];
 const string=value=>typeof value==='string'?value.trim():'';
 const key=value=>string(value).normalize('NFC').replace(/\s+/g,' ').toLocaleLowerCase('es-CL');
 function profile(value){
  const name=string(value?.name);
  if(!name||name.length>60)return null;
  const fields=Object.fromEntries(courseFields.map(field=>[field,string(value[field])]));
  if(Object.values(fields).some(field=>!field||field.length>160)||!materialTypes.includes(fields.tipo))return null;
  return {id:key(name),name,...fields};
 }
 function readProfiles(storage){
  try{
   const saved=JSON.parse(storage.getItem(profileStorageKey)||'[]');
   if(!Array.isArray(saved))return [];
   return [...new Map(saved.map(profile).filter(Boolean).map(x=>[x.id,x])).values()].slice(0,20);
  }catch{return [];}
 }
 function saveProfile(storage,value){
  const next=profile(value);
  if(!next)throw Error('Escribe un nombre de hasta 60 caracteres y selecciona marco, nivel, asignatura y tipo de material.');
  const prior=readProfiles(storage);
  if(prior.length>=20&&!prior.some(entry=>entry.id===next.id))throw Error('Hay 20 perfiles guardados. Elimina uno para guardar otro.');
  storage.setItem(profileStorageKey,JSON.stringify([next,...prior.filter(entry=>entry.id!==next.id)]));
  return next;
 }
 function removeProfile(storage,id){
  storage.setItem(profileStorageKey,JSON.stringify(readProfiles(storage).filter(entry=>entry.id!==id)));
 }
 function exportProfiles(storage){
  return JSON.stringify({schema:profileBackupSchema,perfiles:readProfiles(storage)},null,2);
 }
 function importProfiles(storage,serialized){
  let document;
  try{
   if(typeof serialized!=='string'||serialized.length>25000)throw Error();
   document=JSON.parse(serialized);
  }catch{throw Error('Selecciona un respaldo JSON de perfiles de hasta 25.000 caracteres.');}
  if(document?.schema!==profileBackupSchema||!Array.isArray(document.perfiles)||document.perfiles.length>20){
   throw Error('El archivo no es un respaldo válido de perfiles de curso HEVA.');
  }
  const incoming=document.perfiles.map(profile);
  if(incoming.some(entry=>!entry)||new Set(incoming.map(entry=>entry.id)).size!==incoming.length){
   throw Error('El respaldo contiene perfiles inválidos o repetidos.');
  }
  const prior=readProfiles(storage),ids=new Set(prior.map(entry=>entry.id));
  const added=incoming.filter(entry=>!ids.has(entry.id));
  if(prior.length+added.length>20)throw Error('La importación excede los 20 perfiles permitidos. Elimina perfiles antes de importar.');
  if(added.length)storage.setItem(profileStorageKey,JSON.stringify([...prior,...added]));
  return {added:added.length,kept:incoming.length-added.length};
 }
 function unitKey(material){
  const values=unitFields.map(field=>key(material?.planGeneracion?.[field]||material?.[field]));
  return values.every(Boolean)?JSON.stringify(values):null;
 }
 function packageFor(current,history){
  const unit=unitKey(current);
  if(!unit)return null;
  const chosen=new Map();
  for(const material of [current,...(Array.isArray(history)?history:[]).map(x=>x?.data)]){
   if(unitKey(material)!==unit||!materialTypes.includes(material.tipoMaterial)||chosen.has(material.tipoMaterial))continue;
   chosen.set(material.tipoMaterial,material);
  }
  return materialTypes.map(type=>({type,material:chosen.get(type)||null}));
 }
 function wasSaved(current,history){
  const snapshot=JSON.stringify(current);
  return history.some(record=>JSON.stringify(record?.data)===snapshot);
 }
 function preservePackageMaterial(current,readHistory,save){
  if(wasSaved(current,readHistory()))return;
  // El guardado compartido puede asignar identidad y versión antes de escribir.
  const metadata=Object.fromEntries(['materialId','version'].filter(field=>Object.hasOwn(current,field)).map(field=>[field,current[field]]));
  try{
   save();
   if(wasSaved(current,readHistory()))return;
  }catch{}
  for(const field of ['materialId','version']){
   if(Object.hasOwn(metadata,field))current[field]=metadata[field];
   else delete current[field];
  }
  throw Error('No se pudo confirmar el guardado. El material editado sigue abierto; descarga un respaldo JSON antes de continuar.');
 }
 function openPackageMaterial(current,target,readHistory,save){
  const currentUnit=unitKey(current);
  if(!currentUnit||currentUnit!==unitKey(target)||!materialTypes.includes(target.tipoMaterial)){
   throw Error('El material seleccionado ya no corresponde a la unidad abierta.');
  }
  const next=JSON.parse(JSON.stringify(target));
  preservePackageMaterial(current,readHistory,save);
  return next;
 }
 function buildPackageRequest(current,type,counts,reference){
  const origin=current.planGeneracion;
  if(!origin||!unitKey(current)||!materialTypes.includes(type)||type===current.tipoMaterial){
   throw Error('La pieza requiere un plan de origen que corresponda a la unidad abierta.');
  }
  const [cantAlternativas,cantDesarrollo,cantCasos]=['PLANIFICACION','PRESENTACION'].includes(type)?[0,0,0]:counts;
  const request={
   ...origin,...Object.fromEntries(unitFields.map(field=>[field,origin[field]||current[field]])),
   tipoMaterial:type,planificacionClase:null,planIntegrado:null,disenoPedagogico:null,derivacion:null,
   instrumentosEvaluacion:{},cantAlternativas,cantDesarrollo,cantCasos,
   modoReferencia:'CONTENIDO',textoReferencia:String(reference||'').slice(0,18000),
   instruccionesDocente:'Material de la misma unidad EPJA. Conserva el objetivo y aprovecha el contexto y la secuencia del material base. Usa consignas diferentes, con datos completos, y respeta el propósito y la pauta docente de este tipo de material.'
  };
  // El plan ya cita el material local completo en vez de duplicar sus documentos adjuntos.
  delete request.documentosBase;
  if(type==='EVALUACION'){
   request.apoyosInclusivos=(request.apoyosInclusivos||[]).filter(id=>id!=='modelado');
   request.adecuacionesPIE=(request.adecuacionesPIE||[]).filter(text=>!/modelado/i.test(text));
  }
  return request;
 }
 async function generateMissingPackage(current,requested,operations){
  const {readHistory,generate,save,commit,reference,defaults,onPiece=()=>{}}=operations;
  const unit=unitKey(current);
  if(!unit||!Array.isArray(requested))throw Error('Selecciona materiales pendientes de la unidad.');
  const requestedSet=new Set(requested);
  const pieces=materialTypes.filter(type=>type!==current.tipoMaterial&&requestedSet.has(type));
  const plans=pieces.map(type=>buildPackageRequest(current,type,defaults(type),reference));
  const generated=[];
  for(const plan of plans){
   const kit=packageFor(current,readHistory());
   if(kit.some(piece=>piece.type===plan.tipoMaterial&&piece.material))continue;
   onPiece(plan.tipoMaterial);
   const response=await generate(plan),material=response?.material;
   if(response?.exito!==true||!material||material.versionPedagogica!==3||!string(material.titulo)
    ||material.tipoMaterial!==plan.tipoMaterial||unitKey(material)!==unit
    ||unitFields.some(field=>key(material[field])!==key(plan[field]))){
    throw Error('La respuesta no corresponde a la pieza solicitada. Los materiales ya guardados se conservan.');
   }
   if(current.tipoMaterial==='PLANIFICACION'&&current.materialId)material.planificacionOrigen=current.materialId;
   save(material);
   if(!wasSaved(material,readHistory()))throw Error('No se confirmó el guardado de la pieza. El avance se conserva para reintentar.');
   commit(plan);
   generated.push(material);
  }
  return generated;
 }
 return {readProfiles,saveProfile,removeProfile,exportProfiles,importProfiles,packageFor,preservePackageMaterial,openPackageMaterial,generateMissingPackage};
});
