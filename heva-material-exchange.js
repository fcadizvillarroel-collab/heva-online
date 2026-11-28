(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./heva-pedagogy.js'),require('./heva-core.js'));
 else root.HEVAMaterialExchange=factory(root.HEVAPedagogy,root.HEVA);
})(typeof globalThis==='undefined'?this:globalThis,function(Pedagogy,Core){
 'use strict';
 const schema='heva-material-compartido-v1';
 const maximumBytes=600000;
 const identityFields=['tipoMaterial','asignatura','nivel','marcoCurricular','objetivoAprendizaje','temaEspecifico'];
 const supportFields=['planificacionClase','verdaderoFalso','terminosPareados','comprensionLectora','ejerciciosEvaluacion','identificacion','apoyosAcceso'];
 const restricted=/^(?:__proto__|constructor|prototype|.*(?:token|password|credencial|correo|email|rutEstudiante|imagen|archivo|adjunto|documentosBase).*)$/i;
 function clean(value,depth=0){
  if(depth>10)throw Error('El material tiene una estructura demasiado profunda.');
  if(value===null||typeof value==='boolean'||Number.isFinite(value))return value;
  if(typeof value==='string')return value;
  if(Array.isArray(value))return value.map(item=>clean(item,depth+1));
  if(!value||typeof value!=='object')throw Error('El archivo contiene campos inválidos.');
  return Object.fromEntries(Object.entries(value).filter(([key])=>!restricted.test(key)).map(([key,item])=>[key,clean(item,depth+1)]));
 }
 function pedagogyFields(type){
  return Object.keys(Pedagogy.schema(type,{planificacionClase:type==='PLANIFICACION'?{duracion:90}:undefined}));
 }
 function content(material){
  const type=material?.tipoMaterial;
  if(!Object.hasOwn(Pedagogy.contracts,type)||typeof material.titulo!=='string'||!material.titulo.trim()||material.titulo.length>500)throw Error('El archivo debe contener un material HEVA con título y tipo válidos.');
  const allowed=new Set([...pedagogyFields(type),...identityFields,...supportFields]);
  const selected=clean(Object.fromEntries(Object.entries(material).filter(([key])=>allowed.has(key))));
  const normalized=Core.material({...selected,versionPedagogica:3});
  try{Core.blocks(normalized,true);}catch{throw Error('La estructura del material no se puede abrir en el editor HEVA.');}
  return normalized;
 }
 function checkedText(value,length){
  if(typeof value!=='string'||value.trim().length>length)throw Error('Revisa el alias de autoría.');
  return value.trim();
 }
 function origin(value){
  return {
   id:typeof value?.id==='string'&&/^[\w-]{1,100}$/.test(value.id)?value.id:'',
   version:Number.isSafeInteger(value?.version)&&value.version>0?value.version:1,
   autor:checkedText(value?.autor??'',80)
  };
 }
 function serialize(material,author){
  const copy={schema,origen:origin({id:material?.materialId,version:material?.version,autor:author}),material:content(material)};
  const serialized=JSON.stringify(copy);
  if(new Blob([serialized]).size>maximumBytes)throw Error('El material supera el tamaño máximo para el intercambio.');
  return serialized;
 }
 function parse(serialized){
  if(typeof serialized!=='string'||new Blob([serialized]).size>maximumBytes)throw Error('El archivo de intercambio supera el tamaño permitido.');
  let copy;
  try{copy=JSON.parse(serialized);}catch{throw Error('El archivo JSON no es válido.');}
  if(copy?.schema!==schema)throw Error('Selecciona un archivo de intercambio HEVA.');
  return {...content(copy.material),origenIntercambio:origin(copy.origen)};
 }
 return {serialize,parse,maximumBytes};
});
