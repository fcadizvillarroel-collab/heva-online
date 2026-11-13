/* Cada petición tiene un solo rol; conserva versiones y limita la corrección a una ronda. */
let qualityBusy=false,qualityMessage='';
function qualitySnapshot(m){const c=structuredClone(m);delete c.revisionIA;delete c.historialRevisionIA;delete c.version;delete c.materialId;return JSON.stringify(c)}
function showQuality(){
 let panel=document.getElementById('heva-quality-panel');if(!panel){panel=document.createElement('section');panel.id='heva-quality-panel';panel.className='no-print border rounded p-4 my-4 bg-amber-50';document.getElementById('hoja-material').before(panel)}
 if(!materialActual){panel.hidden=true;return}panel.hidden=false;
 const r=materialActual.revisionIA,e=hevaEscape;
 panel.innerHTML=`<h3 class="font-bold">Revisión pedagógica entre IA</h3><p class="text-sm">${e(qualityMessage||'Una IA distinta revisa el OA, el contenido, las tareas y la evaluación. La decisión final es docente.')}</p><p class="text-xs my-2">Autor: ${e(materialActual.autoriaIA?.proveedor||'no registrado')} · ${e(materialActual.autoriaIA?.modelo||'')}. ${r?'Revisor: '+e(r.proveedor)+' · '+e(r.modelo)+' · '+e(r.fecha):'Revisión independiente pendiente.'}</p>${r?`<p class="font-bold text-sm">${e(r.estado)} · Validación docente pendiente</p><p class="text-xs">${e(r.alcance)}</p><details><summary>Criterios y hallazgos (${r.hallazgos.length})</summary>${r.criterios.map(c=>`<p class="text-sm my-2"><b>${e(c.id)} · ${e(c.estado)}</b>: ${e(c.fundamento)}</p>`).join('')}${r.hallazgos.map(h=>`<div class="border-t pt-2 mt-2 text-sm"><b>${e(h.severidad)} · ${e(h.ubicacion)}</b><p>${e(h.problema)}</p><p>Evidencia: ${e(h.evidencia)}</p><p>Corrección propuesta: ${e(h.correccion)}</p></div>`).join('')}</details>`:''}<button id="quality-run" class="border rounded px-3 py-2 mt-3 font-bold" ${qualityBusy?'disabled':''}>${qualityBusy?'Revisión en curso…':'Revisar, corregir y verificar con otra IA'}</button><p class="text-xs mt-2">Hasta tres llamadas adicionales según cuota disponible. Sin internet se conserva el informe guardado. No se realiza investigación web automática.</p>`;
 panel.querySelector('button').onclick=()=>runQuality();
}
async function qualityRequest(action){
 syncEdits();const original=materialActual,snapshot=qualitySnapshot(original);
 const response=await fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:action,material:original}),signal:AbortSignal.timeout(58000)}),data=await response.json();
 if(!response.ok)throw Error(data.error||'Revisión pendiente.');
 syncEdits();if(materialActual!==original||qualitySnapshot(materialActual)!==snapshot)throw Error('El documento cambió durante la revisión. Revisa nuevamente la versión actual.');
 if(action==='revisar')materialActual.revisionIA=data.revision;
 else{guardarEnHistorial(false);materialActual=data.material;}
 guardarEnHistorial(false);renderizarDocumentoEnPantalla();return data;
}
async function runQuality(){
 if(qualityBusy||!materialActual)return;qualityBusy=true;
 try{
  qualityMessage='Otro proveedor está revisando el material…';showQuality();
  await qualityRequest('revisar');
  if(materialActual.revisionIA.hallazgos.length){qualityMessage='Se detectaron observaciones. Se guarda el original y se solicita una corrección…';showQuality();await qualityRequest('corregir');qualityMessage='La corrección está siendo revisada nuevamente por otro proveedor…';showQuality();await qualityRequest('revisar');}
  qualityMessage=materialActual.revisionIA.hallazgos.length?'Persisten observaciones: revisa los hallazgos antes de aplicar el material.':'Revisión independiente completada. Comprueba los criterios no verificables y valida el material como docente.';
 }catch(e){qualityMessage=e.message||'Revisión incompleta. Se conserva el material.';}
 finally{qualityBusy=false;showQuality();}
}
const qualityRender=renderizarDocumentoEnPantalla;renderizarDocumentoEnPantalla=function(){qualityRender();showQuality()};
const qualitySync=syncEdits;syncEdits=function(){const before=materialActual?qualitySnapshot(materialActual):'';qualitySync();if(materialActual?.revisionIA&&qualitySnapshot(materialActual)!==before){materialActual.revisionIA.estado='desactualizada_por_edicion';qualityMessage='El documento fue editado: el informe anterior debe renovarse.';showQuality()}};
const qualityGenerate=generarMaterialReal;generarMaterialReal=async function(...args){const previous=materialActual;await qualityGenerate(...args);if(materialActual&&materialActual!==previous){qualityMessage='';await runQuality()}};
