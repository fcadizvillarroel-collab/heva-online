const hevaEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalogRequest=0;
let previousSubject='', topicBySubject={};
async function consultarCatalogoHEVA(filter){
 const usable=rows=>(Array.isArray(rows)?rows:[]).filter(o=>o&&typeof o.texto_literal==='string'&&o.texto_literal.trim()&&o.estado!=='RECHAZADO'&&o.vigente!==false);
 const key='heva_catalog_'+JSON.stringify(filter);
 const local=async()=>{try{
   const r=await fetch('/catalogo-publicado.json',{cache:'no-cache'});
   if(!r.ok)throw Error('Catálogo local HTTP '+r.status);
   return usable(HEVA.catalog(await r.json(),filter));
  }catch(e){console.warn('Catálogo local no disponible',e);try{return usable(JSON.parse(localStorage.getItem(key)||'[]'))}catch{return []}}};
 let list=[],source='Supabase';
  try{
   const r=await fetch('/api/curriculum/admin?action=verified&'+new URLSearchParams(filter),{cache:'no-store'});
   if(!r.ok)throw Error('Respuesta HTTP '+r.status);
   const data=await r.json();
   if(!Array.isArray(data.objetivos))throw Error('Respuesta sin objetivos');
   list=usable(data.objetivos);
   // Respuesta válida, incluso [], manda sobre respaldos y cachés antiguos.
   try{localStorage.setItem(key,JSON.stringify(list))}catch{}
  }catch(e){source='catálogo local EPJA';list=await local();}
 return {list,source};
}
actualizarObjetivosYEstrategias=async function(){
 const serial=++catalogRequest;
 const sel=document.getElementById('select-oa'),counter=document.getElementById('contador-oas'),oa=document.getElementById('texto-oa');
 const filter={marco:document.getElementById('marco-curricular').value,nivel:document.getElementById('nivel-epja').value,asignatura:document.getElementById('asignatura').value};
 if(previousSubject&&previousSubject!==filter.asignatura){
  topicBySubject[previousSubject]=document.getElementById('tema-especifico').value;
  document.getElementById('tema-especifico').value=topicBySubject[filter.asignatura]||'';
 }
 previousSubject=filter.asignatura;
 sel.replaceChildren(new Option('Cargando catálogo…',''));sel.disabled=true;oa.value='';
 try{
  const {list,source}=await consultarCatalogoHEVA(filter);
  if(serial!==catalogRequest)return;
  sel.replaceChildren();
  for(const item of list){
   const op=new Option('',item.texto_literal);
   const codigo=String(item.codigo_oficial||'').trim();
   op.textContent=(item.tipo||'OA')+' · '+(codigo||'OA EPJA')+' · '+item.texto_literal.slice(0,115);
   op.dataset.key=item.clave_interna||'';
   sel.add(op);
  }
  if(!list.length)sel.add(new Option('No hay OA EPJA publicados para esta combinación',''));
  sel.add(new Option('Objetivo propio (no oficial)','CUSTOM'));
  oa.value=sel.value==='CUSTOM'?'':sel.value;
  counter.textContent=list.length+' objetivos EPJA · '+source;
  const strategies=['Análisis de fuentes y evidencias','Ejemplo guiado y aplicación progresiva','Estudio de casos y toma de decisiones','Comprensión lectora y explicación oral'];
  const control=document.getElementById('estrategia-didactica');
  if(control)control.replaceChildren(...strategies.map(v=>new Option(v,v)));
 }catch(e){
  console.error('Error al cargar catálogo curricular',e);
  if(serial===catalogRequest){sel.replaceChildren(new Option('Catálogo temporalmente no disponible',''));sel.add(new Option('Objetivo propio (no oficial)','CUSTOM'));counter.textContent='Catálogo EPJA no disponible'}
 }finally{if(serial===catalogRequest)sel.disabled=false}
};
function hevaPptTheme(){const value=document.getElementById('heva-ppt-estilo')?.value||'auto';return ['auto','azul','gemini_calido','editorial_calido','calida','institucional','contraste'].includes(value)?value:'auto'}
function hevaApplyPptTheme(material){if(material&&typeof material==='object')material.plantillaVisual=hevaPptTheme();return material}
document.getElementById('heva-ppt-estilo')?.addEventListener('change',()=>{
 try{localStorage.setItem('heva_ppt_estilo',hevaPptTheme())}catch{}
 if(materialActual){hevaApplyPptTheme(materialActual);guardarEnHistorial(false)}
});
try{const saved=localStorage.getItem('heva_ppt_estilo'),selector=document.getElementById('heva-ppt-estilo');if(selector&&[...selector.options].some(o=>o.value===saved))selector.value=saved}catch{}
let originalGenerate=generarMaterialReal;
generarMaterialReal=async function(mode='GENERADOR_ESTANDAR'){
 if(!document.getElementById('tema-especifico').value.trim()){alert('Escribe el tema específico de esta clase para no mezclar contenidos.');return}
 if(!document.getElementById('texto-oa').value.trim()){alert('Selecciona un objetivo de la lista curricular.');return}
 if(mode!=='GENERADOR_ESTANDAR'){alert('Usa Crear material con los ajustes de lectura seleccionados.');return}
 const snapshot={objetivoAprendizaje:document.getElementById('texto-oa').value,marcoCurricular:document.getElementById('marco-curricular').value,temaEspecifico:document.getElementById('tema-especifico').value,tipoMaterial:document.getElementById('tipo-material').value,objetivoId:document.getElementById('select-oa').selectedOptions[0]?.dataset.key||'',ajustes:[...document.querySelectorAll('input[id^="pie-"]:checked')].map(el=>el.parentElement.textContent.trim()).join('; ')};
 const previousMaterial=materialActual;
 await originalGenerate(mode);
 if(materialActual&&materialActual!==previousMaterial){materialActual=hevaApplyPptTheme(HEVA.material({...snapshot,...materialActual,objetivoId:snapshot.objetivoId,ajustes:snapshot.ajustes}));renderizarDocumentoEnPantalla();guardarEnHistorial(false)}
};
function editText(text,path){return `<div contenteditable="true" data-heva-path="${path}" class="border rounded p-2 whitespace-pre-line">${hevaEscape(text)}</div>`}
function syncEdits(){if(!materialActual)return;materialActual.titulo=document.getElementById('doc-titulo').innerText;materialActual.introduccionLectura=document.getElementById('doc-lectura').innerText;document.querySelectorAll('[data-heva-path]').forEach(el=>{let keys=el.dataset.hevaPath.split('.'),obj=materialActual;for(let k of keys.slice(0,-1))obj=obj[k];obj[keys.at(-1)]=el.innerText})}
renderizarDocumentoEnPantalla=function(){if(!materialActual)return;materialActual=HEVA.material(materialActual);let m=materialActual,e=hevaEscape;document.getElementById('doc-titulo').innerText=m.titulo;document.getElementById('doc-nivel').textContent=[m.nivel,m.asignatura,m.tipoMaterial].filter(Boolean).join(' · ');document.getElementById('doc-lectura').innerText=m.introduccionLectura;let obj=document.getElementById('doc-objetivo');if(!obj){obj=document.createElement('p');obj.id='doc-objetivo';document.getElementById('doc-nivel').parentElement.after(obj)}obj.textContent='Objetivo: '+(m.objetivoAprendizaje||'No registrado en esta versión');document.getElementById('lista-casos').innerHTML=m.casosEstudio.map((c,i)=>`<div><h4>Situación ${i+1}</h4>${editText(c.titulo,`casosEstudio.${i}.titulo`)}${editText(c.contextoReal,`casosEstudio.${i}.contextoReal`)}${editText(c.preguntaReflexion,`casosEstudio.${i}.preguntaReflexion`)}</div>`).join('')||'<p>No se solicitaron situaciones de análisis.</p>';document.getElementById('lista-alternativas').innerHTML=m.preguntasAlternativas.map((p,i)=>`<div class="border-b pb-3"><b>${i+1}.</b>${editText(p.enunciado,`preguntasAlternativas.${i}.enunciado`)}${p.alternativas.map((a,j)=>`<div>${a.letra}) ${editText(a.texto,`preguntasAlternativas.${i}.alternativas.${j}.texto`)}</div>`).join('')}</div>`).join('')||'<p>Sin selección múltiple.</p>';document.getElementById('lista-desarrollo').innerHTML=m.preguntasDesarrollo.map((p,i)=>`<div><b>Desarrollo ${i+1}</b>${editText(p.enunciado,`preguntasDesarrollo.${i}.enunciado`)}<p>Respuesta: _____________________________________________________</p></div>`).join('')||'<p>No se solicitaron preguntas de desarrollo.</p>';document.getElementById('tabla-pauta').innerHTML=m.preguntasAlternativas.map((p,i)=>`<tr><td>${i+1}</td><td>${e(p.claveCorrecta)}</td><td>${e(p.habilidad)}</td><td>${e(p.justificacion)}</td></tr>`).join('')+m.preguntasDesarrollo.map((p,i)=>`<tr><td>Desarrollo ${i+1}</td><td>Criterio</td><td>${e(p.habilidad)}</td><td>${e(p.criterioEvaluacion)}</td></tr>`).join('');document.getElementById('grilla-burbujas').innerHTML=m.preguntasAlternativas.map((p,i)=>`<div>${i+1}. ◯ A ◯ B ◯ C ◯ D</div>`).join('');document.getElementById('doc-puntaje').textContent='Puntaje: definir según pauta docente';document.getElementById('tabla-escala-notas').textContent='Configure puntajes y exigencia institucional antes de aplicar.';let dist=HEVA.distribution(m);document.getElementById('resumen-claves').textContent=Object.entries(dist.counts).map(([k,n])=>k+': '+n).join(' · ')+(dist.balanced?' · Equilibrada':' · Revisar distribución')+' · Edición antes de guardar o exportar';document.getElementById('dictamen-calidad').textContent='Revisión docente pendiente · '+HEVA.validate(m).length+' incidencias estructurales';let slides=document.getElementById('doc-diapositivas');if(!slides){slides=document.createElement('section');slides.id='doc-diapositivas';document.getElementById('doc-lectura').after(slides)}slides.innerHTML=m.diapositivas.map((s,i)=>`<div class="border rounded p-3"><h4>Diapositiva ${i+1} · ${e(s.titulo)}</h4><p>${e(Array.isArray(s.contenido)?s.contenido.join('\n'):s.contenido)}</p></div>`).join('');['btn-docx','btn-pptx','btn-guardar-doc'].forEach(id=>{let b=document.getElementById(id);b.disabled=false;b.classList.remove('cursor-not-allowed','opacity-50')})};
function readHistory(){try{let h=JSON.parse(localStorage.getItem('heva_historial')||'[]');return Array.isArray(h)?h:[]}catch{alert('El historial no se pudo leer. Descarga un respaldo antes de modificarlo.');return null}}
function storeHistoryVersion(material){
 const history=readHistory();
 if(!history)throw Error('el historial no está disponible');
 const materialId=material.materialId||crypto.randomUUID();
 const previous=history.find(entry=>entry.data?.materialId===materialId);
 const version=(previous?.data.version||0)+1;
 const data={...structuredClone(material),materialId,version};
 history.unshift({id:crypto.randomUUID(),fecha:new Date().toLocaleString('es-CL'),data});
 localStorage.setItem('heva_historial',JSON.stringify(history));
 Object.assign(material,{materialId,version});
 return version;
}
guardarEnHistorial=function(notify=true){
 if(!materialActual)return;
 syncEdits();
 try{
  const version=storeHistoryVersion(materialActual);
  cargarHistorial();
  if(notify)alert('Versión '+version+' guardada en este navegador.');
 }catch(error){alert('No se pudo guardar: '+error.message+'. Descarga un respaldo JSON.');}
};
cargarHistorial=function(){let h=readHistory(),c=document.getElementById('lista-guardados');if(!h)return;c.innerHTML=h.length?h.map((x,i)=>`<div class="border rounded p-3"><b>${hevaEscape(x.data.titulo)}</b> · ${hevaEscape(x.data.nivel)} · v${x.data.version||1} · ${hevaEscape(x.fecha)} <button class="border rounded px-2" onclick="recuperarHistorial(${i})">Abrir</button></div>`).join(''):'No hay materiales guardados.'};
// Aprovecha el auditor y el panel que HEVA YA tiene, sin volver a
// generar, bloquear documentos ni exigir pulsar «Revisar calidad».
async function hevaAuditBeforeExport(format){
 try{
  if(typeof mostrarAuditoriaHEVA==='function')await mostrarAuditoriaHEVA();
  const panel=document.getElementById('informe-auditoria-heva');
  if(panel){
   panel.dataset.ultimaExportacion=format;
   panel.setAttribute('role','status');
   if(!panel.textContent.includes('Revisión previa a exportar'))panel.textContent='Revisión previa a exportar '+format+' (orientativa; validación docente pendiente)\n'+panel.textContent;
  }
 }catch(error){
  console.warn('HEVA: el informe previo a la exportación no pudo actualizarse.',error?.message);
 }
}
exportarWord=async function(){if(!materialActual)return;syncEdits();await hevaAuditBeforeExport('Word');try{await HEVAOffice.word(materialActual,document.getElementById('incluir-pauta')?.checked)}catch(e){alert('No se pudo exportar Word: '+e.message)}};
exportarPowerPoint=async function(){if(!materialActual)return;syncEdits();await hevaAuditBeforeExport('PowerPoint');try{await HEVAOffice.powerpoint(materialActual,document.getElementById('incluir-pauta')?.checked)}catch(e){alert('No se pudo exportar PowerPoint: '+e.message)}};
function respaldoHEVA(){syncEdits();HEVAOffice.download(new Blob([JSON.stringify({schema:'heva-online-v2',historial:readHistory()||[],materialActual},null,2)],{type:'application/json'}),'HEVA_online_respaldo.json')}
function importOnlineJSON(file){if(!file)return;file.text().then(t=>{let d=JSON.parse(t);if(d.schema==='heva-online-v2'&&Array.isArray(d.historial)){respaldoHEVA();let old=readHistory()||[];localStorage.setItem('heva_historial',JSON.stringify([...d.historial,...old]));cargarHistorial();return}materialActual=HEVA.material(d.material||d);renderizarDocumentoEnPantalla();guardarEnHistorial();cambiarHerramienta('crear')}).catch(e=>alert('No se pudo importar: '+e.message))}
const toolbar=document.getElementById('btn-pptx').parentElement;toolbar.insertAdjacentHTML('beforeend','<label class="text-xs"><input type="checkbox" id="incluir-pauta"> Incluir pauta docente en exportación</label><button class="border rounded px-2" onclick="respaldoHEVA()">Respaldo JSON</button><label class="border rounded px-2">Importar JSON<input type="file" accept=".json" style="display:none" onchange="importOnlineJSON(this.files[0])"></label>');
// Las pestañas sin panel no deben abrir una pantalla vacía.
for(let [id,name,mode]of [['diffit','Lectura accesible','ACCESIBLE'],['remediacion','Refuerzo de aprendizajes','GUIA']]){let panel=document.createElement('section');panel.id='panel-'+id;panel.className='hidden border rounded bg-white p-6';panel.innerHTML=`<h2>${name}</h2><p>Selecciona asignatura, nivel y objetivo en Crear material. Activa lectura fácil y graduación de complejidad para preparar el apoyo.</p><button class="border rounded p-2" onclick="document.getElementById('tipo-material').value='${mode}';document.getElementById('pie-lectura-facil').checked=true;cambiarHerramienta('crear')">Preparar material de apoyo</button>`;document.querySelector('main').appendChild(panel)}

if ('serviceWorker' in navigator && location.protocol!=='file:') navigator.serviceWorker.register('/sw.js').catch(()=>{});
