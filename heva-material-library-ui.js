(function(){
'use strict';

function mount(){
 const library=window.HEVAMaterialLibrary;
 const list=document.getElementById('lista-guardados');
 if(!library||!list||typeof readHistory!=='function'||typeof recuperarHistorial!=='function'||document.getElementById('heva-material-library'))return;

 const node=(tag,value,className)=>{
  const element=document.createElement(tag);
  element.textContent=value||'';
  if(className)element.className=className;
  return element;
 };
 const controls=node('section','','space-y-3');
 controls.id='heva-material-library';
 controls.setAttribute('aria-label','Buscar y clasificar materiales guardados');
 const filters=node('div','','grid gap-3 sm:grid-cols-2');
 const labels={asignatura:'Asignatura',nivel:'Nivel',tipoMaterial:'Tipo de material',marcoCurricular:'Marco curricular'};
 const fields={};
 const status=node('p','','text-sm');
 status.setAttribute('role','status');

 function field(parent,caption,tag){
  const label=node('label',caption,'block text-sm font-semibold');
  const element=node(tag,'','block w-full border rounded p-2 mt-1 font-normal');
  label.append(element);
  parent.append(label);
  return element;
 }
 function option(value,label){
  const element=node('option',label);
  element.value=value;
  return element;
 }
 function button(caption,callback){
  const element=node('button',caption,'border rounded px-3 py-2 text-sm font-semibold');
  element.type='button';
  element.addEventListener('click',callback);
  return element;
 }
 function labelFor(field,value){
  const ids={asignatura:'asignatura',nivel:'nivel-epja',tipoMaterial:'tipo-material',marcoCurricular:'marco-curricular'};
  return Array.from(document.getElementById(ids[field])?.options||[]).find(option=>option.value===value)?.textContent||value;
 }

 const query=field(controls,'Buscar por título, tema, OA o contenido','input');
 query.type='search';
 for(const fieldName of library.fields)fields[fieldName]=field(filters,labels[fieldName],'select');
 controls.append(filters,button('Limpiar búsqueda y filtros',()=>{
  query.value='';
  for(const select of Object.values(fields))select.value='';
  render();
 }),button('Descargar inventario de materiales',()=>{
  const text=library.report(matches());
  HEVAOffice.download(new Blob([text],{type:'text/plain;charset=utf-8'}),'HEVA_inventario_materiales.txt');
 }),status);
 list.before(controls);
 let records=[];

 function openVersion(version){
  const current=readHistory();
  if(!current)return;
  const index=library.findVersion(current,version);
  if(index>=0)recuperarHistorial(index);
  else status.textContent='La versión ya no está disponible. Actualiza la lista de materiales.';
 }
 function renderCard(record){
  const material=record.matched;
  const card=node('article','','border rounded p-3 space-y-2');
  const title=node('h3',material.titulo,'font-bold text-base');
  card.append(title);
  const meta=library.fields.filter(field=>material[field]).map(field=>labelFor(field,material[field]));
  card.append(node('p',[...meta,'Versión '+material.version,material.fecha].filter(Boolean).join(' · '),'text-sm'));
  if(material.tema)card.append(node('p',material.tema,'text-sm'));
  if(material.oa){
   const oa=node('details','','text-sm');
   oa.append(node('summary','Ver objetivo de aprendizaje','cursor-pointer font-semibold'),node('p',material.oa,'mt-1'));
   card.append(oa);
  }
  if(record.versions.length>1){
   const selector=field(card,'Versión de '+material.titulo,'select');
   for(const [i,version] of record.versions.entries()){
    const info=['v'+version.version,version.fecha,version.titulo].filter(Boolean);
    selector.append(option(String(i),info.join(' · ')));
   }
   selector.value=String(record.versions.indexOf(material));
   card.append(button('Abrir versión',()=>openVersion(record.versions[Number(selector.value)])));
  }else card.append(button('Abrir material',()=>openVersion(material)));

  if(records.length>1){
   const details=node('details','','text-sm');
   details.append(node('summary','Ver materiales similares','cursor-pointer font-semibold'));
   const items=node('div','','space-y-2 mt-2');
   const showRelated=()=>{
    if(!details.open)return;
    const recommendations=library.related(records,record.key);
    const entries=node('ul','','space-y-2');
    for(const {record:similar,reason} of recommendations){
     const li=node('li','','flex flex-wrap items-center gap-2');
     li.append(button('Abrir '+similar.current.titulo,()=>openVersion(similar.current)),node('span',reason,'text-stone-700'));
     entries.append(li);
    }
    items.replaceChildren(recommendations.length?entries:node('p','No se encontraron coincidencias por OA, asignatura, nivel o tema.'));
    details.removeEventListener('toggle',showRelated);
   };
   details.addEventListener('toggle',showRelated);
   details.append(items);
   card.append(details);
  }
  return card;
 }
 function matches(){
  const criteria=Object.fromEntries(Object.entries(fields).map(([key,control])=>[key,control.value]));
  return library.search(records,{query:query.value,...criteria});
 }
 function render(){
  const filtered=matches();
  status.textContent=filtered.length===1?'1 material encontrado':filtered.length+' materiales encontrados';
  list.replaceChildren(...filtered.map(renderCard));
  if(!filtered.length)list.append(node('p',records.length?'Prueba otra búsqueda o quita filtros.':'No hay materiales guardados en este navegador.','text-sm'));
 }
 function refresh(){
  const history=readHistory();
  if(!history){
   status.textContent='El historial local no está disponible.';
   list.replaceChildren();
   return;
  }
  records=library.catalog(history);
  const options=library.facets(records);
  for(const [key,select] of Object.entries(fields)){
   const saved=select.value;
   select.replaceChildren(option('','Cualquiera'),...options[key].map(value=>option(value,labelFor(key,value))));
   if(options[key].includes(saved))select.value=saved;
  }
  render();
 }
 query.addEventListener('input',render);
 filters.addEventListener('change',render);
 window.cargarHistorial=refresh;
 window.addEventListener('storage',event=>{if(event.key==='heva_historial'||event.key===null)refresh();});
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})();
