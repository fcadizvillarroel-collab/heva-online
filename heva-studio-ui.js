/* Herramientas gratuitas: documentos locales, edición acotada y versiones vinculadas. */
(function(){
const S=HEVAStudio,E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let pending=null,busy=false;
const conversation=new Map();
function assistantHistory(m){
 const id=m.materialId||m;
 if(!conversation.has(id)){
  if(conversation.size>=5)conversation.delete(conversation.keys().next().value);
  conversation.set(id,[]);
 }
 return conversation.get(id);
}
function docs(){try{return JSON.parse(localStorage.getItem('heva_documentos_v1')||'[]')}catch{return[]}}
function selected(){return docs().filter(d=>document.getElementById('studio-doc-'+d.id)?.checked)}
window.studioGenerationExtras=()=>({noticiaDidacticaModo:document.getElementById('heva-noticia-didactica')?.value||'AUTO',usarNoticias:document.getElementById('heva-usar-noticias')?.checked===true,documentosBase:selected(),plantillaVisual:localStorage.getItem('heva_plantilla')||'calida'});
function status(t){const el=document.getElementById('studio-status');if(el)el.textContent=t}
function fingerprint(){return JSON.stringify(materialActual)}
function backupDocuments(){HEVAOffice.download(new Blob([JSON.stringify({schema:'heva-documentos-v1',documentos:docs()},null,2)],{type:'application/json'}),'HEVA_documentos_base.json')}
function mountHistoryCompare(){const list=document.getElementById('lista-guardados');if(!list||document.getElementById('studio-compare'))return;const button=document.createElement('button');button.type='button';button.id='studio-compare';button.textContent='Comparar versión actual con original';button.style.cssText='display:block;margin:8px 0;padding:8px 12px;border:1px solid #b98d67;border-radius:8px';button.onclick=compare;list.before(button)}

function mountDocs(){if(document.getElementById('studio-documents'))return;const anchor=document.getElementById('btn-generar')||document.querySelector('button[onclick*="generarMaterialReal"]');if(!anchor)return;const el=document.createElement('details');el.id='studio-documents';el.style.cssText='padding:14px;margin:12px 0;border:1px solid #c9bba9;border-radius:12px;background:#fff7ed';el.innerHTML='<summary style="cursor:pointer"><strong>Referencias docentes y presentación del material · opcional</strong></summary><p>Utiliza esta sección solo si quieres orientar a HEVA con tus propios materiales o elegir cómo se verá el resultado. Puedes aportar documentos de contenido, mostrar una guía o prueba como ejemplo de estilo y escoger una plantilla para Word o PowerPoint. Si no agregas nada, HEVA genera normalmente con el objetivo curricular y las opciones seleccionadas.</p><p><strong>1. Ejemplo de estilo o contenido:</strong> pega un fragmento de una guía, evaluación o presentación anterior. Selecciona si HEVA debe considerar solo su forma de redactar y organizar, o también la información que contiene. El ejemplo no sustituye los objetivos curriculares ni es una fuente oficial verificada.</p><div id="studio-reference-slot"><div class="border rounded p-2.5 bg-sky-50/50 border-sky-200 space-y-1"> <label class="block text-xs font-bold uppercase text-sky-900 flex items-center justify-between"> <span>Material anterior como referencia</span> <span class="text-[10px] text-sky-600 font-normal">Opcional</span> </label> <label for="modo-referencia" class="block text-xs">Uso del ejemplo</label> <select id="modo-referencia" class="w-full border rounded p-1.5 text-xs" onchange="document.getElementById(&#39;texto-referencia&#39;).disabled=this.value===&#39;NINGUNA&#39;"> <option value="NINGUNA">No usar material de ejemplo</option> <option value="ESTILO">Solo formato, profundidad y estilo docente</option> <option value="CONTENIDO">Usar también el contenido que seleccione</option> </select> <p class="text-xs">Los ejemplos no sustituyen el currículum ni son fuentes verificadas.</p> <textarea disabled id="texto-referencia" rows="2" class="w-full border rounded p-1.5 text-xs bg-white text-stone-700" placeholder="Selecciona un uso y pega aquí el ejemplo que quieras utilizar."></textarea> </div></div><p><strong>2. Documentos de apoyo:</strong> importa archivos de texto, PDF, DOCX o PPTX. La extracción de texto de PDF y Office requiere conexión y envía el archivo al servidor de HEVA y marca hasta cuatro para aportar información al nuevo material. Se guardan en este navegador y se envían a la IA solo al generar. No incluyas datos personales ni antecedentes sensibles de estudiantes.</p><label>Importar texto, PDF, Word o PowerPoint <input id="studio-file" type="file" accept=".txt,.md,.csv,.pdf,.docx,.pptx"></label><div id="studio-doc-list"></div><label>Plantilla de Word y PowerPoint <select id="studio-theme">'+Object.entries(HEVATemplates.themes).map(([id,t])=>'<option value="'+id+'">'+E(t.name)+'</option>').join('')+'</select></label><p><button type="button" id="studio-doc-backup">Respaldar documentos base</button> <button type="button" id="studio-doc-compare">Comparar dos documentos seleccionados</button></p><p id="studio-doc-status" role="status"></p>';anchor.before(el);document.getElementById('studio-doc-backup').onclick=backupDocuments;document.getElementById('studio-doc-compare').onclick=compareDocuments;document.getElementById('studio-theme').value=localStorage.getItem('heva_plantilla')||'calida';document.getElementById('studio-theme').onchange=e=>localStorage.setItem('heva_plantilla',e.target.value);document.getElementById('studio-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const textFile=/\.(txt|md|csv)$/i.test(file.name);
  if(textFile&&file.size>100000)throw Error('Usa un archivo de texto de hasta 100 KB.');
  if(!textFile&&(!/\.(pdf|docx|pptx)$/i.test(file.name)||file.size>2097152))throw Error('Usa PDF, DOCX o PPTX de hasta 2 MiB.');
  let texto,advertencias=[];
  if(textFile)texto=await file.text();
  else{
   const bytes=new Uint8Array(await file.arrayBuffer());
   let binary='';
   for(let offset=0;offset<bytes.length;offset+=16384)binary+=String.fromCharCode(...bytes.subarray(offset,offset+16384));
   const response=await fetch('/api/document-import',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({nombre:file.name,contenidoBase64:btoa(binary)}),signal:AbortSignal.timeout(35000)});
   const result=await response.json();
   if(!response.ok||!result.documento?.texto)throw Error(result.error||'No se pudo extraer texto.');
   texto=result.documento.texto;
   advertencias=Array.isArray(result.advertencias)?result.advertencias:[];
  }if(texto.length>20000||!texto.trim())throw Error('Cada texto debe tener entre 1 y 20.000 caracteres.');const list=docs();if(list.length>=20)throw Error('Elimina un documento antes de añadir otro (máximo 20).');list.push({id:crypto.randomUUID(),titulo:file.name.slice(0,200),texto,version:1,fecha:new Date().toISOString()});localStorage.setItem('heva_documentos_v1',JSON.stringify(list));drawDocs();document.getElementById('studio-doc-status').textContent=['Documento guardado. Márcalo para usarlo.',...advertencias].join(' ')}catch(err){document.getElementById('studio-doc-status').textContent=err.message}e.target.value=''};drawDocs()}
function compareDocuments(){
 const list=selected(),message=document.getElementById('studio-doc-status');
 if(list.length!==2){message.textContent='Selecciona exactamente dos documentos base para comparar.';return;}
 const dialog=document.createElement('dialog');
 dialog.setAttribute('aria-label','Comparar documentos base');
 dialog.style.cssText='width:min(1000px,94vw);max-height:85vh;overflow:auto;padding:20px;border:1px solid #c9bba9;border-radius:12px;background:white';
 const title=document.createElement('h2');title.textContent='Comparar documentos base';title.style.cssText='font-weight:700;font-size:1.15rem;margin-bottom:8px';
 const close=document.createElement('button');close.type='button';close.textContent='Cerrar comparación';close.onclick=()=>dialog.close();
 const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px';
 for(const source of list){
  const article=document.createElement('section'),heading=document.createElement('h3'),body=document.createElement('pre');
  heading.textContent=source.titulo;heading.style.fontWeight='700';
  body.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:inherit';
  body.textContent=source.texto;
  article.style.cssText='padding:12px;border:1px solid #d6c5b7;border-radius:8px;min-width:0';
  article.append(heading,body);grid.append(article);
 }
 const analyze=document.createElement('button');analyze.type='button';analyze.textContent='Contrastar fragmentos con IA';
 const explanation=document.createElement('p');
 explanation.textContent='Envía hasta 4.500 caracteres de cada documento a HEVA para contrastarlos. Revisa las interpretaciones antes de usarlas.';
 const progress=document.createElement('p');progress.setAttribute('role','status');
 const findings=document.createElement('section');findings.style.cssText='display:grid;gap:10px;margin:10px 0';
 let request;
 analyze.onclick=async()=>{
  analyze.disabled=true;findings.replaceChildren();progress.textContent='Contrastando los fragmentos…';
  request=new AbortController();
  try{
   const response=await fetch('/api/studio',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({accion:'comparar_documentos',documentosBase:list.map(({id,titulo,texto})=>({id,titulo,texto:texto.trim().slice(0,4500)}))}),signal:AbortSignal.any([request.signal,AbortSignal.timeout(45000)])});
   const data=await response.json();
   if(!response.ok||!Array.isArray(data.contrastes))throw Error(data.error||'No se pudo completar la síntesis.');
   for(const item of data.contrastes){
    const article=document.createElement('article'),heading=document.createElement('h3');
    heading.textContent=item.tipo==='coincidencia'?'Coincidencia':'Diferencia';
    heading.style.fontWeight='700';article.style.cssText='padding:12px;border-left:4px solid #8b2635;background:#fff7ed';
    const summary=document.createElement('p');summary.textContent=item.interpretacion;
    article.append(heading,summary);
    for(const [index,quote] of [item.cita1,item.cita2].entries()){
     const caption=document.createElement('p');caption.textContent=list[index].titulo;
     const excerpt=document.createElement('blockquote');excerpt.textContent='«'+quote+'»';
     article.append(caption,excerpt);
    }
    findings.append(article);
   }
   progress.textContent='Citas localizadas en ambos textos. Revisión de las interpretaciones pendiente.'+(data.omitidos?' Contrastes omitidos por falta de respaldo literal: '+data.omitidos+'.':'');
  }catch(error){if(!request.signal.aborted)progress.textContent=error.message;}
  finally{analyze.disabled=false;}
 };
 dialog.append(title,close,explanation,analyze,progress,findings,grid);
 dialog.addEventListener('close',()=>{request?.abort();dialog.remove();},{once:true});
 document.body.append(dialog);dialog.showModal();
}
function drawDocs(){const list=document.getElementById('studio-doc-list');if(!list)return;const marked=selected().map(d=>d.id);list.innerHTML=docs().map(d=>'<p><label><input type="checkbox" id="studio-doc-'+d.id+'" '+(marked.includes(d.id)?'checked':'')+'> '+E(d.titulo)+' · '+d.texto.length+' caracteres</label> <button type="button" data-edit-doc="'+d.id+'">Editar texto</button> <button type="button" data-remove="'+d.id+'">Eliminar</button></p>').join('');list.querySelectorAll('[data-edit-doc]').forEach(b=>b.onclick=()=>editDocument(b.dataset.editDoc));list.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{localStorage.setItem('heva_documentos_v1',JSON.stringify(docs().filter(d=>d.id!==b.dataset.remove)));drawDocs()});list.querySelectorAll('input').forEach(c=>c.onchange=()=>{const issues=S.validateExtras({documentosBase:selected()});if(issues.length){c.checked=false;document.getElementById('studio-doc-status').textContent=issues.join(' ')}})}
function editDocument(id){const d=docs().find(x=>x.id===id);if(!d)return;const dialog=document.createElement('dialog');dialog.style.cssText='width:80vw;max-width:900px;padding:20px';const title=document.createElement('input'),text=document.createElement('textarea'),save=document.createElement('button'),cancel=document.createElement('button'),msg=document.createElement('p');title.value=d.titulo;title.maxLength=200;title.setAttribute('aria-label','Título del documento base');text.value=d.texto;text.maxLength=20000;text.rows=16;text.style.width='100%';text.setAttribute('aria-label','Texto del documento base');save.textContent='Guardar versión del documento';cancel.textContent='Cancelar';cancel.onclick=()=>{dialog.close();dialog.remove()};save.onclick=()=>{if(!title.value.trim()||!text.value.trim()){msg.textContent='Completa título y texto.';return}try{const list=docs().map(x=>x.id===id?{...x,titulo:title.value,texto:text.value,version:(x.version||1)+1,fecha:new Date().toISOString()}:x);localStorage.setItem('heva_documentos_v1',JSON.stringify(list));drawDocs();dialog.close();dialog.remove()}catch{msg.textContent='No hay espacio local. Respalda tus documentos antes de continuar.'}};dialog.append(title,text,msg,save,cancel);document.body.append(dialog);dialog.showModal()}
function install(m){materialActual=m;renderizarDocumentoEnPantalla();guardarEnHistorial(false);renderizarDocumentoEnPantalla()}
function panel(){
 mountDocs();
 document.getElementById('studio-panel')?.remove();
 if(!materialActual||materialActual.versionPedagogica!==3)return;
 const m=materialActual,anchor=document.getElementById('heva-studio-workspace');
 if(!anchor)return;
 const el=document.createElement('section');el.id='studio-panel';el.className='no-print';
 el.style.cssText='padding:14px;margin:14px 0;background:#fff7ed;border:1px solid #c9bba9;border-radius:12px;color:#302723';
 el.innerHTML='<details><summary style="cursor:pointer;font-weight:700;color:#8b2635">Editar y adaptar con IA</summary>'+
 '<p style="font-size:12px;margin:10px 0">Edita una sección o crea una adaptación vinculada al original. La revisión global está en este mismo espacio.</p>'+
 '<form id="studio-assistant"><label for="studio-command">Pedir un cambio al asistente</label>'+
 '<textarea id="studio-command" rows="2" maxlength="1200" style="width:100%;padding:8px" placeholder="Ej.: mejora la segunda actividad, amplía la explicación o genera una evaluación"></textarea>'+
 '<button type="submit">Preparar propuesta</button><ol id="studio-turns" aria-label="Solicitudes de esta sesión"></ol></form>'+
 '<div style="border-top:1px solid #e2cbb3;padding-top:10px;margin-top:10px"><strong style="font-size:13px">1. Perfeccionar todo el material</strong>'+
 '<p style="font-size:12px">Elige una finalidad. Una solicitud propone cambios pedagógicos sin sustituir el original ni certificarlo.</p>'+
 '<label for="studio-mode">Finalidad</label><select id="studio-mode" style="width:100%;padding:8px">'+[['INTEGRAL','Mejora integral'],['PROFUNDIDAD','Profundizar explicaciones'],['DIDACTICA','Mejorar didáctica'],['ENRIQUECER','Enriquecer ejemplos y fuentes'],['DIFICULTAD_MENOR','Reducir barreras de dificultad'],['DIFICULTAD_MAYOR','Aumentar exigencia'],['EVALUACION','Mejorar preguntas y criterios']].map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('')+'</select>'+
 '<label for="studio-global-instruction">Preferencias adicionales (opcional)</label><textarea id="studio-global-instruction" rows="2" maxlength="3000" style="width:100%;padding:8px"></textarea>'+
 '<button id="studio-improve" type="button" style="width:100%;background:#8b2635;color:white">Proponer mejora integral</button></div>'+
 '<div style="border-top:1px solid #e2cbb3;padding-top:10px;margin-top:10px"><strong style="font-size:13px">2. Mejorar una sección con IA</strong>'+
 '<p style="font-size:12px;margin:5px 0">Elige qué parte quieres cambiar. La IA propondrá una redacción nueva para que la revises antes de aceptarla.</p>'+
 '<label style="display:block;font-size:12px;font-weight:600">Parte del material<select id="studio-section" style="display:block;width:100%;margin:5px 0;padding:8px;border:1px solid #bba;border-radius:6px">'+S.sections(m).map(s=>'<option value="'+s.id+'">'+E(s.label)+'</option>').join('')+'</select></label>'+
 '<label style="display:block;font-size:12px;font-weight:600">¿Qué quieres mejorar?<textarea id="studio-instruction" rows="3" maxlength="3000" style="display:block;width:100%;padding:8px;margin:5px 0;border:1px solid #bba;border-radius:6px" placeholder="Ej.: explica con mayor profundidad, agrega un ejemplo distinto o mejora la claridad de las instrucciones."></textarea></label>'+
 '<button type="button" id="studio-edit" style="background:#8b2635;color:white;width:100%">Proponer mejora con IA</button></div>'+
 '<div style="border-top:1px solid #e2cbb3;padding-top:10px;margin-top:12px"><strong style="font-size:13px">3. Crear una versión adaptada</strong>'+
 '<p style="font-size:12px;margin:5px 0">Conserva el objetivo y el tema, pero cambia los apoyos para facilitar el trabajo de los estudiantes.</p>'+
 '<button type="button" id="studio-access" style="width:100%">Adaptar para lectura acompañada</button>'+
 '<p style="font-size:11px;margin:4px 0 10px">Segmenta la lectura y ofrece instrucciones y apoyos de comprensión.</p>'+
 '<button type="button" id="studio-recovery" style="width:100%">Adaptar para estudiantes con inasistencias</button>'+
 '<p style="font-size:11px;margin:4px 0">Incorpora recordatorios y actividades para retomar los contenidos.</p></div>'+
 '<p id="studio-status" role="status" style="font-size:11px;margin:12px 0 5px">Las propuestas requieren conexión con IA. Puedes revisar el resultado antes de incorporarlo al material.</p>'+
 '<div id="studio-preview" style="overflow-wrap:anywhere"></div></details>';
 el.querySelectorAll('button').forEach(button=>{button.style.padding='9px 10px';button.style.margin='5px 0';button.style.borderRadius='7px';button.style.border=button.id==='studio-edit'?'none':'1px solid #b98d67';button.style.fontSize='12px';button.style.fontWeight='600'});
 if(m.tipoMaterial==='EVALUACION'&&HEVAAssessment.items(m).length){
  const exportForms=document.createElement('details');
  exportForms.innerHTML='<summary>Exportar formas A y B en Word</summary>'+
   '<p>Elige otra evaluación guardada con el mismo OA, tiempo, formatos y puntajes para usar preguntas distintas. Revisa la dificultad de ambas antes de aplicarlas.</p>'+
   '<label>Origen de la forma B <select data-form-source></select></label> '+
   '<label>Forma <select id="studio-assessment-form"><option value="a">A</option><option value="b">B</option></select></label> '+
   '<button type="button" data-form-copy="student">Descargar evaluación</button> '+
   '<button type="button" data-form-copy="teacher">Descargar pauta docente</button>'+
   '<p role="status" aria-live="polite"></p>';
  const message=exportForms.querySelector('[role="status"]');
  const source=exportForms.querySelector('[data-form-source]');
  source.append(new Option('Reordenar las alternativas de esta evaluación',''));
  let history=[];try{history=JSON.parse(localStorage.getItem('heva_historial')||'[]')}catch{}
  const candidates=(Array.isArray(history)?history:[]).filter(x=>HEVAAssessment.compatibleForms(m,x?.data));
  candidates.forEach((entry,index)=>source.append(new Option(entry.data.titulo+' · versión '+(entry.data.version||1),String(index))));
  if(candidates.length)source.value='0';
  else message.textContent='Genera y guarda otra evaluación del mismo OA con la misma estructura para emparejar preguntas distintas.';
  const compareButton=document.createElement('button');
  compareButton.type='button';compareButton.textContent='Comparar las preguntas de A y B';
  exportForms.append(compareButton);
  const updateComparison=()=>{compareButton.hidden=source.value==='';};
  compareButton.onclick=()=>{
   const other=candidates[Number(source.value)]?.data;
   if(!other||source.value==='')return;
   syncEdits();
   const comparison=document.createElement('dialog');
   comparison.setAttribute('aria-label',compareButton.textContent);
   comparison.style.cssText='width:min(860px,94vw);max-height:85vh;overflow:auto;padding:20px;border:1px solid #c9bba9;border-radius:12px;background:#fff;';
   const summary=document.createElement('h2');summary.textContent=compareButton.textContent;summary.style.cssText='font-weight:700;font-size:1.15rem';
   const close=document.createElement('button');close.type='button';close.textContent='Cerrar comparación';close.onclick=()=>comparison.close();
   const pairs=document.createElement('div');
   comparison.append(summary,close,pairs);
   comparison.addEventListener('close',()=>comparison.remove(),{once:true});
   document.body.append(comparison);
   comparison.showModal();
   const original=materialActual;
   if(!HEVAAssessment.compatibleForms(original,other)){
    pairs.textContent='La evaluación cambió. Guarda los cambios y elige una forma compatible.';
    return;
   }
   const note=document.createElement('p');
   note.textContent='Compara las operaciones, el uso de evidencia y la dificultad de cada par antes de aplicar las formas.';
   pairs.append(note);
   for(const [letter,exam] of [['A',original],['B',other]]){
    if(!exam.comprensionLectora?.texto)continue;
    const reading=document.createElement('details');
    const heading=document.createElement('summary');heading.textContent='Lectura de la forma '+letter;
    const text=document.createElement('p');text.textContent=exam.comprensionLectora.texto;
    reading.append(heading,text);pairs.append(reading);
   }
   const first=HEVAAssessment.items(original),second=HEVAAssessment.items(other);
   first.forEach((entry,index)=>{
    const group=document.createElement('fieldset');
    const title=document.createElement('legend');title.textContent=entry.label+' · '+entry.points+(entry.points===1?' punto':' puntos');
    group.style.cssText='padding:10px;margin:12px 0;border:1px solid #c9bba9;min-inline-size:0;overflow-wrap:anywhere;';
    const columns=document.createElement('div');
    columns.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px;';
    group.append(title,columns);
    for(const [letter,item] of [['A',entry],['B',second[index]]]){
     const label=document.createElement('strong');label.textContent='Forma '+letter;
     const content=document.createElement('p');
     const q=item.q;
     content.textContent=[q.estimulo||q.contextoReal,q.enunciado||q.preguntaReflexion||q.consigna||q.texto].filter(Boolean).join(' · ');
     const column=document.createElement('div');column.append(label,content);
     columns.append(column);
     if(Array.isArray(q.alternativas)){
      const options=document.createElement('ul');
      for(const qOption of q.alternativas){
       const option=document.createElement('li');option.textContent=qOption.letra+') '+qOption.texto;
       options.append(option);
      }
      column.append(options);
     }
    }
    pairs.append(group);
   });
  };
  source.addEventListener('change',updateComparison);
  updateComparison();
  for(const button of exportForms.querySelectorAll('[data-form-copy]')){
   button.onclick=async()=>{
    try{
     button.disabled=true;
     syncEdits();
     const original=materialActual,snapshot=fingerprint(),chosen=exportForms.querySelector('#studio-assessment-form').value,other=source.value===''?null:candidates[Number(source.value)]?.data;
     const originalReport=await informeExportacionHEVA();
     if(materialActual!==original||fingerprint()!==snapshot)throw Error('La evaluación cambió. Intenta descargar la nueva versión.');
     if(!originalReport.exportable)throw Error('Corrige los errores comprobados en el control de exportación antes de descargar las formas.');
     const forms=other?HEVAAssessment.pairForms(original,other):HEVAAssessment.forms(original,globalThis.HEVASkills?.remapJustification);
     if(!forms)throw Error(other?'Las evaluaciones ya no coinciden en estructura o tienen ítems repetidos.':'Esta evaluación no tiene alternativas que se puedan reordenar con seguridad.');
     const report=HEVAAudit.inspect(forms[chosen]);
     if(report.errores.length)throw Error('La forma requiere corrección antes de exportar: '+report.errores[0].problema);
     await HEVAOffice.word(forms[chosen],button.dataset.formCopy==='teacher');
     message.textContent='Forma '+chosen.toUpperCase()+' descargada. '+(other?'Los '+forms.changed+' ítems son distintos. Revisa la equivalencia de dificultad.':'La forma B reordena '+forms.changed+' preguntas y conserva '+forms.retained+' sin cambios.');
    }catch(error){message.textContent=error.message;}
    finally{button.disabled=false;}
   };
  }
  el.prepend(exportForms);
 }
 anchor.append(el);
 const turns=assistantHistory(m),turnList=el.querySelector('#studio-turns');
 const renderTurns=()=>turnList.replaceChildren(...turns.map(value=>{const item=document.createElement('li');item.textContent=value;return item;}));
 renderTurns();
 el.querySelector('#studio-assistant').onsubmit=async event=>{
  event.preventDefault();
  if(busy||window.HEVAReviewStudio?.isBusy())return;
  const command=el.querySelector('#studio-command');
  const instruction=command.value.trim();
  const action=S.conversationAction(materialActual,instruction);
  if(!action)return;
  if(action.kind==='missing'){status('Esa sección no existe en el material abierto. Indica otra sección.');return;}
  turns.push(instruction);if(turns.length>5)turns.shift();
  renderTurns();command.value='';
  if(action.kind==='compare'){compare();return;}
  if(action.kind==='adapt'||action.kind==='convert'){await adapt(action.target,instruction,action.kind==='convert');return;}
  if(action.kind==='edit'){
   el.querySelector('#studio-section').value=action.section;
   el.querySelector('#studio-instruction').value=instruction;
   await edit();return;
  }
  el.querySelector('#studio-mode').value=action.mode;
  el.querySelector('#studio-global-instruction').value=instruction;
  await improve();
 };
 document.getElementById('studio-edit').onclick=edit;
 document.getElementById('studio-improve').onclick=improve;
 document.getElementById('studio-access').onclick=()=>adapt('ACCESIBLE');
 document.getElementById('studio-recovery').onclick=()=>adapt('RECUPERACION');
}
async function improve(){
 if(busy||window.HEVAReviewStudio?.isBusy())return;
 syncEdits();const original=materialActual,snapshot=fingerprint(),modo=document.getElementById('studio-mode').value,instrucciones=document.getElementById('studio-global-instruction').value;
 busy=true;pending=null;const preview=document.getElementById('studio-preview');preview.replaceChildren();status('Preparando mejora pedagógica; el original permanece intacto.');
 try{
  const r=await fetch('/api/studio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({material:globalThis.HEVASlideDesign?.forAI(original)||original,seccion:'INTEGRAL',modo,instrucciones}),signal:AbortSignal.timeout(58000)});
  const d=await r.json();if(!r.ok||!d.material)throw Error([d.error,d.detalle].filter(Boolean).join(' ')||'No se completó la propuesta.');
  syncEdits();if(materialActual!==original||fingerprint()!==snapshot)throw Error('El material cambió. Solicita otra propuesta.');
  const next=globalThis.HEVASlideDesign?.restoreImages(original,d.material)||d.material;
  for(const [title,mat] of [['Original',original],['Propuesta',next]]){const details=document.createElement('details'),h=document.createElement('summary'),pre=document.createElement('pre');h.textContent=title;pre.style.cssText='white-space:pre-wrap;max-height:380px;overflow:auto';pre.textContent=HEVAPedagogy.blocks(mat,true).map(b=>b.title+'\n'+b.text).join('\n\n');details.append(h,pre);preview.append(details);}
  const apply=document.createElement('button');apply.type='button';apply.textContent='Aceptar mejora y guardar versión';apply.onclick=()=>{if(busy||window.HEVAReviewStudio?.isBusy())return;syncEdits();if(materialActual!==original||fingerprint()!==snapshot){status('El original cambió. Solicita otra propuesta.');return;}guardarEnHistorial(false);install(next);status('Mejora guardada. Revisión independiente y validación docente pendientes.');};
  const discard=document.createElement('button');discard.type='button';discard.textContent='Descartar propuesta';discard.onclick=()=>{preview.replaceChildren();status('Propuesta descartada. Original intacto.');};preview.append(apply,discard);status('Propuesta lista para comparar (incluye pauta docente).');
 }catch(e){status(e.message)}finally{busy=false}
}
async function edit(){if(busy||window.HEVAReviewStudio?.isBusy())return;syncEdits();const original=materialActual,snapshot=fingerprint(),id=document.getElementById('studio-section').value,instrucciones=document.getElementById('studio-instruction').value;if(!instrucciones.trim()){status('Escribe qué deseas mejorar en la sección.');return}busy=true;pending=null;document.getElementById('studio-preview').replaceChildren();status('Preparando una propuesta para la sección seleccionada…');try{const r=await fetch('/api/studio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({material:globalThis.HEVASlideDesign?.forAI(original)||original,seccion:id,instrucciones}),signal:AbortSignal.timeout(58000)}),d=await r.json();if(!r.ok)throw Error([d.error,d.detalle].filter(Boolean).join(' '));syncEdits();if(materialActual!==original||fingerprint()!==snapshot)throw Error('El material cambió durante la consulta. Vuelve a solicitar la propuesta sobre la versión actual.');pending={material:globalThis.HEVASlideDesign?.restoreImages(original,d.material)||d.material,snapshot,original};const preview=document.getElementById('studio-preview');preview.replaceChildren();for(const [title,mat]of [['Actual',original],['Propuesta',d.material]]){const h=document.createElement('h4'),pre=document.createElement('pre');h.textContent=title;pre.style.cssText='white-space:pre-wrap;max-height:300px;overflow:auto;background:white;padding:12px';pre.textContent=JSON.stringify(S.section(mat,id).value,null,2);preview.append(h,pre)}const apply=document.createElement('button');apply.textContent='Aplicar y guardar nueva versión';apply.onclick=()=>{syncEdits();if(materialActual!==pending.original||fingerprint()!==pending.snapshot){status('El original cambió. Solicita una nueva propuesta.');return}guardarEnHistorial(false);const next=pending.material;pending=null;install(next);status('Sección actualizada y versión guardada. La revisión independiente queda pendiente.')};preview.append(apply);status('Propuesta lista. El material original sigue intacto hasta aplicarla.')}catch(e){status(e.message)}finally{busy=false}}
async function adapt(type,instruction='',convert=false){if(busy||window.HEVAReviewStudio?.isBusy())return;syncEdits();guardarEnHistorial(false);const original=materialActual,snapshot=fingerprint();busy=true;status('Creando una adaptación vinculada al original…');try{const plan=convert?S.conversionPlan(original,type):S.adaptationPlan(original,type);if(instruction)plan.instruccionesDocente=(plan.instruccionesDocente+'\nPreferencia docente: '+instruction).slice(0,12000);const issues=S.validateExtras(plan);if(issues.length)throw Error(issues.join('; '));if(hevaRecoveryRunning()||(localStorage.getItem(HEVA_RECOVERY_KEY)&&!recoveryRead(plan)))throw Error('Hay otro encargo con avance guardado. Retómalo antes de crear esta versión.');let d;if(plan.tipoMaterial==='PRESENTACION'||plan.cantAlternativas+plan.cantDesarrollo+plan.cantCasos>=8)d=await recuperarMaterialHEVA(plan);else{const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(plan),signal:AbortSignal.timeout(58000)});d=await r.json();if(!r.ok){if(r.status>=400&&r.status!==400)d=await recuperarMaterialHEVA(plan);else throw Error([d.error,d.detalle].filter(Boolean).join(' '))}}if(!d.material)throw Error('No se completó la adaptación. El original está guardado.');syncEdits();if(materialActual!==original||fingerprint()!==snapshot)throw Error('El original cambió durante la generación; se conserva la versión actual.');delete d.material.materialId;delete d.material.version;const preview=document.getElementById('studio-preview');preview.replaceChildren();const title=document.createElement('h4');title.textContent='Propuesta de adaptación';const pre=document.createElement('pre');pre.style.cssText='white-space:pre-wrap;max-height:400px;overflow:auto';pre.textContent=HEVAPedagogy.blocks(d.material,false).map(b=>b.title+'\n'+b.text).join('\n\n');const apply=document.createElement('button');apply.type='button';apply.textContent='Guardar adaptación como material separado';apply.onclick=()=>{syncEdits();if(materialActual!==original||fingerprint()!==snapshot){status('El original cambió; solicita una nueva adaptación.');return;}install(d.material);hevaRecoveryCommit(plan);status('Adaptación guardada por separado.');};preview.append(title,pre,apply);status('Adaptación lista para revisar; el original no ha cambiado.')}catch(e){status(e.message)}finally{busy=false}}
function compare(){syncEdits();let m=materialActual,history;try{history=JSON.parse(localStorage.getItem('heva_historial')||'[]')}catch{history=[]}const original=m.derivacion?history.find(x=>x.data.materialId===m.derivacion.origenId&&x.data.version===m.derivacion.origenVersion)?.data:history.find(x=>x.data.materialId===m.materialId&&x.data.version<m.version)?.data;if(!original){status('Todavía no hay una versión anterior u original guardado para comparar.');return}const dialog=document.createElement('dialog');dialog.style.cssText='width:90vw;max-width:1200px;max-height:90vh;padding:22px';const h=document.createElement('h3');h.textContent='Comparación · '+S.changes(original,m).length+' secciones distintas';dialog.append(h);const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px';for(const [label,mat]of [['Original',original],['Actual',m]]){const box=document.createElement('section'),title=document.createElement('h4'),pre=document.createElement('pre');title.textContent=label+' · '+mat.titulo;pre.style.cssText='white-space:pre-wrap;max-height:65vh;overflow:auto';pre.textContent=HEVAPedagogy.blocks(mat,false).map(b=>b.title+'\n'+b.text).join('\n\n');box.append(title,pre);grid.append(box)}dialog.append(grid);const close=document.createElement('button');close.textContent='Cerrar comparación';close.onclick=()=>{dialog.close();dialog.remove()};dialog.append(close);document.body.append(dialog);dialog.showModal()}
window.HEVAStudioUI={mount:panel,isBusy:()=>busy};
const prior=renderizarDocumentoEnPantalla;renderizarDocumentoEnPantalla=function(...args){const result=prior.apply(this,args);panel();mountHistoryCompare();return result};mountDocs();mountHistoryCompare();if(materialActual)panel();
})();
