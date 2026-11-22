/* HEVA · organiza el visor sin cambiar el material ni las acciones del docente. */
(function(){
'use strict';
const byId=id=>document.getElementById(id);
function element(tag,className,text){
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(text!==undefined)node.textContent=text;
 return node;
}
function fold(id,label){
 const box=element('details','heva-result-fold no-print');
 box.id=id;
 const summary=element('summary','heva-result-summary',label);
 box.append(summary);
 return box;
}
function arrange(){
 const article=byId('hoja-material');
 if(!article||!article.parentElement)return;
 const viewer=article.parentElement;
 let edit=byId('heva-result-edit');
 let review=byId('heva-result-review');
 if(!edit){edit=fold('heva-result-edit','Editar y adaptar el material');article.after(edit);}
 if(!review){
  review=fold('heva-result-review','Revisión pedagógica y fuentes');
  const note=element('p','heva-review-note','Aquí se resumen las advertencias y estrategias. Los informes extensos y el control de exportación permanecen en la pestaña «Revisión y fuentes».');
  const go=element('button','heva-review-open-tab','Abrir revisión completa');
  go.type='button';
  go.addEventListener('click',()=>byId('tab-revision')?.click());
  review.append(note,go);edit.after(review);
 }
 // El documento debe ser el primer contenido extenso. Solo las descargas rápidas permanecen arriba.
 if(edit.previousElementSibling!==article)article.after(edit);
 if(review.previousElementSibling!==edit)edit.after(review);
 const toolbar=byId('heva-teacher-tools');
 if(toolbar){
  if(toolbar.parentElement!==edit)edit.append(toolbar);
  // No recrear botones ni callbacks: mover nodos conserva sus opciones y su estado.
  const heading=[...toolbar.children].find(x=>x.tagName==='H3');
  if(heading)heading.hidden=true;
  const categories=[
   {id:'heva-actions-edit',title:'Editar la guía',match:/Editar y ordenar bloques|Equilibrar claves|Asignar puntajes|Deshacer último cambio/i},
   {id:'heva-actions-resources',title:'Recursos didácticos y accesibilidad',match:/Recursos visuales|Imagen de apoyo|Accesibilidad|Escuchar|Vista previa PPT/i},
   {id:'heva-actions-history',title:'Comparar y recuperar',match:/Comparar versiones/i}
  ];
  for(const c of categories){
   let group=byId(c.id);
   if(!group){group=element('section','heva-tools-group');group.id=c.id;group.append(element('h4','heva-tools-title',c.title));toolbar.append(group);}
   for(const btn of [...toolbar.children].filter(x=>x.tagName==='BUTTON'&&c.match.test(x.textContent))){
    if(btn.parentElement!==group)group.append(btn);
   }
   group.hidden=![...group.querySelectorAll('button')].some(x=>!x.hidden);
  }
  toolbar.classList.add('heva-toolbar-organized');
  const visual=[...toolbar.querySelectorAll('button')].find(b=>/Recursos visuales · con o sin/.test(b.textContent));
  if(visual&&visual.textContent!=='Elegir imágenes, diagramas y gráficos')visual.textContent='Elegir imágenes, diagramas y gráficos';
  const guideImage=byId('heva-guide-image-action');
  if(guideImage&&guideImage.textContent!=='Añadir o cambiar imagen de apoyo')guideImage.textContent='Añadir o cambiar imagen de apoyo';
 }
 const sources=['heva-experimental-audit','heva-audit-fold','heva-strategy-delivery','heva-teaching-report','heva-textbook-references','heva-metal-sources','heva-depth-advisories','heva-tp-document-evidence'];
 for(const id of sources){
  const node=byId(id);
  if(node && node.parentElement!==review)review.append(node);
 }
 // Any teacher-only notes added later stay grouped under review.
 if(toolbar){
  for(const node of [...toolbar.children]){
   if(node.tagName==='DETAILS'&&node.parentElement===toolbar&&!node.matches('#heva-result-edit,#heva-result-review'))review.append(node);
  }
 }
 const auditSummary=byId('heva-experimental-audit')?.querySelector('summary')?.textContent||'';
 const problems=auditSummary.match(/(\d+) errores estructurales y (\d+) advertencias/);
 const label=problems&&(+problems[1]||+problems[2])
  ?'Revisión pedagógica y fuentes · '+(+problems[1]?' '+problems[1]+' errores':'')+(+problems[2]?' '+problems[2]+' advertencias':'')
  :'Revisión pedagógica y fuentes';
 const reviewSummary=review.querySelector('summary');
 if(reviewSummary&&reviewSummary.textContent!==label)reviewSummary.textContent=label;
 const active=typeof materialActual!=='undefined'&&!!materialActual;
 edit.hidden=!active;
 review.hidden=!active;
 // Keep teacher tools available, but make the material itself the visual focus.
 const bar=byId('barra-calidad');
 if(bar)bar.classList.add('heva-result-compact-top');
}
let scheduled=false,observer=null,observedRoot=null;
function schedule(){
 if(scheduled)return;
 scheduled=true;
 // Un observador no debe reaccionar a sus propios movimientos de nodos.
 // El intervalo corto evita ciclos con observadores existentes del módulo de revisión.
 setTimeout(()=>{
  scheduled=false;
  observer?.disconnect();
  try{arrange();}
  finally{if(observer&&observedRoot)observer.observe(observedRoot,{childList:true,subtree:true});}
 },80);
}
function mount(){
 const article=byId('hoja-material');
 if(!article)return;
 arrange();
 const viewer=article.parentElement;
 if(typeof MutationObserver==='function'){
  observedRoot=viewer;
  observer=new MutationObserver(schedule);
  observer.observe(viewer,{childList:true,subtree:true});
 }
 const auditButton=byId('btn-auditoria');
 auditButton?.addEventListener('click',()=>{
  const review=byId('heva-result-review');
  if(review&&!review.hidden)review.open=true;
  const fold=byId('heva-audit-fold');
  if(fold)fold.open=true;
  if(review&&!review.hidden)review.scrollIntoView?.({behavior:'smooth',block:'start'});
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})();
