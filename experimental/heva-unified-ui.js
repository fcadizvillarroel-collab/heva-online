/* HEVA preview-only compact unified pedagogical controls. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function start(){
const lab=$('integrated-lab'),legacy=$('estrategia-didactica'),questions=$('cant-alternativas')?.closest('.border-t'),enabled=$('lab-enabled');
if(!lab||!legacy||!questions||!enabled)return;
const strategy=legacy.parentElement;
const container=document.createElement('section');
container.id='heva-unified-pedagogy';container.className='rounded-xl border border-amber-300 bg-amber-50/40 p-3 space-y-3';
strategy.parentNode.insertBefore(container,strategy);
container.append(strategy,questions,lab);
const heading=document.createElement('div');heading.className='flex items-center justify-between gap-2';
const title=document.createElement('strong');title.className='text-sm text-[#8B2635]';title.textContent='Diseño de estrategias y preguntas';
const hint=document.createElement('span');hint.className='text-xs text-stone-500';hint.textContent='Un solo flujo';
heading.append(title,hint);container.prepend(heading);
const note=document.createElement('p');note.className='text-xs text-stone-600';note.textContent='La estrategia principal se utiliza en modo habitual. Activa el laboratorio para combinar estrategias; las cantidades de preguntas son compartidas.';
strategy.append(note);
const desc=lab.querySelector('summary');desc.textContent='Configurar estrategias combinadas  →';
desc.setAttribute('aria-label','Abrir configuración lateral de estrategias integradas');
const panel=document.createElement('div');panel.id='heva-lab-drawer';panel.className='heva-lab-drawer';
const close=document.createElement('button');close.type='button';close.textContent='Cerrar ×';close.className='heva-lab-close';close.addEventListener('click',()=>{lab.open=false;desc.focus()});
const drawerTitle=document.createElement('h3');drawerTitle.textContent='Estrategias integradas';drawerTitle.className='font-bold text-lg text-[#8B2635]';
panel.append(close,drawerTitle);
while(desc.nextSibling)panel.append(desc.nextSibling);
lab.append(panel);
const overlay=document.createElement('div');overlay.id='heva-lab-overlay';overlay.className='heva-lab-overlay';overlay.addEventListener('click',()=>lab.open=false);
lab.append(overlay);
const style=document.createElement('style');style.textContent=`
#heva-unified-pedagogy{min-width:0}
#integrated-lab{padding:0!important;margin:0!important;background:transparent!important;border:0!important}
#integrated-lab>summary{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #d4a15b;border-radius:9px;padding:11px 12px;list-style:none;cursor:pointer;font-size:13px}
#integrated-lab>summary::-webkit-details-marker{display:none}
#integrated-lab[open]>summary{border-color:#8b2635}
.heva-lab-overlay{position:fixed;inset:0;background:rgba(28,24,21,.38);z-index:998}
.heva-lab-drawer{position:fixed;right:0;top:0;bottom:0;width:min(540px,94vw);overflow-y:auto;overscroll-behavior:contain;background:#fffaf4;box-shadow:-12px 0 35px #0003;z-index:999;padding:24px 22px 40px}
.heva-lab-close{float:right;background:#8b2635;color:white;border-radius:7px;padding:8px 12px;font-size:13px}
#lab-strategies details{position:relative}
#lab-strategies details>summary{display:flex;justify-content:space-between;align-items:center;gap:10px}
#lab-strategies details>summary::after{content:'›';font-size:22px;line-height:1}
#lab-strategies details[open]>summary::after{content:'‹'}
@media(min-width:950px){#lab-strategies{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start}#lab-strategies details{margin-top:0}#lab-strategies details[open]{background:#fff}}
@media(max-width:600px){.heva-lab-drawer{width:100vw;padding:17px 14px 35px}#lab-strategies details{max-height:45vh;overflow-y:auto}}
body:has(#integrated-lab[open]){overflow:hidden}
`;document.head.append(style);
function update(){
const active=enabled.checked;
strategy.querySelector('label')?.classList.toggle('opacity-60',active);
note.textContent=active?'Modo combinado activo: HEVA toma las estrategias del panel lateral. La estrategia principal sigue como referencia para compatibilidad con el generador.':'Modo habitual: se usa la estrategia principal. Activa el laboratorio para combinar varias.';
const summary=$('lab-summary');if(summary)summary.setAttribute('data-enabled',String(active));
}
enabled.addEventListener('change',update);update();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&lab.open){lab.open=false;desc.focus()}});
const mapping={fuentes:'FUENTES',modelado:'MODELADO',casos:'CASOS',lectura:'LECTURA',problemas:'PROBLEMAS',errores:'ERRORES'};
const reverse=Object.fromEntries(Object.entries(mapping).map(([a,b])=>[b,a]));
function primaryId(){const value=(legacy.value+' '+legacy.options[legacy.selectedIndex]?.text).toUpperCase();return Object.entries(mapping).find(([id,code])=>value.includes(code)||value.includes(({FUENTES:'FUENTE',MODELADO:'MODELAD',CASOS:'CASO',LECTURA:'LECTURA',PROBLEMAS:'PROBLEMA',ERRORES:'ERROR'})[code]))?.[0]||null}
function syncPrimary(){
const id=primaryId();const active=enabled.checked;
for(const check of document.querySelectorAll('#lab-strategies input[data-strategy]')){
const card=check.closest('div.border-b');const isPrimary=active&&id===check.dataset.strategy;
if(isPrimary){check.checked=false;check.disabled=true;if(card)card.style.display='none'}
else{check.disabled=false;if(card)card.style.display=''}
}
const notice=$('lab-primary-notice');if(notice)notice.textContent=active?'Estrategia principal incluida automáticamente: '+legacy.options[legacy.selectedIndex]?.text+'. No aparece duplicada en las combinadas.':'Activa el modo combinado para agregar estrategias complementarias.';
}
const primaryNotice=document.createElement('p');primaryNotice.id='lab-primary-notice';primaryNotice.className='text-xs text-stone-600 bg-white rounded p-2 mt-2';$('lab-strategies').before(primaryNotice);
legacy.addEventListener('change',syncPrimary);enabled.addEventListener('change',syncPrimary);
const observer=new MutationObserver(()=>syncPrimary());observer.observe($('lab-strategies'),{childList:true});
syncPrimary();

const original=window.hevaExperimentalPlan;
if(typeof original==='function')window.hevaExperimentalPlan=function(){
const plan=original();
if(!plan)return null;
const primary=primaryId();
if(primary&&plan.slots.some(s=>s.strategy===primary))throw Error('La estrategia principal ya está incluida; quita la repetición en las combinadas.');
return {...plan,primaryStrategy:legacy.value,subject:$('asignatura').value,objective:$('texto-oa').value,topic:$('tema-especifico').value};
};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
