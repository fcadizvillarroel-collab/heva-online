/* HEVA de prueba: secuencia 1–4 en acordeones, conservando los controles originales. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const descriptions={
 1:'Elige el material, el marco curricular EPJA, el nivel y la asignatura.',
 2:'Selecciona el OA oficial, delimita un tema y define cómo se enseñará o evaluará.',
 3:'Genera el material y revisa el contenido, la claridad y las evidencias.',
 4:'Revisa el resultado final y guárdalo o descárgalo en Word o PowerPoint.'
};
function convert(number,expanded=true){
 const old=$('heva-stage-'+number);
 if(!old||old.tagName==='DETAILS')return old;
 const details=document.createElement('details');
 details.id=old.id;
 details.className='heva-test-accordion no-print';
 details.open=expanded;
 details.dataset.step=String(number);
 const summary=document.createElement('summary');
 summary.className='heva-test-accordion-summary';
 const title=number===2?'Objetivo, tema y estrategia':old.querySelector('.heva-inline-stage-label')?.textContent||'Paso '+number;
 summary.setAttribute('aria-label','Paso '+number+': '+title+'. Desplegar u ocultar');
 const numberSpan=document.createElement('span');
 numberSpan.className='heva-inline-stage-number';
 numberSpan.textContent=String(number);
 numberSpan.setAttribute('aria-hidden','true');
 const copy=document.createElement('span');
 copy.className='heva-test-accordion-copy';
 const label=document.createElement('strong');
 label.className='heva-inline-stage-label';
 label.textContent=title;
 const hint=document.createElement('small');
 hint.className='heva-inline-stage-hint';
 hint.textContent=number===4?'Disponible después de generar. '+descriptions[4]:descriptions[number];
 copy.append(label,hint);
 const chevron=document.createElement('span');
 chevron.className='heva-test-chevron';chevron.setAttribute('aria-hidden','true');chevron.textContent='⌄';
 summary.append(numberSpan,copy,chevron);
 const body=document.createElement('div');
 body.className='heva-test-accordion-body';
 details.append(summary,body);
 old.replaceWith(details);
 return details;
}
function moveFollowing(stage,end){
 const content=stage.querySelector(':scope > .heva-test-accordion-body');
 let sibling=stage.nextElementSibling;
 while(sibling&&sibling!==end){
  const next=sibling.nextElementSibling;
  content.append(sibling);
  sibling=next;
 }
}
function organizeStepTwo(step){
 const content=step.querySelector(':scope > .heva-test-accordion-body');
 const oa=$('select-oa')?.closest('div.border-t');
 const topic=$('tema-especifico')?.closest('div');
 const strategy=$('heva-unified-pedagogy')||$('estrategia-didactica')?.closest('div');
 const advanced=$('heva-ajustes-adicionales');
 // Se trasladan nodos EXISTENTES, sin duplicar OA, selectores, valores ni eventos.
 // Orden legible: objetivo EPJA -> tema -> estrategia -> ajustes y documentos.
 // prepend en orden inverso: OA, luego tema y finalmente estrategia.
 // Los insumos documentales conservan su lugar después de la estrategia.
 const sequence=[strategy,topic,oa].filter(Boolean);
 for(const element of sequence)if(content.contains(element))content.prepend(element);
 // Todo campo complementario sigue presente; los ajustes opcionales cierran el paso.
 if(advanced&&content.contains(advanced))content.append(advanced);
 const goalLabel=oa?.querySelector('label');
 if(goalLabel&&goalLabel.textContent.trim()==='Objetivo Oficial MINEDUC')goalLabel.textContent='Objetivo oficial de aprendizaje EPJA';
 // Una orientación breve en lugar de cuatro cuadros explicativos adicionales.
 let order=$('heva-step2-order');
 if(!order){
  order=document.createElement('p');
  order.id='heva-step2-order';
  order.className='heva-test-sequence';
  order.textContent='OA EPJA → tema de la clase → estrategia principal → ajustes opcionales';
  content.prepend(order);
 }
}
function mount(){
 // Apertura inicial compacta: primero la selección básica. El objetivo y
 // la generación están a un clic; el visor explica la disponibilidad.
 const one=convert(1,true),two=convert(2,false),three=convert(3,false),four=convert(4,true);
 if(!one||!two||!three||!four)return;
 // Paso 1: tipo, marco, nivel, asignatura. Paso 2: OA y decisiones
 // didácticas. Paso 3: generar y revisar. El visor permanece independiente.
 moveFollowing(one,two);
 moveFollowing(two,three);
 moveFollowing(three,null);
 organizeStepTwo(two);
 const part4=four.querySelector(':scope > .heva-test-accordion-body');
 for(const id of ['heva-empty-preview','barra-calidad']){
  const node=$(id);if(node&&node.parentElement===four.parentElement)part4.append(node);
 }
 // Evitar repetir el contenido de la vista vacía y el resumen del paso 4.
 const placeholder=$('heva-empty-preview');
 if(placeholder)placeholder.classList.add('heva-test-preview');
 // Un único registro visual muestra lo solicitado sin crear más opciones.
 const supportItems=[...document.querySelectorAll('#heva-inclusive-options [data-heva-support]')];
 const supportReceipt=$('heva-inclusive-selected');
 function refreshSupports(){
  if(!supportReceipt)return;
  const count=supportItems.filter(x=>x.checked).length;
  supportReceipt.textContent=count
   ?count+' apoyo'+(count===1?'':'s')+' pedagógico'+(count===1?'':'s')+' seleccionado'+(count===1?'':'s')+'. Se incorporarán al encargo de IA.'
   :'Sin apoyos adicionales seleccionados. HEVA conserva las instrucciones generales de accesibilidad.';
 }
 for(const item of supportItems)item.addEventListener('change',refreshSupports);
 refreshSupports();
 const hero=document.querySelector('.heva-eyebrow');
 if(hero)hero.textContent='HEVA · GENERADOR PEDAGÓGICO EPJA';
 const starter=document.querySelector('.heva-start');
 if(starter)starter.addEventListener('click',()=>{one.open=true},{capture:true});
 // Cuando se genera o falla una solicitud, el botón y los avisos siguen accesibles.
 for(const id of ['progreso-ia','error-ia']){
  const node=$(id);if(!node||typeof MutationObserver!=='function')continue;
  const observer=new MutationObserver(()=>{if(!node.classList.contains('hidden'))three.open=true});
  observer.observe(node,{attributes:true,attributeFilter:['class']});
 }
 const article=$('hoja-material');
 if(article&&typeof MutationObserver==='function'){
  const obs=new MutationObserver(()=>{
   if(!article.hidden&&typeof materialActual!=='undefined'&&materialActual)four.open=true;
  });
  obs.observe(article,{attributes:true,attributeFilter:['hidden']});
 }
 document.documentElement.dataset.hevaTestAccordions='ready';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})();
