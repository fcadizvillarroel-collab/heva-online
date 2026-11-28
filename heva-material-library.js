(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./heva-core.js'));
 else root.HEVAMaterialLibrary=factory(root.HEVA);
})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
'use strict';

const fields=['asignatura','nivel','tipoMaterial','marcoCurricular'];
const stopWords=new Set(['con','del','desde','ella','entre','esta','esto','las','los','mediante','para','por','que','sin','sobre','una','uno','usar','utilizar']);
const text=value=>typeof value==='string'?value.trim():'';
const normalized=value=>text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens=value=>normalized(value).split(' ').filter(word=>word.length>=3&&!stopWords.has(word));

function indexedContent(material){
 try{
  return normalized(Core.blocks(Core.material(material),false).map(block=>block.text).join(' ').slice(0,40000));
 }catch{return '';}
}

function catalog(history){
 const groups=new Map();
 for(const [index,entry] of (Array.isArray(history)?history:[]).entries()){
  if(!entry?.data||typeof entry.data!=='object'||Array.isArray(entry.data))continue;
  const material=entry.data;
  const materialId=text(material.materialId);
  const key=materialId?'material:'+materialId:'historial:'+index;
  const item={
   index,id:text(entry.id),fecha:text(entry.fecha),materialId,
   version:versionNumber(material.version),
   titulo:text(material.titulo)||'Material sin título',
   tema:text(material.temaEspecifico||material.planGeneracion?.temaEspecifico),oa:text(material.objetivoAprendizaje||material.planGeneracion?.objetivoAprendizaje),
   content:indexedContent(material),
   ...Object.fromEntries(fields.map(field=>[field,text(material[field])]))
  };
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(item);
 }
 return [...groups].map(([key,versions])=>{
  versions.sort((a,b)=>b.version-a.version||a.index-b.index);
  return {key,current:versions[0],versions};
 }).sort((a,b)=>a.current.index-b.current.index);
}

function versionNumber(value){
 const number=Number(value);
 return Number.isSafeInteger(number)&&number>0?number:1;
}

function findVersion(history,version){
 const matches=entry=>Boolean(entry?.data)&&text(entry.id)===version.id&&text(entry.data.materialId)===version.materialId&&versionNumber(entry.data.version)===version.version&&(text(entry.data.titulo)||'Material sin título')===version.titulo&&text(entry.fecha)===version.fecha;
 if(matches(history[version.index]))return version.index;
 return version.id?history.findIndex(matches):-1;
}

function facets(records){
 return Object.fromEntries(fields.map(field=>{
  const values=new Map();
  for(const {versions} of records)for(const version of versions){
   const value=version[field];
   if(value&&!values.has(normalized(value)))values.set(normalized(value),value);
  }
  return [field,[...values.values()].sort((a,b)=>a.localeCompare(b,'es'))];
 }));
}

const conceptGroups=[
 ['inasistencia','inasistencias','ausencia','ausencias','ausentismo'],['presupuesto','presupuestos','cotización','cotizaciones'],['sinónimo','equivalencia léxica'],
 ['seguridad laboral','prevención de riesgos'],['interpretación de textos','comprensión lectora'],
 ['proporcionalidad','variación proporcional'],['convivencia','resolución de conflictos']
].map(group=>group.map(normalized));
const hasPhrase=(value,fragment)=>(' '+value+' ').includes(' '+fragment+' ');
function queryParts(query,concepts){
 let literal=normalized(query);
 const alternatives=[];
 if(concepts){
  for(const group of conceptGroups){
   const term=group.find(value=>hasPhrase(literal,value));
   if(!term)continue;
   alternatives.push(group);
   literal=(' '+literal+' ').replaceAll(' '+term+' ',' ').trim();
  }
 }
 return {words:literal.split(' ').filter(Boolean),alternatives};
}
function search(records,{query='',concepts=false,...filters}={}){
 const {words,alternatives}=queryParts(query,concepts);
 const directQuery=normalized(query).split(' ').filter(Boolean);
 return records.flatMap(record=>{
  let relatedVersion;
  for(const version of record.versions){
   if(fields.some(field=>filters[field]&&normalized(version[field])!==normalized(filters[field])))continue;
   const haystack=normalized([version.titulo,version.tema,version.oa,...fields.map(field=>version[field])].join(' '))+' '+version.content;
   if(directQuery.every(word=>haystack.includes(word)))return [{...record,matched:version,conceptMatch:false}];
   if(!relatedVersion&&alternatives.length&&words.every(word=>haystack.includes(word))&&alternatives.every(group=>group.some(term=>hasPhrase(haystack.trim(),term))))relatedVersion=version;
  }
  return relatedVersion?[{...record,matched:relatedVersion,conceptMatch:true}]:[];
 }).sort((a,b)=>Number(a.conceptMatch)-Number(b.conceptMatch));
}

function report(records){
 const lines=['Inventario del banco local HEVA',records.length+' materiales en la selección',''];
 for(const {matched,versions} of records){
  lines.push([matched.titulo,matched.asignatura,matched.nivel,matched.tipoMaterial,'v'+matched.version,versions.length+' versiones'].filter(Boolean).join(' · '));
 }
 return lines.join('\n');
}
function related(records,key,limit=4){
 const active=records.find(record=>record.key===key)?.current;
 if(!active)return [];
 const activeTopic=new Set(tokens(active.tema||active.titulo));
 const activeOA=normalized(active.oa);
 const candidates=[];
 for(const record of records){
  if(record.key===key)continue;
  const candidate=record.current;
  const same=(field)=>Boolean(active[field]&&normalized(active[field])===normalized(candidate[field]));
  const sameOA=Boolean(activeOA&&activeOA===normalized(candidate.oa));
  const sameSubject=same('asignatura'),sameLevel=same('nivel');
  const topic=[...new Set(tokens(candidate.tema||candidate.titulo))].filter(word=>activeTopic.has(word));
  if(!sameOA&&!(sameSubject&&(sameLevel||topic.length))&&topic.length<2)continue;
  const reason=[sameOA&&'mismo OA',sameSubject&&'misma asignatura',sameLevel&&'mismo nivel',topic.length>0&&'tema relacionado'].filter(Boolean).join(' · ');
  const score=8*Number(sameOA)+4*Number(sameSubject)+2*Number(sameLevel)+Math.min(3,topic.length);
  candidates.push({record,reason,score});
 }
 return candidates.sort((a,b)=>b.score-a.score||a.record.current.index-b.record.current.index).slice(0,limit);
}

return {fields,catalog,findVersion,facets,search,related,report};
});
