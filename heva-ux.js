/* HEVA UX progressive enhancement: no backend changes */
(function(){
'use strict';
function init(){
 const nav=document.querySelector('body > nav');const main=document.querySelector('main');if(!nav||!main)return;
 nav.setAttribute('aria-label','Herramientas HEVA');
 const names={crear:'Crear material',staging:'Revisión curricular',diffit:'Adaptar materiales',remediacion:'Remediación',guardados:'Mis materiales'};
 nav.querySelectorAll('button[id^="tab-"]').forEach(b=>{const k=b.id.slice(4);b.setAttribute('aria-controls','panel-'+k);b.setAttribute('aria-label',names[k]||b.textContent.trim());});
 function syncTabs(){nav.querySelectorAll('button[id^="tab-"]').forEach(b=>{const panel=document.getElementById('panel-'+b.id.slice(4));const active=!!panel&&!panel.classList.contains('hidden');b.setAttribute('aria-current',active?'page':'false');b.setAttribute('aria-expanded',String(active));});}
 nav.addEventListener('click',()=>setTimeout(syncTabs,0));syncTabs();
 const hero=document.createElement('section');hero.className='heva-welcome no-print';hero.setAttribute('aria-label','Inicio rápido');hero.innerHTML='<div><p class="heva-eyebrow">ESPACIO DOCENTE · EPJA</p><h2>¿Qué necesitas preparar hoy?</h2><p>Selecciona el tipo de material, vincula el objetivo curricular y revisa el resultado antes de exportarlo.</p></div><button type="button" class="heva-start">Comenzar a crear</button>';
 main.insertBefore(hero,main.firstChild);
 hero.querySelector('button').addEventListener('click',()=>{const tab=document.getElementById('tab-crear');if(tab)tab.click();document.getElementById('tipo-material')?.focus();syncTabs();});
 const form=document.getElementById('panel-crear');if(form){
 const first=form.querySelector('.bg-white');if(first){
 const guide=document.createElement('div');guide.className='heva-steps no-print';guide.setAttribute('aria-label','Pasos para crear material');guide.innerHTML='<span><b>1</b> Tipo y nivel</span><span><b>2</b> Objetivo y estrategia</span><span><b>3</b> Generar y revisar</span><span><b>4</b> Guardar o exportar</span>';first.insertBefore(guide,first.children[1]||null);
 }
 }
 document.querySelectorAll('label').forEach(label=>{if(label.htmlFor)return;const wrapper=label.parentElement;if(!wrapper)return;const control=wrapper.querySelector(':scope > input,:scope > select,:scope > textarea');if(control?.id)label.htmlFor=control.id;});
 document.querySelectorAll('button').forEach(btn=>{if(btn.textContent.trim()==='Borrar todo el historial'){btn.addEventListener('click',e=>{if(!window.confirm('¿Borrar todos los materiales guardados en este navegador? Esta acción no se puede deshacer.')){e.stopImmediatePropagation();e.preventDefault();}},true);}});
 const status=document.createElement('p');status.id='heva-ui-status';status.className='sr-only';status.setAttribute('role','status');status.setAttribute('aria-live','polite');document.body.appendChild(status);
 const observer=new MutationObserver(()=>syncTabs());nav.querySelectorAll('button[id^="tab-"]').forEach(b=>{const p=document.getElementById('panel-'+b.id.slice(4));if(p)observer.observe(p,{attributes:true,attributeFilter:['class']});});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();