/* Diseño previo editable y control local antes de exportar. No requiere llamadas de IA. */
let designContext='',designReady=false,workflowAuditTimer;
const designLabels={habilidades:'Habilidades que se pondrán en práctica',actividades:'Actividades y secuencia de trabajo',evidencias:'Evidencias de aprendizaje',criteriosEvaluacion:'Criterios para valorar el desempeño'};
function planFormularioHEVA(){const value=id=>document.getElementById(id)?.value||'';return{asignatura:value('asignatura'),nivel:value('nivel-epja'),marcoCurricular:value('marco-curricular'),tipoMaterial:value('tipo-material'),objetivoAprendizaje:value('texto-oa'),temaEspecifico:value('tema-especifico'),estrategiaDidactica:value('estrategia-didactica')};}
function actualizarDisenoHEVA(force=false){
 const plan=planFormularioHEVA(),key=JSON.stringify(plan);
 if(!force&&designReady&&designContext===key)return;
 designContext=key;designReady=true;
 if(!globalThis.HEVADesign){const box=document.getElementById('heva-design-panel');if(box)box.textContent='Diseño avanzado temporalmente no disponible. La generación básica sigue habilitada.';return;} const d=globalThis.HEVADesign.defaults(plan,HEVAPedagogy),e=hevaEscape;
 const box=document.getElementById('heva-design-panel');
 box.innerHTML=`<h3 class="font-bold text-[#8B2635]">Secuencia y evidencias de aprendizaje</h3><p class="text-xs my-2">El objetivo, tema y estrategia principal ya están seleccionados arriba. Aquí puedes ajustar las habilidades, la secuencia de actividades, las evidencias y los criterios de evaluación. Si cambias la selección curricular se propondrá un diseño actualizado.</p><button type="button" id="design-edit-oa" class="underline text-xs">Volver al OA seleccionado</button><p class="text-xs my-2"><b>Enfoque disciplinar:</b> ${e(HEVADidactics.profile(plan.asignatura).name)}</p>${globalThis.HEVADesign.fields.filter(k=>k!=='contenidos').map(k=>`<label class="block text-xs font-bold my-3">${e(designLabels[k])}<textarea id="design-${k}" class="w-full border rounded p-2 font-normal" rows="3" maxlength="3000">${e(d[k])}</textarea></label>`).join('')}<button type="button" id="design-reset" class="border rounded px-3 py-2 text-xs">Restablecer propuesta inicial</button><p id="design-state" class="text-xs mt-2">Diseño editable · no certifica alineación curricular.</p>`;
 box.querySelector('#design-edit-oa').onclick=()=>{document.getElementById('texto-oa').focus();document.getElementById('texto-oa').scrollIntoView({block:'center',behavior:'smooth'})};
 box.querySelector('#design-reset').onclick=()=>actualizarDisenoHEVA(true);
 box.querySelectorAll('textarea:not([readonly])').forEach(x=>x.addEventListener('input',()=>{document.getElementById('design-state').textContent='Cambios docentes incluidos en el próximo material.'}));
}
function leerDisenoHEVA(){if(!globalThis.HEVADesign)return null;actualizarDisenoHEVA();const p=planFormularioHEVA(),d={objetivoAprendizaje:p.objetivoAprendizaje,estrategiaDidactica:p.estrategiaDidactica};globalThis.HEVADesign.fields.forEach(k=>d[k]=k==='contenidos'?p.temaEspecifico:document.getElementById('design-'+k).value.trim());d.profundidad=document.getElementById('design-depth').value;d.contextualizacion=document.getElementById('design-context').value;d.apoyosProfundidad={modelado:document.getElementById('design-modelado').checked,ausencias:document.getElementById('design-ausencias').checked,desafio:document.getElementById('design-desafio').checked};const issues=globalThis.HEVADesign.validate(d,p);if(issues.length)throw Error(issues.join('; '));return d;}
const designPanel=document.createElement('section');designPanel.id='heva-design-panel';designPanel.className='space-y-3 mt-3';const designDetails=document.createElement('details');designDetails.id='heva-design-details';designDetails.className='no-print';designDetails.style.cssText='padding:14px;margin:12px 0;border:1px solid #c9bba9;border-radius:12px;background:#fff7ed';designDetails.open=false;designDetails.innerHTML='<summary style="cursor:pointer"><strong>Diseño pedagógico antes de generar · clic para ocultar o desplegar ▼</strong></summary><p>Ajusta las tareas, las evidencias y la evaluación sin volver a escribir el objetivo o los contenidos. Si no cambias nada, HEVA utiliza la propuesta inicial.</p>';document.getElementById('btn-generar').before(designDetails);designDetails.insertAdjacentHTML('afterend',"<details id=\"heva-depth-details\" class=\"mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3\"><summary class=\"font-bold text-sm cursor-pointer\">Profundidad y contextualización · opcional</summary><p class=\"text-xs mt-2\">Despliega para ajustar profundidad, contexto y apoyos. Si no cambias nada, se aplican las opciones predeterminadas.</p><label class=\"block text-xs font-bold my-2\">Profundidad conceptual<select id=\"design-depth\" class=\"w-full border rounded p-2 font-normal\"><option value=\"profunda\">Profunda · explicaciones, relaciones y aplicación</option><option value=\"esencial\">Esencial · conceptos clave y práctica breve</option><option value=\"intermedia\">Intermedia · práctica progresiva</option><option value=\"avanzada\">Avanzada · análisis crítico y fuentes</option></select></label><label class=\"block text-xs font-bold my-2\">Contexto de las actividades<select id=\"design-context\" class=\"w-full border rounded p-2 font-normal\"><option value=\"epja_local\">EPJA y entorno local, cuando sea pertinente</option><option value=\"adulto\">Vida adulta general</option><option value=\"laboral_ciudadano\">Situaciones laborales y ciudadanas pertinentes</option></select></label><label class=\"flex gap-2 text-xs my-2\"><input type=\"checkbox\" id=\"design-modelado\" checked> Ejemplos resueltos y práctica progresiva (solo materiales formativos)</label><label class=\"flex gap-2 text-xs my-2\"><input type=\"checkbox\" id=\"design-ausencias\" checked> Apoyos para retomar después de ausencias</label><label class=\"flex gap-2 text-xs my-2\"><input type=\"checkbox\" id=\"design-desafio\" checked> Desafíos de transferencia con situaciones nuevas</label></details>");designDetails.appendChild(designPanel);try{actualizarDisenoHEVA()}catch(err){console.error('HEVA: diseño pendiente',err);designPanel.innerHTML='<p class="text-xs text-amber-800">Los campos de diseño se cargarán al seleccionar un objetivo. Las opciones de profundidad y contexto están disponibles arriba.</p>';}
for(const id of ['asignatura','nivel-epja','marco-curricular','tipo-material','texto-oa','tema-especifico','estrategia-didactica','select-oa'])document.getElementById(id)?.addEventListener('change',()=>actualizarDisenoHEVA());
for(const id of ['texto-oa','tema-especifico'])document.getElementById(id)?.addEventListener('input',()=>actualizarDisenoHEVA());
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
function equilibrarClavesHEVA(){
 if(!materialActual)return;syncEdits();const next=JSON.parse(JSON.stringify(materialActual)),result=HEVASkills.balanceKeys(next);
 if(result.status!=='equilibrado'){alert('No se pueden reordenar automáticamente estas preguntas sin cambiar su significado. '+(result.motivo||'Revisa las opciones y sus claves.')+(result.blockedRefs?.length?' Ítems: '+result.blockedRefs.join(', '):''));return;}
 if(!result.changed){mostrarControlHEVA();return;}
 guardarEnHistorial(false);if(next.revisionIA)next.historialRevisionIA=[...(next.historialRevisionIA||[]),next.revisionIA];delete next.revisionIA;delete next.auditoriaExperimental;
 next.edicionesLocales=[...(next.edicionesLocales||[]),{tipo:'equilibrio_claves',fecha:new Date().toISOString(),preguntasReordenadas:result.changed,distribucion:result.counts}];if(next.procedimientosHEVA?.evaluacion)next.procedimientosHEVA.evaluacion.equilibrio=result;
 materialActual=next;renderizarDocumentoEnPantalla();guardarEnHistorial(false);
}
function mostrarControlHEVA(){let panel=document.getElementById('heva-export-control');if(!panel){panel=document.createElement('section');panel.id='heva-export-control';panel.className='no-print border rounded p-4 my-4 bg-white';document.getElementById('hoja-material').before(panel)}if(!materialActual){panel.hidden=true;return}panel.hidden=false;const report=HEVAAudit.inspect(materialActual);panel.innerHTML=`<h3 class="font-bold text-[#8B2635]">Control de calidad antes de exportar</h3>${auditHTMLHEVA(report)}<button type="button" class="border rounded px-3 py-2 text-xs mt-3" id="audit-open">Revisar antes de descargar</button>`;panel.querySelector('button').onclick=()=>prepararExportacionHEVA(null);if(!report.distribucion.balanced){const balance=document.createElement('button');balance.type='button';balance.textContent='Equilibrar claves A–D conservando las respuestas';balance.className='border rounded px-3 py-2 text-xs mt-3 ml-2 font-bold';balance.onclick=equilibrarClavesHEVA;panel.append(balance);}}
async function prepararExportacionHEVA(format){
 if(!materialActual)return;
 try{
  const reference=materialActual,report=await informeExportacionHEVA();if(reference!==materialActual)return;
  const discipline=materialActual.auditoriaDisciplinar;
  const pendingReview=!materialActual.revisionIA||materialActual.revisionIA.estado==='desactualizada_por_edicion'||materialActual.revisionIA.integridadInforme==='parcial';
  const disciplineNote=discipline?'<details class="my-3 border rounded p-3"><summary class="font-bold">Auditoría disciplinar: '+hevaEscape(discipline.disciplina||'general')+' · '+(discipline.incidencias||[]).length+' observaciones</summary><p class="text-xs my-2">Esta auditoría es heurística y no certifica el contenido.</p>'+(discipline.incidencias||[]).slice(0,20).map(i=>'<p class="text-xs border-t py-1">'+hevaEscape((i.referencia||'Material')+' · '+i.detalle)+'</p>').join('')+'</details>':'<p class="text-sm">Auditoría disciplinar aún no disponible para esta versión.</p>';
  const reviewNote=pendingReview?'<p class="text-sm font-bold text-amber-900">Revisión independiente pendiente o parcial. Exportar no implica aprobación curricular ni disciplinar.</p>':'<p class="text-sm">Informe independiente disponible; la aprobación docente continúa pendiente.</p>';
  const officeReport=globalThis.HEVAOffice?.auditExport?.(materialActual,!!document.getElementById('incluir-pauta')?.checked);
  const officeNote=officeReport?'<details class="my-3 border rounded p-3" open><summary class="font-bold">Auditoría de exportación · estimación '+officeReport.estimatedSlides+' diapositivas</summary><p class="text-xs my-2">Estimación previa basada en bloques; no sustituye la inspección visual del archivo final.</p>'+officeReport.issues.map(i=>'<p class="text-xs border-t py-1">'+hevaEscape(i.detail)+'</p>').join('')+'</details>':'';
  const snapshot=HEVAAudit.snapshot(materialActual);
  let dialog=document.getElementById('heva-export-dialog');if(dialog){if(dialog.open)dialog.close();dialog.remove()}
  dialog=document.createElement('dialog');dialog.id='heva-export-dialog';dialog.className='rounded p-6 border shadow-xl';dialog.style.cssText='width:min(720px,94vw);max-height:90vh;overflow:auto';
  dialog.innerHTML=`<h2 class="text-lg font-bold text-[#8B2635]">Revisión previa${format?' · '+hevaEscape(format):''}</h2>${auditHTMLHEVA(report)}${disciplineNote}${officeNote}${reviewNote}<p class="text-sm my-3">${report.exportable?'Comprueba las sugerencias y los aspectos pendientes. Descargar no equivale a certificar la calidad pedagógica.':'Corrige los errores comprobados antes de descargar. El documento sigue disponible para editar y guardar.'}</p><div class="flex gap-3 mt-4"><button type="button" id="audit-back" class="border rounded px-3 py-2">Volver a editar</button>${format&&report.exportable?`<button type="button" id="audit-download" class="border rounded px-3 py-2 font-bold">${report.sugerencias.length||report.noVerificables.length?'Descargar con observaciones':'Descargar'} ${hevaEscape(format)}</button>`:''}</div>`;
  document.body.appendChild(dialog);dialog.querySelector('#audit-back').onclick=()=>dialog.close();
  dialog.querySelector('#audit-download')?.addEventListener('click',async()=>{syncEdits();if(reference!==materialActual||snapshot!==HEVAAudit.snapshot(materialActual)){dialog.close();alert('El documento cambió. Revisa nuevamente antes de exportar.');return}dialog.close();const teacher=!!document.getElementById('incluir-pauta')?.checked;try{await (format==='Word'?HEVAOffice.word(materialActual,teacher):HEVAOffice.powerpoint(materialActual,teacher))}catch(e){alert('No se pudo exportar: '+e.message)}});
  dialog.showModal();
 }catch(e){alert('No se pudo completar el control: '+e.message)}
}
exportarWord=()=>prepararExportacionHEVA('Word');exportarPowerPoint=()=>prepararExportacionHEVA('PowerPoint');
const workflowRender=renderizarDocumentoEnPantalla;renderizarDocumentoEnPantalla=function(){workflowRender();mostrarControlHEVA()};
document.getElementById('hoja-material').addEventListener('input',()=>{clearTimeout(workflowAuditTimer);workflowAuditTimer=setTimeout(()=>{syncEdits();mostrarControlHEVA()},400)});

// El perfil contiene preferencias del curso. El catálogo conserva la selección de OA.
(function mountCourseWorkflow(){
 const workflow=globalThis.HEVACourseWorkflow;
 const host=document.getElementById('marco-curricular');
 if(!workflow||!host)return;
 const el=(tag,text)=>{const element=document.createElement(tag);if(text)element.textContent=text;return element;};
 const byId=id=>document.getElementById(id);
 const fields={marco:'marco-curricular',nivel:'nivel-epja',asignatura:'asignatura',tipo:'tipo-material'};
 const details=el('details');details.className='no-print border rounded p-2 my-2';
 details.append(el('summary','Perfiles de curso guardados'));
 const info=el('p','Guarda el marco, nivel, asignatura y tipo de material en este navegador.');
 const name=el('input');name.id='heva-course-profile-name';name.maxLength=60;name.className='border rounded px-2';
 const nameLabel=el('label','Nombre del perfil');nameLabel.htmlFor=name.id;
 const saved=el('select');saved.id='heva-course-profile-select';saved.className='border rounded px-2';
 const savedLabel=el('label','Perfil guardado');savedLabel.htmlFor=saved.id;
 const status=el('p');status.setAttribute('role','status');
 const button=(label,action)=>{const b=el('button',label);b.type='button';b.className='border rounded px-2 py-1';b.onclick=action;return b;};
 const row=el('div');row.className='flex flex-wrap items-center gap-2 my-2';
 let cloud=null;
 const storage=()=>cloud?.storage||window.localStorage;
 const syncStatus=el('p');syncStatus.setAttribute('role','status');
 const syncForm=el('form');
 const email=el('input');email.type='email';email.required=true;email.autocomplete='username';email.setAttribute('aria-label','Correo de la cuenta');
 const password=el('input');password.type='password';password.required=true;password.autocomplete='current-password';password.setAttribute('aria-label','Contraseña de la cuenta');
 const login=el('button','Iniciar sesión para sincronizar');login.type='submit';
 syncForm.append(email,password,login);
 const api=async (action,values={})=>{
  const response=await fetch('/api/course-profiles',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({action,...values}),signal:AbortSignal.timeout(12000)});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||'La sincronización no está disponible.');
  return data;
 };
 let syncing=false;
 function loadCloud(remote){
  const profiles=workflow.parseProfileBackup(remote.perfiles);
  const snapshot=JSON.stringify(profiles);
  cloud.snapshot=snapshot;
  cloud.storage={getItem:()=>cloud.snapshot,setItem:(_key,next)=>{cloud.snapshot=next;cloud.dirty=true;}};
  cloud.revision=remote.revision;
  cloud.accountId=remote.accountId;
  cloud.dirty=false;
 }
 async function synchronize(){
  if(!cloud||syncing||navigator.onLine===false)return;
  syncing=true;
  try{
   if(cloud.dirty){
    const snapshot=cloud.snapshot;
    const remote=await api('write',{accountId:cloud.accountId,revision:cloud.revision,backup:workflow.exportProfiles(storage())});
    cloud.revision=remote.revision;
    cloud.dirty=cloud.snapshot!==snapshot;
    syncStatus.textContent='Perfiles sincronizados.';
   }else{
    const remote=await api('read',{accountId:cloud.accountId});
    if(remote.revision!==cloud.revision&&!cloud.dirty){loadCloud(remote);refresh(saved.value);}
   }
  }catch(error){syncStatus.textContent=error.message+' Puedes descargar los perfiles de esta sesión como respaldo.';}
  finally{syncing=false;}
 }
 syncForm.addEventListener('submit',async event=>{
  event.preventDefault();login.disabled=true;
  try{
   await api('login',{email:email.value,password:password.value});
   const remote=await api('read');
   connectCloud(remote);
   syncStatus.textContent='Sesión sincronizada. Los perfiles guardados en este navegador se muestran al cerrar sesión.';
  }catch(error){await api('logout').catch(()=>{});syncStatus.textContent=error.message;}
  finally{password.value='';login.disabled=false;}
 });
 function connectCloud(remote){
  cloud={};loadCloud(remote);
  refresh();syncForm.hidden=true;logout.hidden=false;reloadCloud.hidden=false;
  try{sessionStorage.setItem('heva-course-sync-active','1');}catch{}
 }
 const logout=button('Cerrar sesión de perfiles',async()=>{
  if(syncing||!cloud)return;
  if(cloud.dirty&&!confirm('Hay cambios sin sincronizar. ¿Cerrar la sesión y descartar esos cambios?'))return;
  syncing=true;
  try{
   await api('logout');cloud=null;refresh();
   try{sessionStorage.removeItem('heva-course-sync-active');}catch{}
   syncForm.hidden=false;logout.hidden=true;reloadCloud.hidden=true;
   syncStatus.textContent='Sesión cerrada. Se muestran los perfiles locales.';
  }catch(error){syncStatus.textContent=error.message;}
  finally{syncing=false;}
 });
 logout.hidden=true;
 const reloadCloud=button('Recargar perfiles de la cuenta',async()=>{
  if(syncing||!cloud)return;
  if(cloud.dirty&&!confirm('¿Descartar los cambios pendientes y cargar la versión de la cuenta?'))return;
  syncing=true;
  const snapshot=cloud.snapshot;
  try{
   const remote=await api('read',{accountId:cloud.accountId});
   if(cloud.snapshot!==snapshot)throw Error('Hay cambios nuevos. Vuelve a solicitar la recarga.');
   loadCloud(remote);refresh();syncStatus.textContent='Perfiles de la cuenta actualizados.';
  }
  catch(error){syncStatus.textContent=error.message;}
  finally{syncing=false;}
 });
 reloadCloud.hidden=true;
 window.addEventListener('online',synchronize);
 window.addEventListener('focus',synchronize);
 window.addEventListener('beforeunload',event=>{if(cloud?.dirty)event.preventDefault();});
 setInterval(synchronize,30000);
 const value=()=>workflow.readProfiles(storage()).find(entry=>entry.id===saved.value);
 const refresh=id=>{
  const options=workflow.readProfiles(storage()).map(entry=>{const option=el('option',entry.name);option.value=entry.id;return option;});
  const placeholder=el('option','Selecciona un perfil');placeholder.value='';
  saved.replaceChildren(placeholder,...options);saved.value=id||'';
 };
 const run=async action=>{
  for(const control of [save,apply,remove,exportProfiles,importProfiles,file])control.disabled=true;
  try{await action();await synchronize();}catch(error){status.textContent=error.message||'No se pudo leer o guardar el perfil.';}
  finally{for(const control of [save,apply,remove,exportProfiles,importProfiles,file])control.disabled=false;}
 };
 const save=button('Guardar perfil',()=>run(()=>{
  const course=workflow.saveProfile(storage(),{name:name.value,...Object.fromEntries(Object.entries(fields).map(([k,id])=>[k,byId(id).value]))});
  refresh(course.id);status.textContent='Perfil guardado en este navegador.';
 }));
 const apply=button('Aplicar perfil',()=>run(async()=>{
  const course=value();
  if(!course)throw Error('Selecciona un perfil guardado.');
  const supports=(control,v)=>Array.from(control.options).some(option=>option.value===v);
  const marco=byId(fields.marco),nivel=byId(fields.nivel),tipo=byId(fields.tipo);
  if(!supports(marco,course.marco)||!supports(nivel,course.nivel)||!supports(tipo,course.tipo)||
    !ESTRUCTURA_CURRICULAR[course.marco]?.[course.nivel]?.includes(course.asignatura)){
   throw Error('La configuración de este perfil ya no está disponible.');
  }
  marco.value=course.marco;nivel.value=course.nivel;
  await actualizarTodoElCurriculo(course.asignatura);
  tipo.value=course.tipo;tipo.dispatchEvent(new Event('change',{bubbles:true}));
  status.textContent='Perfil aplicado. Selecciona el objetivo para este material.';
 }));
 const remove=button('Eliminar perfil',()=>run(()=>{
  const course=value();
  if(!course)throw Error('Selecciona un perfil guardado.');
  if(!confirm('¿Eliminar el perfil «'+course.name+'»?'))return;
  workflow.removeProfile(storage(),course.id);
  refresh();name.value='';status.textContent='Perfil eliminado.';
 }));
 const file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
 const exportProfiles=button('Descargar perfiles',()=>run(()=>{
  if(!workflow.readProfiles(storage()).length)throw Error('Guarda un perfil antes de descargarlo.');
  HEVAOffice.download(new Blob([workflow.exportProfiles(storage())],{type:'application/json'}),'HEVA_perfiles_curso.json');
 }));
 const importProfiles=button('Importar perfiles',()=>file.click());
 file.addEventListener('change',()=>run(async()=>{
  const backup=file.files?.[0];file.value='';
  if(!backup)return;
  if(backup.size>75000)throw Error('El respaldo de perfiles es demasiado grande.');
  const {added,kept}=workflow.importProfiles(storage(),await backup.text());
  refresh(saved.value);
  status.textContent='Perfiles importados: '+added+'. Perfiles locales conservados con el mismo nombre: '+kept+'.';
 }));
 saved.addEventListener('change',()=>{name.value=value()?.name||'';});
 row.append(nameLabel,name,save,savedLabel,saved,apply,remove,exportProfiles,importProfiles,file);
 const account=el('details');account.hidden=true;
 fetch('/api/course-profiles',{signal:AbortSignal.timeout(5000)}).then(response=>response.json()).then(data=>{account.hidden=data.enabled!==true;}).catch(()=>{});
 account.append(el('summary','Sincronización opcional de perfiles'),syncForm,logout,reloadCloud,syncStatus);
 details.append(info,row,status,account);host.parentElement.after(details);
 try{
  refresh();
  if(sessionStorage.getItem('heva-course-sync-active')==='1'){
   api('read').then(connectCloud).catch(error=>{syncStatus.textContent=error.message;});
  }
 }catch{status.textContent='El almacenamiento local no está disponible.';}

 const memory=el('details');memory.id='heva-teacher-memory';memory.className='no-print border rounded p-2 my-2';
 memory.append(el('summary','Memoria docente'),
  el('p','Guarda preferencias pedagógicas en este navegador y elige si aplicarlas al encargo. Puedes cambiar las opciones antes de generar.'));
 const scopeSelect=el('select');
 for(const [key,label]of [['curso','Este nivel, marco y asignatura'],['asignatura','Toda la asignatura']]){
  const option=el('option',label);option.value=key;scopeSelect.append(option);
 }
 const scopeLabel=el('label','Guardar preferencias para ');scopeLabel.append(scopeSelect);memory.append(scopeLabel);
 const options=el('fieldset');options.append(el('legend','Preferencias'));
 const choices=Object.entries(workflow.teacherPreferences).map(([key,text])=>{
  const input=el('input');input.type='checkbox';input.value=key;
  const label=el('label');label.className='block';label.append(input,document.createTextNode(' '+text));
  options.append(label);return input;
 });
 const useMemory=el('input');useMemory.type='checkbox';
 const useLabel=el('label');useLabel.className='block';useLabel.append(useMemory,document.createTextNode(' Aplicar preferencias al encargo actual'));
 const memoryStatus=el('p');memoryStatus.setAttribute('role','status');
 const memoryScope=()=>({ambito:scopeSelect.value,...Object.fromEntries(['marco','nivel','asignatura'].map(key=>[key,byId(fields[key]).value]))});
 const readChoices=()=>choices.filter(input=>input.checked).map(input=>input.value);
 const displayMemory=preferences=>choices.forEach(input=>{input.checked=preferences.includes(input.value);});
 let loadedScope='';
 const refreshMemory=(force=false)=>{
  const scope=memoryScope(),scopeId=JSON.stringify(scope);
  if(!force&&scopeId===loadedScope)return;
  loadedScope=scopeId;useMemory.checked=false;memoryStatus.textContent='';
  try{displayMemory(workflow.readTeacherMemory(window.localStorage,scope));}
  catch{displayMemory([]);memoryStatus.textContent='No se pudieron leer las preferencias de este navegador.';}
 };
 const saveMemory=button('Guardar preferencias',()=>{
  try{
   const preferences=workflow.saveTeacherMemory(window.localStorage,memoryScope(),readChoices());
   memoryStatus.textContent=preferences.length?'Preferencias guardadas en este navegador.':'Preferencias eliminadas para este ámbito.';
  }catch(error){memoryStatus.textContent=error.message||'No se pudieron guardar las preferencias.';}
 });
 memory.append(options,saveMemory,useLabel,memoryStatus);
 details.after(memory);
 scopeSelect.addEventListener('change',()=>refreshMemory(true));
 for(const key of ['marco','nivel','asignatura'])byId(fields[key]).addEventListener('change',()=>refreshMemory());
 const updateCurriculum=actualizarTodoElCurriculo;
 actualizarTodoElCurriculo=async function(...args){
  const result=await updateCurriculum.apply(this,args);refreshMemory();return result;
 };
 window.hevaTeacherMemoryExtras=()=>{
  refreshMemory();
  const extras=workflow.teacherMemoryExtras(readChoices(),useMemory.checked,byId(fields.tipo).value);
  useMemory.checked=false;return extras;
 };
 refreshMemory(true);

 const localHistory=()=>{
  try{
   const history=JSON.parse(window.localStorage.getItem('heva_historial')||'[]');
   return Array.isArray(history)?history:[];
  }catch{return [];}
 };
 let packageBusy=false;
 let packageMessage='',messageKey=null;
 let selectionKey=null,selection=new Set();
 const packageIdentity=material=>material.materialId||material;
 async function generatePackage(origin,selected){
  if(packageBusy)return;
  const resultStatus=()=>byId('heva-package-status');
  if(hevaRecoveryRunning()){
   resultStatus().textContent='Hay otra generación en curso. Espera a que termine.';
   return;
  }
  if(navigator.onLine===false){
   resultStatus().textContent='Conéctate a internet para generar las piezas. Los materiales guardados siguen disponibles.';
   return;
  }
  const mainButton=byId('btn-generar');
  packageBusy=true;
  if(mainButton)mainButton.disabled=true;
  try{
   syncEdits();
   workflow.preservePackageMaterial(origin,localHistory,()=>guardarEnHistorial(false));
   messageKey=packageIdentity(origin);
   const generated=await workflow.generateMissingPackage(origin,selected,{
    readHistory:localHistory,
    generate:plan=>{
     if(window.localStorage.getItem(HEVA_RECOVERY_KEY)&&!recoveryRead(plan)){
      throw Error('Hay un avance activo de otro material. Retómalo o apártalo antes de continuar. Las piezas guardadas se conservan.');
     }
     return recuperarMaterialHEVA(plan);
    },
    save:material=>{
     material.materialId=material.materialId||crypto.randomUUID();
     material.version=material.version||1;
     hevaAutoSaveMaterial(material);
    },
    commit:hevaRecoveryCommit,
    reference:HEVAStudio.reference(origin),
    defaults:type=>HEVAPedagogy.contract(type).defaults,
    onPiece:type=>{
     packageMessage='Generando '+HEVAPedagogy.contract(type).name+'…';
     if(materialActual&&packageIdentity(materialActual)===messageKey&&resultStatus())resultStatus().textContent=packageMessage;
    }
   });
   packageMessage=generated.length?'Piezas guardadas en Mis materiales: '+generated.length+'.':'Las piezas seleccionadas ya están guardadas.';
  }catch(error){
   messageKey=packageIdentity(origin);
   packageMessage=error.message||'La generación se interrumpió. Las piezas guardadas se conservan.';
  }finally{
   packageBusy=false;
   if(mainButton)mainButton.disabled=false;
   cargarHistorial();
   mostrarRecuperacionPendienteHEVA();
   if(materialActual===origin)selectionKey=packageIdentity(origin);
   if(materialActual){syncEdits();renderizarDocumentoEnPantalla();}
  }
 }

 const prior=renderizarDocumentoEnPantalla;
 renderizarDocumentoEnPantalla=function(...args){
  prior(...args);
  let section=byId('heva-unit-package');
  if(!materialActual){if(section)section.hidden=true;return;}
  const kit=workflow.packageFor(materialActual,localHistory());
  if(!kit){if(section)section.hidden=true;return;}
  if(!section){
   section=el('details');section.id='heva-unit-package';section.className='no-print border rounded p-3 my-3';
   byId('hoja-material').after(section);
  }
  const list=el('ol');list.className='list-decimal pl-5';
  const origin=materialActual;
  const planning=origin.planGeneracion?.planificacionClase;
  const defaultSelection=planning?.modoMateriales==='crear'?(planning.materiales||[]):[];
  if(selectionKey!==packageIdentity(origin)){selectionKey=packageIdentity(origin);selection=new Set(defaultSelection);}
  const selected=()=>kit.filter(entry=>!entry.material&&selection.has(entry.type)).map(entry=>entry.type);
  const packageStatus=el('p',messageKey===packageIdentity(origin)?packageMessage:'');
  packageStatus.id='heva-package-status';packageStatus.setAttribute('role','status');
  const generate=button('Generar piezas seleccionadas',()=>{
   const pieces=selected();
   if(!pieces.length)return;
   void generatePackage(origin,pieces);
   refreshSelection();
   if(packageBusy)list.querySelectorAll('input,button').forEach(control=>{control.disabled=true;});
  });
  const refreshSelection=()=>{generate.disabled=packageBusy||!selected().length;};

  for(const entry of kit){
   const row=el('li');
   const label=HEVAPedagogy.contract(entry.type).name;
   if(!entry.material&&origin.planGeneracion){
    const choice=el('input');choice.type='checkbox';choice.checked=selection.has(entry.type);choice.disabled=packageBusy;
    choice.onchange=()=>{if(choice.checked)selection.add(entry.type);else selection.delete(entry.type);refreshSelection();};
    const choiceLabel=el('label');choiceLabel.append(choice,el('span',' '+label+' · pendiente'));row.append(choiceLabel);
   }else if(!entry.material)row.textContent=label+' · pendiente';
   else{
    row.append(el('span',label+' · '+entry.material.titulo+' '));
    if(entry.material===materialActual)row.append(el('span','(abierto)'));
    else{const open=button('Abrir '+label,()=>{
     try{
      syncEdits();
      packageMessage='';
      materialActual=workflow.openPackageMaterial(materialActual,entry.material,localHistory,()=>guardarEnHistorial(false));
      renderizarDocumentoEnPantalla();
      byId('hoja-material')?.scrollIntoView({block:'start'});
     }catch(error){packageStatus.textContent=error.message;}
    });open.disabled=packageBusy;row.append(open);}
   }
   list.append(row);
  }
  section.hidden=false;
  section.replaceChildren(el('summary','Paquete pedagógico de esta unidad'),
   el('p','Secuencia de materiales guardados con el mismo marco, nivel, asignatura, objetivo y tema.'),list);
  if(origin.planGeneracion&&kit.some(entry=>!entry.material)){refreshSelection();section.append(generate);}
  section.append(packageStatus);
 };
})();
