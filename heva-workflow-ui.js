/* Diseño previo editable y control local antes de exportar. No requiere llamadas de IA. */
let designContext='',designReady=false,workflowAuditTimer;
const designLabels={contenidos:'Contenidos que se trabajarán',habilidades:'Habilidades que se pondrán en práctica',actividades:'Actividades y secuencia de trabajo',evidencias:'Evidencias de aprendizaje',criteriosEvaluacion:'Criterios para valorar el desempeño'};
function planFormularioHEVA(){const value=id=>document.getElementById(id)?.value||'';return{asignatura:value('asignatura'),nivel:value('nivel-epja'),marcoCurricular:value('marco-curricular'),tipoMaterial:value('tipo-material'),objetivoAprendizaje:value('texto-oa'),temaEspecifico:value('tema-especifico'),estrategiaDidactica:value('estrategia-didactica')};}
function actualizarDisenoHEVA(force=false){
 const plan=planFormularioHEVA(),key=JSON.stringify(plan);
 if(!force&&designReady&&designContext===key)return;
 designContext=key;designReady=true;
 const d=HEVADesign.defaults(plan,HEVAPedagogy),e=hevaEscape;
 const box=document.getElementById('heva-design-panel');
 box.innerHTML=`<h3 class="font-bold text-[#8B2635]">Diseño pedagógico antes de generar</h3><p class="text-xs my-2">Propuesta inicial para editar. Los cambios se envían a la IA junto con el objetivo, el tipo y las cantidades seleccionadas. Al cambiar asignatura, nivel, OA, tema, tipo o estrategia se prepara una propuesta nueva.</p><label class="block text-xs font-bold">Objetivo curricular seleccionado<textarea readonly id="design-oa" class="w-full border rounded p-2 font-normal" rows="3">${e(d.objetivoAprendizaje)}</textarea></label><button type="button" id="design-edit-oa" class="underline text-xs">Editar objetivo en la planificación</button><p class="text-xs my-2"><b>Estrategia:</b> ${e(d.estrategiaDidactica)}. Se puede cambiar en el selector de estrategia.</p>${HEVADesign.fields.map(k=>`<label class="block text-xs font-bold my-3">${e(designLabels[k])}<textarea id="design-${k}" class="w-full border rounded p-2 font-normal" rows="3" maxlength="3000">${e(d[k])}</textarea></label>`).join('')}<button type="button" id="design-reset" class="border rounded px-3 py-2 text-xs">Restablecer propuesta inicial</button><p id="design-state" class="text-xs mt-2">Diseño editable · no certifica alineación curricular.</p>`;
 box.querySelector('#design-edit-oa').onclick=()=>{document.getElementById('texto-oa').focus();document.getElementById('texto-oa').scrollIntoView({block:'center',behavior:'smooth'})};
 box.querySelector('#design-reset').onclick=()=>actualizarDisenoHEVA(true);
 box.querySelectorAll('textarea:not([readonly])').forEach(x=>x.addEventListener('input',()=>{document.getElementById('design-state').textContent='Cambios docentes incluidos en el próximo material.'}));
}
function leerDisenoHEVA(){actualizarDisenoHEVA();const p=planFormularioHEVA(),d={objetivoAprendizaje:p.objetivoAprendizaje,estrategiaDidactica:p.estrategiaDidactica};HEVADesign.fields.forEach(k=>d[k]=document.getElementById('design-'+k).value.trim());const issues=HEVADesign.validate(d,p);if(issues.length)throw Error(issues.join('; '));return d;}
const designPanel=document.createElement('section');designPanel.id='heva-design-panel';designPanel.className='border rounded p-4 bg-amber-50 my-4';document.getElementById('btn-generar').before(designPanel);actualizarDisenoHEVA();
for(const id of ['asignatura','nivel-epja','marco-curricular','tipo-material','texto-oa','tema-especifico','estrategia-didactica','select-oa'])document.getElementById(id)?.addEventListener('change',()=>setTimeout(()=>actualizarDisenoHEVA(),0));
const designCurriculum=actualizarObjetivosYEstrategias;actualizarObjetivosYEstrategias=async function(...args){await designCurriculum(...args);actualizarDisenoHEVA()};
const designGenerate=generarMaterialReal;generarMaterialReal=async function(...args){try{leerDisenoHEVA()}catch(e){alert(e.message);return}return designGenerate(...args)};

function auditHTMLHEVA(report){const e=hevaEscape,labels={error_comprobado:'Errores comprobados',sugerencia:'Sugerencias de revisión',no_verificable:'Aspectos no verificables automáticamente'};return `<p class="text-sm font-bold">${report.errores.length} errores comprobados · ${report.sugerencias.length} sugerencias · ${report.noVerificables.length} aspectos no verificables</p><p class="text-xs my-2">Claves: ${Object.entries(report.distribucion.counts).map(([k,n])=>k+': '+n).join(' · ')}. ${report.distribucion.balanced?'Distribución equilibrada.':'Revisar equilibrio de respuestas.'}</p>${Object.entries(labels).map(([tipo,title])=>`<details ${tipo==='error_comprobado'&&report.errores.length?'open':''} class="border-t pt-2 mt-2"><summary class="font-bold text-sm">${title} (${report.issues.filter(x=>x.tipo===tipo).length})</summary>${report.issues.filter(x=>x.tipo===tipo).map(x=>`<div class="text-xs my-3"><b>${e(x.ubicacion)}</b>: ${e(x.problema)}<p>${e(x.correccion)}</p></div>`).join('')||'<p class="text-xs">Sin incidencias de este tipo detectadas.</p>'}</details>`).join('')}<p class="text-xs mt-3">${e(report.alcance)}</p>`;}
async function informeExportacionHEVA(){
 syncEdits();const m=materialActual,report=HEVAAudit.inspect(m),review=m.revisionIA;
 let current=false;
 if(review?.huella&&crypto.subtle){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(HEVAAudit.snapshot(m)));current=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')===review.huella;}
 const add=(id,tipo,problema,correccion)=>{const x={id,tipo,ubicacion:'revision_IA',problema,correccion};report.issues.push(x);report[tipo==='error_comprobado'?'errores':tipo==='sugerencia'?'sugerencias':'noVerificables'].push(x);};
 if(!review||!current||review.estado==='desactualizada_por_edicion')add('revision_pendiente','no_verificable',review?'La revisión independiente no corresponde al contenido actual o su vigencia no pudo comprobarse.':'No hay revisión independiente guardada.','Revisar con otra IA cuando haya conexión y cuota, o realizar la revisión docente.');
 else{
  for(const h of review.hallazgos||[])if(!report.issues.some(x=>h.comprobacionId&&x.id===h.comprobacionId))add('ia_'+report.issues.length,['error_comprobado','sugerencia','no_verificable'].includes(h.tipo)?h.tipo:'no_verificable',h.ubicacion+': '+h.problema,h.correccion);
  for(const c of review.criterios||[])if(c.estado==='no_verificable')add('criterio_'+c.id,'no_verificable',c.id+': '+c.fundamento,'Contrastar la evidencia y validar como docente.');
 }
 report.exportable=!report.errores.length;return report;
}
function mostrarControlHEVA(){let panel=document.getElementById('heva-export-control');if(!panel){panel=document.createElement('section');panel.id='heva-export-control';panel.className='no-print border rounded p-4 my-4 bg-white';document.getElementById('hoja-material').before(panel)}if(!materialActual){panel.hidden=true;return}panel.hidden=false;const report=HEVAAudit.inspect(materialActual);panel.innerHTML=`<h3 class="font-bold text-[#8B2635]">Control de calidad antes de exportar</h3>${auditHTMLHEVA(report)}<button type="button" class="border rounded px-3 py-2 text-xs mt-3" id="audit-open">Revisar antes de descargar</button>`;panel.querySelector('button').onclick=()=>prepararExportacionHEVA(null);}
async function prepararExportacionHEVA(format){
 if(!materialActual)return;
 try{
  const reference=materialActual,report=await informeExportacionHEVA();if(reference!==materialActual)return;
  const snapshot=HEVAAudit.snapshot(materialActual);
  let dialog=document.getElementById('heva-export-dialog');if(dialog){if(dialog.open)dialog.close();dialog.remove()}
  dialog=document.createElement('dialog');dialog.id='heva-export-dialog';dialog.className='rounded p-6 border shadow-xl';dialog.style.cssText='width:min(720px,94vw);max-height:90vh;overflow:auto';
  dialog.innerHTML=`<h2 class="text-lg font-bold text-[#8B2635]">Revisión previa${format?' · '+hevaEscape(format):''}</h2>${auditHTMLHEVA(report)}<p class="text-sm my-3">${report.exportable?'Comprueba las sugerencias y los aspectos pendientes. Descargar no equivale a certificar la calidad pedagógica.':'Corrige los errores comprobados antes de descargar. El documento sigue disponible para editar y guardar.'}</p><div class="flex gap-3 mt-4"><button type="button" id="audit-back" class="border rounded px-3 py-2">Volver a editar</button>${format&&report.exportable?`<button type="button" id="audit-download" class="border rounded px-3 py-2 font-bold">${report.sugerencias.length||report.noVerificables.length?'Descargar con observaciones':'Descargar'} ${hevaEscape(format)}</button>`:''}</div>`;
  document.body.appendChild(dialog);dialog.querySelector('#audit-back').onclick=()=>dialog.close();
  dialog.querySelector('#audit-download')?.addEventListener('click',async()=>{syncEdits();if(reference!==materialActual||snapshot!==HEVAAudit.snapshot(materialActual)){dialog.close();alert('El documento cambió. Revisa nuevamente antes de exportar.');return}dialog.close();const teacher=!!document.getElementById('incluir-pauta')?.checked;try{await (format==='Word'?HEVAOffice.word(materialActual,teacher):HEVAOffice.powerpoint(materialActual,teacher))}catch(e){alert('No se pudo exportar: '+e.message)}});
  dialog.showModal();
 }catch(e){alert('No se pudo completar el control: '+e.message)}
}
exportarWord=()=>prepararExportacionHEVA('Word');exportarPowerPoint=()=>prepararExportacionHEVA('PowerPoint');
const workflowRender=renderizarDocumentoEnPantalla;renderizarDocumentoEnPantalla=function(){workflowRender();mostrarControlHEVA()};
document.getElementById('hoja-material').addEventListener('input',()=>{clearTimeout(workflowAuditTimer);workflowAuditTimer=setTimeout(()=>{syncEdits();mostrarControlHEVA()},400)});
