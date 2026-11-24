/* HEVA Review Studio: capa de perfeccionamiento sobre los servicios canónicos de HEVA.
   Sin catálogo duplicado, sin claves en cliente y sin nuevas API de modelos. */
(function(){
'use strict';
var job=null,running=false,ctrl=null;
var reviewedKey=null;
function key(m){return typeof qualitySnapshot==='function'?qualitySnapshot(m):JSON.stringify(m)}
var $=function(id){return document.getElementById(id)};
var clone=function(o){return JSON.parse(JSON.stringify(o))};
var txt=function(x){return String(x==null?'':x)};
function status(s){var n=$('heva-review-status');if(n)n.textContent=s}
function stage(s){var n=$('heva-review-phase');if(n)n.textContent=s}
function lock(value){
 running=value;
 ['heva-review-existing','heva-review-generate','heva-review-inline','heva-review-quick','btn-generar'].forEach(function(id){if($(id))$(id).disabled=value});
 if($('heva-review-stop'))$('heva-review-stop').disabled=!value;
 if($('heva-review-apply'))$('heva-review-apply').disabled=value||!job||!job.corrected;
 if($('heva-review-restore'))$('heva-review-restore').disabled=value||!job||!job.corrected;
}
function save(){
 if(!job)return;
 try{
  var old=JSON.parse(localStorage.getItem('heva-review-studio-history')||'[]');
  var history=Array.isArray(old)?old:[];
  history=history.filter(function(x){return x.createdAt!==job.createdAt}).slice(0,2);
  localStorage.setItem('heva-review-studio-history',JSON.stringify([job].concat(history)));
 }catch(e){status('La sesión funciona, pero se agotó la memoria del navegador. Exporta el expediente JSON.')}
}
async function request(path,value){
 var r=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({...value,material:window.HEVASlideDesign?.forAI(value.material)||value.material}),signal:ctrl.signal});
 var d;try{d=await r.json()}catch(e){d={error:'Respuesta del servicio no legible'}};
 if(!r.ok||d.exito===false)throw new Error([d.error,d.detalle,d.codigo].filter(Boolean).join(' · ')||'Solicitud no completada');
 return d;
}
function material(){
 if(!window.HEVAReviewBridge)throw new Error('No se encontró el enlace con el generador principal.');
 var m=window.HEVAReviewBridge.getMaterial();
 if(!m)throw new Error('Genera primero un material o ábrelo desde Mis Materiales.');
 if(m.versionPedagogica!==3||!m.planGeneracion)throw new Error('El material debe incluir contrato pedagógico HEVA 3 y plan original. Vuelve a generarlo con HEVA.');
 if(!m.autoriaIA||!m.autoriaIA.proveedor)throw new Error('Sin autoría IA comprobable; no se puede elegir un revisor independiente.');
 return clone(m);
}
function invariant(a,b){
 ['tipoMaterial','objetivoAprendizaje','asignatura','nivel','marcoCurricular'].forEach(function(k){
   var x=a[k]||a.planGeneracion&&a.planGeneracion[k],y=b[k]||b.planGeneracion&&b.planGeneracion[k];
   if(txt(x)!==txt(y))throw new Error('La propuesta cambia '+k+'; no será aplicada.');
 });
 ['preguntasAlternativas','preguntasDesarrollo','casosEstudio'].forEach(function(k){
  if((a[k]||[]).length!==(b[k]||[]).length)throw new Error('La propuesta cambia el número de '+k+'; no será aplicada.');
 });
}
function items(r){return Array.isArray(r&&r.hallazgos)?r.hallazgos:[]}
function makeJob(m){job={createdAt:new Date().toISOString(),original:clone(m),corrected:null,first:null,second:null,phase:'original',incident:''};save();draw()}
async function review(m){
 if(running)return;
 if(job&&reviewedKey===key(m)&&job.first&&!job.incident){draw();status('Se reutiliza el expediente de esta versión sin consumir otra revisión.');return;}
 makeJob(m);reviewedKey=key(m);ctrl=new AbortController();lock(true);
 try{
  stage('1 / 3 · Revisión independiente');status('Solicitando revisión a otro proveedor IA mediante /api/review…');
  var one=await request('/api/review',{material:job.original,accion:'revisar'});
  if(!one.revision)throw new Error('No se recibió un informe de revisión.');
  job.first=one.revision;job.phase='revisado';save();draw();
  var verified=items(one.revision).filter(function(x){return x.tipo==='error_comprobado'});
  if(!verified.length){job.phase='verificado_sin_cambios';save();stage('Revisión completada');status('No hay errores comprobados que autoricen una corrección. Se conservan recomendaciones para decisión docente.');return}
  stage('2 / 3 · Corrección');status('Corrigiendo '+verified.length+' errores comprobados; sin modificar el original.');
  var two;
  try{two=await request('/api/review',{material:Object.assign({},job.original,{revisionIA:one.revision}),accion:'corregir'})}
  catch(e){job.incident='La corrección queda pendiente: '+e.message;status(job.incident);return}
  if(!two.material)throw new Error('La corrección no devolvió un material completo.');
  invariant(job.original,two.material);
  job.corrected=clone(window.HEVASlideDesign?.restoreImages(job.original,two.material)||two.material);job.phase='corregido';save();draw();
  stage('3 / 3 · Verificación');status('Verificando de nuevo la corrección antes de su aplicación…');
  try{
   var three=await request('/api/review',{material:job.corrected,accion:'revisar'});
   if(!three.revision)throw new Error('Segunda revisión sin informe.');
   job.second=three.revision;job.corrected.revisionIA=three.revision;job.phase='verificado';status('Corregido y revisado nuevamente. La validación final sigue siendo docente.');
  }catch(e){job.incident='Segunda revisión pendiente: '+e.message;status(job.incident)}
 }catch(e){job.incident=e.name==='AbortError'?'Revisión detenida; se conserva lo avanzado.':'Revisión pendiente: '+e.message;status(job.incident)}
 finally{save();lock(false);draw()}
}
function openWorkspace(){const host=$('heva-result-edit');if(host){host.open=true;host.scrollIntoView?.({behavior:'smooth',block:'start'});}}
async function reviewExisting(){
 if(running||window.HEVAStudioUI?.isBusy())return;
 try{var m=material();openWorkspace();await review(m)}
 catch(e){window.cambiarHerramienta('review-studio');status(e.message)}
}
function content(m){
 if(m&&window.HEVAPedagogy?.blocks)return window.HEVAPedagogy.blocks(m,false).map(b=>b.title+'\n'+b.text).join('\n\n');
 if(!m)return '';
 var lines=[m.titulo,m.introduccionLectura];
 (m.diapositivas||[]).forEach(function(d,i){lines.push('Diapositiva '+(i+1)+': '+txt(d.titulo)+'\n'+(Array.isArray(d.contenido)?d.contenido.join('\n'):txt(d.contenido)))});
 (m.preguntasAlternativas||[]).forEach(function(q,i){lines.push((i+1)+'. '+txt(q.enunciado)+'\n'+(q.alternativas||[]).map(function(x){return x.letra+') '+txt(x.texto)}).join('\n'))});
 return lines.filter(Boolean).join('\n\n').slice(0,10000)
}
function printReport(node,r){
 node.replaceChildren();
 if(!r){node.textContent='Revisión pendiente o no necesaria.';return}
 var intro=document.createElement('p');intro.textContent='Estado: '+txt(r.estado)+' · Hallazgos: '+items(r).length;node.appendChild(intro);
 var list=document.createElement('ul');list.className='heva-review-list';
 (r.criterios||[]).slice(0,9).forEach(function(c){var li=document.createElement('li');li.textContent=txt(c.id)+' — '+txt(c.estado)+': '+txt(c.fundamento);list.appendChild(li)});
 items(r).slice(0,15).forEach(function(h){var li=document.createElement('li');li.textContent=txt(h.tipo)+' · '+txt(h.referencia||h.seccion)+': '+txt(h.descripcion||h.problema||h.detalle||h.afirmacion);list.appendChild(li)});
 node.appendChild(list)
}
function advice(m){
 var out=[],audit;
 try{audit=window.HEVAOffice&&window.HEVAOffice.auditExport(m)}catch(e){}
 (audit&&audit.issues||[]).slice(0,8).forEach(function(x){out.push(txt(x.code)+': '+txt(x.detail||x.message))});
 if(m.tipoMaterial==='PRESENTACION'){
  var seen=new Set();
  (m.diapositivas||[]).forEach(function(d,i){
   var s=Array.isArray(d.contenido)?d.contenido.join(' '):txt(d.contenido);
   var w=s.trim().split(/\s+/).filter(Boolean).length;
   if(w>85)out.push('Diapositiva '+(i+1)+': '+w+' palabras; distribuir información y usar notas docentes.');
   if(w<12&&/explica|concepto|desarrollo/i.test(txt(d.funcion)))out.push('Diapositiva '+(i+1)+': explicación breve; revisar profundidad.');
   var key=s.toLowerCase().replace(/\s+/g,' ').trim();
   if(key.length>60&&seen.has(key))out.push('Diapositiva '+(i+1)+': desarrollo repetido.');
   if(key.length>60)seen.add(key)
  });
 }
 return [...new Set(out)].slice(0,15)
}
function draw(){
 if(!job){if($('heva-review-result'))$('heva-review-result').hidden=true;return}
 $('heva-review-result').hidden=false;
 $('heva-review-title').textContent=txt(job.original.titulo);
 $('heva-review-meta').textContent=[job.original.asignatura,job.original.nivel,job.original.tipoMaterial].filter(Boolean).join(' · ');
 $('heva-review-phase').textContent='Estado: '+job.phase+(job.incident?' · incompleto':'');
 $('heva-review-before').textContent=content(job.original);
 $('heva-review-after').textContent=content(job.corrected||job.original);
 $('heva-review-caption').textContent=job.corrected?'Versión corregida · validación docente pendiente':'Original conservado: todavía no hay corrección aplicable.';
 printReport($('heva-review-first'),job.first);
 printReport($('heva-review-second'),job.second);
 var root=$('heva-review-advice');root.replaceChildren();
 var suggestions=advice(job.corrected||job.original);
 suggestions.forEach(function(t){var li=document.createElement('li');li.textContent=t;root.appendChild(li)});
 if(!suggestions.length){var li=document.createElement('li');li.textContent='Sin alertas heurísticas adicionales; no constituye aprobación documental ni visual.';root.appendChild(li)}
 if($('heva-review-apply'))$('heva-review-apply').disabled=running||!job.corrected;
 if($('heva-review-restore'))$('heva-review-restore').disabled=running||!job.corrected;
}
function apply(which){
 if(running||!job)return;
 var current=window.HEVAReviewBridge.getMaterial();if(!current||![key(job.original),job.corrected&&key(job.corrected)].includes(key(current))){status('El material actual cambió. Abre el original correspondiente antes de aplicar esta versión.');return;}
 var m=which==='original'?job.original:job.corrected;
 if(!m){status('No hay versión corregida disponible.');return}
 try{invariant(job.original,m);window.HEVAReviewBridge.applyMaterial(clone(m));status('Versión '+(which==='original'?'original':'corregida')+' aplicada. Usa los botones Word/PowerPoint del generador.');save()}
 catch(e){status(e.message)}
}
function download(){
 if(!job)return;
 var blob=new Blob([JSON.stringify(Object.assign({formato:'heva-review-studio-v1',advertencia:'Incluye respuestas y pautas docentes; no compartir directamente con estudiantes.'},job),null,2)],{type:'application/json'});
 var url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='HEVA_Review_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1200)
}
function init(){
 if($('panel-review-studio')||!document.querySelector('main'))return;
 var style=document.createElement('style');
 style.textContent='.heva-review-panel.hidden{display:none!important}.heva-review-panel{display:grid;gap:14px;font:14px/1.55 system-ui;color:#30413e}.heva-review-panel .review-card{border:1px solid #dedfd8;background:#fff;border-radius:12px;padding:18px}.heva-review-panel .review-hero{background:#fff8f1}.heva-review-panel h2{font-size:23px;font-weight:800;color:#773347}.heva-review-panel h3{font-size:16px;font-weight:800;color:#31545b;margin:0 0 9px}.heva-review-panel .review-actions{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}.heva-review-panel button{border:1px solid #75384a;border-radius:7px;padding:9px 12px;color:#fff;background:#75384a;font-weight:700;font-size:12px}.heva-review-panel button.secondary{color:#31545b;background:#eff7f4;border-color:#c4d9d1}.heva-review-panel button:disabled{opacity:.5}.heva-review-panel #heva-review-status{background:#f1f6f3;border-left:4px solid #639987;padding:11px}.heva-review-panel .review-columns{display:grid;grid-template-columns:1fr 1fr;gap:12px}.heva-review-panel pre{font:12px/1.6 monospace;background:#f6f8f6;border-radius:8px;padding:12px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:380px;overflow:auto}.heva-review-list{padding-left:20px}.heva-review-list li{padding:5px 0}@media(max-width:760px){.heva-review-panel .review-columns{grid-template-columns:1fr}}';
 document.head.appendChild(style);
 var panel=document.createElement('section');panel.id='panel-review-studio';panel.className='heva-review-panel no-print';panel.setAttribute('aria-label','Edición, adaptación y mejora del material');
 panel.innerHTML='<div class="review-card review-hero"><h3>Revisión y mejora integral con IA</h3><p>Una segunda IA revisa el material ya creado. Si encuentra errores comprobados, propone una versión corregida para que decidas si aplicarla.</p><div class="review-actions"><button id="heva-review-existing" type="button">Revisar y perfeccionar material actual</button><button id="heva-review-stop" class="secondary" disabled type="button">Detener</button></div><p id="heva-review-status" role="status" aria-live="polite">Genera o recupera un material antes de perfeccionarlo.</p><p style="font-size:12px">Sólo se corrigen errores comprobados. Las sugerencias y la calidad visual requieren decisión docente. Depende de un segundo proveedor IA habilitado.</p></div><div id="heva-review-result" hidden><div class="review-card"><h3 id="heva-review-title"></h3><p id="heva-review-meta"></p><p id="heva-review-phase"></p><div class="review-actions"><button id="heva-review-apply" disabled type="button">Aplicar versión corregida en HEVA</button><button id="heva-review-restore" class="secondary" disabled type="button">Restaurar original</button><button id="heva-review-download" class="secondary" type="button">Descargar expediente JSON</button></div></div><div class="review-card"><h3>Comparación de versiones</h3><div class="review-columns"><div><b>Original</b><pre id="heva-review-before"></pre></div><div><b id="heva-review-caption">Corregido</b><pre id="heva-review-after"></pre></div></div></div><div class="review-columns"><div class="review-card"><h3>Informe independiente</h3><div id="heva-review-first"></div></div><div class="review-card"><h3>Informe posterior</h3><div id="heva-review-second"></div></div></div><div class="review-card"><h3>Observaciones didácticas y visuales</h3><p>No equivalen a rediseño automático de las diapositivas. Se reutiliza el control Office de HEVA, sin auditar nuevamente los OA.</p><ul id="heva-review-advice" class="heva-review-list"></ul></div></div>';
 const tools=document.createElement('div');tools.id='heva-studio-workspace';panel.insertBefore(tools,panel.querySelector('#heva-review-result'));const host=$('heva-result-edit');if(!host)return;host.append(panel);
 $('heva-review-existing').addEventListener('click',reviewExisting);
 $('heva-review-stop').addEventListener('click',function(){if(ctrl)ctrl.abort()});
 $('heva-review-apply').addEventListener('click',function(){apply('corrected')});
 $('heva-review-restore').addEventListener('click',function(){apply('original')});
 $('heva-review-download').addEventListener('click',download);
 try{var history=JSON.parse(localStorage.getItem('heva-review-studio-history')||'[]');if(Array.isArray(history)&&history[0]&&history[0].original){job=history[0];reviewedKey=key(job.original);draw();status('Se recuperó el último expediente local.')}}catch(e){}
 window.HEVAReviewStudio={reviewExisting:reviewExisting,open:openWorkspace,getJob:function(){return job},isBusy:function(){return running}};window.HEVAStudioUI?.mount();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();