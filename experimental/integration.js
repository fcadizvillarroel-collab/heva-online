/* HEVA Experimental: deterministic integrated activity/question planning. No API calls. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVAIntegration=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const max={alternativas:30,desarrollo:20,lecturas:12};
function plan(input){
const strategies=input.strategies||[],counts=input.counts||{},mode=input.mode||'auto',manual=input.manual||{};
if(!['auto','manual'].includes(mode))throw Error('Modo inválido');
if(!strategies.length||strategies.length>8)throw Error('Selecciona entre una y ocho estrategias');
const ids=new Set();let total=0;
for(const s of strategies){if(!s.id||ids.has(s.id))throw Error('Estrategia duplicada o sin identificador');ids.add(s.id);if(!Number.isInteger(s.quantity)||s.quantity<1||s.quantity>12)throw Error('Cantidad de actividades inválida');total+=s.quantity}
if(total>35)throw Error('Máximo 35 actividades');
for(const k of Object.keys(max))if(!Number.isInteger(counts[k])||counts[k]<0||counts[k]>max[k])throw Error('Cantidad inválida: '+k);
const slots=[];for(const s of strategies)for(let i=1;i<=s.quantity;i++)slots.push({id:s.id+'-'+i,strategy:s.id,number:i,alternativas:0,desarrollo:0,lecturas:0});
const affinity=(kind,k)=>k==='lecturas'?(/fuente|lectura|texto|caso|testimonio|documento|historia|argument|cartograf|debate|controvers|cronolog|multicaus|tresp/.test(kind)?4:1):k==='alternativas'?(/caso|fuente|lectura|error|problema|dato|compar|diagnost|fall|multicaus|graf|mapa/.test(kind)?3:1):(/modelo|caso|problema|argument|debate|proyecto|fuente|indag|escrit|error|multicaus/.test(kind)?3:1);
if(mode==='manual'){
for(const slot of slots){const m=manual[slot.id]||{};for(const k of Object.keys(max)){const n=m[k]??0;if(!Number.isInteger(n)||n<0||n>max[k])throw Error('Cantidad manual inválida en '+slot.id);slot[k]=n}}
for(const k of Object.keys(max))if(slots.reduce((a,s)=>a+s[k],0)!==counts[k])throw Error('La distribución manual de '+k+' no coincide con el total solicitado');
}else{
for(const k of Object.keys(max)){
const n=counts[k];if(!n)continue;
const candidates=slots.map((s,i)=>({i,weight:affinity(s.strategy,k)})).sort((a,b)=>b.weight-a.weight||a.i-b.i);
for(let j=0;j<n;j++){const index=candidates[j%candidates.length].i;slots[index][k]++}
}}
const reading=slots.reduce((a,s)=>a+s.lecturas,0);
return{mode,totalActivities:total,counts:{...counts},slots,readingIntegrated:reading,extraCases:0,notes:['Las situaciones de lectura/análisis se integran en las actividades existentes; no crean actividades adicionales.','Cada actividad debe contener un contexto distinto y completo, sin duplicar enunciados.','Las preguntas se asignan a las actividades, no se agregan como un bloque repetido.','La pauta de respuestas se mantiene separada de la versión del estudiante.']};
}
function validate(plan){const errors=[];for(const k of Object.keys(max))if(plan.slots.reduce((a,s)=>a+s[k],0)!==plan.counts[k])errors.push('Descuadre de '+k);if(new Set(plan.slots.map(s=>s.id)).size!==plan.slots.length)errors.push('Actividades duplicadas');return{ok:errors.length===0,errors}}
return{plan,validate,max};
});
