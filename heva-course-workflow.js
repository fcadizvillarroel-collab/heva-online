(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.HEVACourseWorkflow=factory();
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const profileStorageKey='heva-perfiles-curso-v1';
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
 return {readProfiles,saveProfile,removeProfile,packageFor};
});
