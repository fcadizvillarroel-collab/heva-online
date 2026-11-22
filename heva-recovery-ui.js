/* Recupera respuestas largas por bloques; el documento visible solo cambia tras validación final. */
const HEVA_RECOVERY_VERSION=2;
const HEVA_RECOVERY_KEY='heva-recuperacion-v2';
const HEVA_RECOVERY_ARCHIVE_KEY='heva-recuperacion-apartada-v1';
// La copia apartada solo se descarta al sustituirla expresamente. Nunca limpiar todo el almacenamiento.
function hevaArchiveRead(){
 try{const saved=JSON.parse(localStorage.getItem(HEVA_RECOVERY_ARCHIVE_KEY)||'null');
 return saved?.version===HEVA_RECOVERY_VERSION&&typeof saved.planKey==='string'&&Array.isArray(saved.parts)?saved:null;}catch{return null;}
}
function hevaRecoveryRunning(){
 return hevaResumeBusy||!!document.getElementById('btn-generar')?.disabled;
}
function hevaArchiveCheckpoint(current){
 if(hevaRecoveryRunning())throw Error('Hay una generación en curso. No se puede apartar su avance hasta que termine o se interrumpa.');
 if(!current||current.version!==HEVA_RECOVERY_VERSION||!Array.isArray(current.parts))throw Error('No existe un avance válido para apartar.');
 const previous=hevaArchiveRead();
 if(previous&&previous.planKey!==current.planKey)throw Error('Ya existe otro avance apartado. Recupéralo antes de apartar uno diferente.');
 localStorage.setItem(HEVA_RECOVERY_ARCHIVE_KEY,JSON.stringify({...current,apartadoEn:new Date().toISOString()}));
 // Confirmar que la copia quedó escrita ANTES de quitar el avance activo.
 const saved=hevaArchiveRead();
 if(!saved||saved.planKey!==current.planKey||saved.parts.length!==current.parts.length)throw Error('No se pudo verificar la copia del avance. Se conserva el original.');
 localStorage.removeItem(HEVA_RECOVERY_KEY);
 return saved;
}
function hevaRestoreCheckpoint(){
 if(hevaRecoveryRunning())throw Error('Hay una generación en curso. No se puede restaurar otro avance.');
 const archived=hevaArchiveRead();
 if(!archived)throw Error('No hay un avance apartado recuperable.');
 const current=localStorage.getItem(HEVA_RECOVERY_KEY);
 if(current)throw Error('Existe otro avance activo. No se sobrescribirá.');
 const {apartadoEn,...draft}=archived;
 localStorage.setItem(HEVA_RECOVERY_KEY,JSON.stringify(draft));
 if(!recoveryRead(JSON.parse(draft.planKey)))throw Error('No se pudo verificar el avance restaurado; se mantiene la copia.');
 localStorage.removeItem(HEVA_RECOVERY_ARCHIVE_KEY);
 mostrarRecuperacionPendienteHEVA();
 return draft;
}
function hevaAutoSaveMaterial(material){
 if(!material||typeof material!=='object'||!material.titulo)throw Error('El material no está listo para guardar.');
 let stored;
 try{stored=JSON.parse(localStorage.getItem('heva_historial')||'[]');}catch{stored=[];}
 if(!Array.isArray(stored))stored=[];
 const identical=stored.some(record=>record?.data?.titulo===material.titulo&&record?.data?.tipoMaterial===material.tipoMaterial&&JSON.stringify(record.data)===JSON.stringify(material));
 if(!identical){
  stored.unshift({id:'MAT-'+Date.now(),fecha:new Date().toLocaleDateString('es-CL'),data:material});
  localStorage.setItem('heva_historial',JSON.stringify(stored.slice(0,20)));
 }
 return true;
}
function hevaRecoveryCommit(plan){
 const saved=recoveryRead(plan);
 if(!saved)return;
 localStorage.removeItem(HEVA_RECOVERY_KEY);
 mostrarRecuperacionPendienteHEVA();
}
function recoveryRead(plan){try{const x=JSON.parse(localStorage.getItem(HEVA_RECOVERY_KEY));if(x?.version!==HEVA_RECOVERY_VERSION||x?.planKey!==JSON.stringify(plan))return null;if(x.base&&(!Array.isArray(x.parts)||!Array.isArray(x.bloques)))return null;if(Array.isArray(x.bloques)&&x.parts.length>x.bloques.length)return null;return x}catch{return null}}
function recoverySave(x){try{localStorage.setItem(HEVA_RECOVERY_KEY,JSON.stringify({...x,version:HEVA_RECOVERY_VERSION}));mostrarRecuperacionPendienteHEVA()}catch{}}
async function recuperarMaterialHEVA(plan,allowRepair=true,repairRound=0){
 let checkpoint=recoveryRead(plan)||{planKey:JSON.stringify(plan),parts:[]};
 const message=document.getElementById('dictamen-calidad');
 const request=async (body,retry=true)=>{
  let response;try{response=await fetch('/api/recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan,...body}),signal:AbortSignal.timeout(58000)});}catch(err){throw Error('La solicitud de '+body.fase+' no llegó a completarse ('+(err.name==='TimeoutError'?'tiempo agotado':'red interrumpida')+'). El avance guardado se conserva. Reintenta Crear material.');}
  let data;try{data=await response.json()}catch{const type=response.headers.get('content-type')||'';throw Error('El servidor respondió HTTP '+response.status+' sin JSON válido durante '+body.fase+'. '+(response.status===504||response.status===502?'Probable límite de tiempo o error de función. ':'')+'El avance guardado se conserva.');}
  if(!response.ok&&body.fase==='items'&&data.codigo==='ITEM_DUPLICATES'&&data.borradorBloque){
   checkpoint.pendingDuplicate={tipo:body.batch.tipo,inicio:body.batch.inicio,parte:data.borradorBloque};recoverySave(checkpoint);
   if(retry){if(message)message.textContent='Reparando solo las preguntas repetidas; se conservan los demás ítems y pautas…';return request({...body,borradorBloque:undefined,repararDuplicados:data.borradorBloque},false);}
  }
  if(!response.ok&&body.fase==='items'&&data.codigo==='ITEM_TRACES_INCOMPLETE'&&data.borradorBloque){
   checkpoint.pendingPart={tipo:body.batch.tipo,inicio:body.batch.inicio,parte:data.borradorBloque};recoverySave(checkpoint);
   if(retry){if(message)message.textContent='Las preguntas están guardadas. Completando solo la trazabilidad, sin regenerarlas…';return request({...body,borradorBloque:data.borradorBloque},false);}
  }
  if(!response.ok&&retry&&data.codigo==='AI_RATE_LIMIT'&&data.reintentarEn>0&&data.reintentarEn<=60){
   if(message)message.textContent=`Esperando ${data.reintentarEn} segundos por la cuota de IA; el avance está guardado…`;
   await new Promise(resolve=>setTimeout(resolve,(data.reintentarEn+1)*1000));
   return request(body,false);
  }
  if(!response.ok&&retry&&body.fase==='base'&&response.status===422&&['STRATEGY_PLAN_INCOMPLETE','BASE_TRACES_INCOMPLETE'].includes(data.codigo)){
   if(message)message.textContent='El bloque base necesita completar su estrategia o las referencias de las diapositivas. Solicitando corrección…';
   return request({...body,corregirFormato:true},false);
  }
  if(!response.ok&&retry&&body.fase==='items'&&response.status===422&&typeof data.detalle==='string'&&(/Alternativas o clave inválidas/.test(data.detalle)||(body.batch?.tipo==='casos'&&/casosEstudio:|Falta trazabilidad de CASO|Caso incompleto|estrategia Estudio de casos|estrategia Detección de errores/.test(data.detalle))||(body.batch?.tipo==='desarrollo'&&/preguntasDesarrollo:|Falta trazabilidad de DES|Rúbrica incompleta/.test(data.detalle)))){
   if(message)message.textContent='El bloque no cumplió la estructura pedagógica requerida. Corrigiendo automáticamente sin perder avances…';
   return request({...body,corregirFormato:true},false);
  }
  if(!response.ok&&body.fase==='finalizar'&&data.reparacion)return data;
  if(!response.ok)throw Error((data.detalle||data.error||'Recuperación pendiente.')+(data.codigo?' ['+data.codigo+']':'')+(data.reintentable===false?' Revisa los parámetros del encargo antes de generar nuevamente.':data.codigo==='TYPE_ERROR'?' No se recomienda repetir la misma solicitud hasta corregir el error del servidor.':' Pulsa Crear material para continuar con el mismo encargo.'));
  return data;
 };
 if(!checkpoint.base){if(message)message.textContent='Recuperando la lectura y la estructura del material…';const data=await request({fase:'base',correcciones:checkpoint.correcciones||[]});checkpoint={...checkpoint,base:data.parte,autor:data.autor,bloques:data.bloques};recoverySave(checkpoint);}
 for(let i=0;i<checkpoint.bloques.length;i++){
  if(checkpoint.parts[i])continue;
  if(message)message.textContent=`Completando actividades: bloque ${i+1} de ${checkpoint.bloques.length}…`;
  const currentBatch=checkpoint.bloques[i],pending=checkpoint.pendingPart,duplicate=checkpoint.pendingDuplicate,repairDraft=checkpoint.repairDrafts?.[i]||(duplicate?.tipo===currentBatch.tipo&&duplicate?.inicio===currentBatch.inicio?duplicate.parte:null);
  const data=await request({fase:'items',base:checkpoint.base,autor:checkpoint.autor,parts:checkpoint.parts,batch:currentBatch,correcciones:checkpoint.correcciones||[],...(repairDraft?{repararDuplicados:repairDraft}:{}),...(!repairDraft&&pending?.tipo===currentBatch.tipo&&pending?.inicio===currentBatch.inicio?{borradorBloque:pending.parte}:{})});
  delete checkpoint.pendingPart;if(duplicate?.tipo===currentBatch.tipo&&duplicate?.inicio===currentBatch.inicio)delete checkpoint.pendingDuplicate;if(checkpoint.repairDrafts)delete checkpoint.repairDrafts[i];checkpoint.parts[i]=data.parte;recoverySave(checkpoint);
 }
 if(message)message.textContent='Comprobando objetivo, cantidades, casos y estructura…';
 const result=await request({fase:'finalizar',base:checkpoint.base,parts:checkpoint.parts,autor:checkpoint.autor});
 if(result.reparacion){
  const detail=result.detalle||result.reparacion.diagnostico?.join('; ')||'El servidor no informó el detalle de la corrección.';
  checkpoint.correcciones=result.reparacion.diagnostico||[detail];recoverySave(checkpoint);
  if(result.reparacion.localizada===false)throw Error('Corrección final pendiente: '+detail+' El avance está guardado.');
  if(result.reparacion.base)delete checkpoint.base;
  if(Array.isArray(result.reparacion.indices)){for(const i of result.reparacion.indices){const b=checkpoint.bloques[i],prefix=b?.tipo==='alternativas'?'ALT':b?.tipo==='casos'?'CASO':'';if(prefix&&result.reparacion.duplicados?.some(ref=>{const n=Number(ref.split('-')[1]);return ref.startsWith(prefix+'-')&&n>b.inicio&&n<=b.inicio+b.cantidad;})){checkpoint.repairDrafts??={};if(checkpoint.parts[i])checkpoint.repairDrafts[i]=checkpoint.parts[i];}checkpoint.parts[i]=null;}}
  else if(!result.reparacion.base)checkpoint.parts=checkpoint.parts.slice(0,result.reparacion.desde);
  recoverySave(checkpoint);const maxRounds=result.reparacion.duplicados?.length?3:1;if(!allowRepair||repairRound>=maxRounds)throw Error('Corrección final pendiente: '+detail+' El avance y los ítems válidos están guardados. Pulsa Crear material con el mismo encargo para retomar la reparación.');return recuperarMaterialHEVA(plan,allowRepair,repairRound+1);
 }
 if(!result.material||typeof result.material!=='object'||Array.isArray(result.material))throw Error('El servidor no devolvió un material válido. El avance guardado se conserva.');
 // No borrar el checkpoint hasta que el resultado se haya mostrado y guardado con éxito.
 return result;
}

// A saved online recovery must remain resumable after refreshing the app.
let hevaResumeBusy=false,hevaResumeMessage='';
function mostrarRecuperacionPendienteHEVA(){
 if(typeof document.createElement!=='function')return;
 const host=document.getElementById('panel-crear');if(!host)return;
 let box=document.getElementById('heva-resume-recovery'),saved,plan;
 try{saved=JSON.parse(localStorage.getItem(HEVA_RECOVERY_KEY)||'null');if(saved?.version===HEVA_RECOVERY_VERSION&&typeof saved.planKey==='string')plan=JSON.parse(saved.planKey);}catch{}
 const archived=hevaArchiveRead();
 if(!plan||!Array.isArray(saved.parts)){
  if(!archived){if(box)box.hidden=true;return;}
  if(!box){box=document.createElement('section');box.id='heva-resume-recovery';box.className='no-print border rounded p-3 bg-amber-50';box.style.gridColumn='1 / -1';host.prepend(box);}
  box.hidden=false;box.replaceChildren();
  const message=document.createElement('p');message.textContent='Existe un avance de una prueba o guía apartado de forma segura. Puedes recuperarlo para continuar.';
  const restore=document.createElement('button');restore.type='button';restore.textContent='Recuperar avance apartado';restore.className='heva-recovery-action border rounded px-3 py-2 font-bold';restore.disabled=hevaRecoveryRunning();
  const status=document.createElement('p');status.setAttribute('role','status');
  restore.onclick=()=>{try{hevaRestoreCheckpoint();}catch(error){status.textContent=error.message;}};
  box.append(message,restore,status);
  return;
 }
 if(!box){box=document.createElement('section');box.id='heva-resume-recovery';box.className='no-print border rounded p-3 bg-amber-50';box.style.gridColumn='1 / -1';host.prepend(box);}
 box.hidden=false;box.replaceChildren();
 const tipo=String(plan.tipoMaterial||'').toUpperCase();
 const nombres={GUIA:'guía',EVALUACION:'prueba',PRESENTACION:'presentación',PLANIFICACION:'planificación',TALLER:'taller',ACCESIBLE:'versión accesible'};
 const nombre=nombres[tipo]||'material';
 const title=document.createElement('h3');title.className='font-bold text-sm text-amber-950';title.textContent='Generación de '+nombre+' interrumpida';
 const text=document.createElement('p');text.className='text-xs text-amber-900 mt-1';
 text.textContent='HEVA conservó un avance sin terminar: '+String(plan.cantAlternativas||0)+' alternativas, '+String(plan.cantDesarrollo||0)+' preguntas de desarrollo y '+String(plan.cantCasos||0)+' casos solicitados. Puedes continuar el encargo original o apartarlo de forma recuperable antes de iniciar otro. No es una actividad de la '+nombre+'.';
 const actions=document.createElement('div');actions.className='heva-recovery-actions flex flex-wrap gap-2 mt-2';
 const button=document.createElement('button');button.type='button';button.textContent='Continuar '+nombre+' pendiente';button.className='heva-recovery-action border rounded px-3 py-2 font-bold bg-amber-100 text-amber-950';button.disabled=hevaResumeBusy||!!document.getElementById('btn-generar')?.disabled;
 const discard=document.createElement('button');discard.type='button';discard.textContent='Apartar avance (recuperable)';discard.className='heva-recovery-action border rounded px-3 py-2 font-semibold bg-white text-stone-800';discard.disabled=hevaRecoveryRunning();
 discard.onclick=()=>{
  if(hevaRecoveryRunning()){status.textContent='Generación en curso: no se puede apartar el avance hasta que finalice.';return;}
  try{
   const current=JSON.parse(localStorage.getItem(HEVA_RECOVERY_KEY)||'null');
   if(current?.version!==HEVA_RECOVERY_VERSION||current.planKey!==saved.planKey)throw Error('El avance cambió. Se conserva sin modificar.');
   hevaArchiveCheckpoint(current);
   hevaResumeMessage='Avance apartado con copia recuperable.';
   mostrarRecuperacionPendienteHEVA();
  }catch(error){status.textContent=error.message||'No se pudo guardar una copia segura. El progreso original se conserva.';}
 };

 const status=document.createElement('p');status.setAttribute('role','status');status.textContent=hevaResumeMessage;
 button.onclick=async()=>{const generate=document.getElementById('btn-generar');if(hevaResumeBusy||generate?.disabled)return;hevaResumeBusy=true;hevaResumeMessage='';button.disabled=true;if(generate)generate.disabled=true;
 try{const result=await recuperarMaterialHEVA(plan);if(result?.exito!==true||!result.material||typeof result.material!=='object')throw Error('La recuperación no devolvió un material válido; no se habilitan descargas.');if(typeof materialActual!=='undefined'&&materialActual&&typeof guardarEnHistorial==='function')guardarEnHistorial(false);materialActual=result.material;document.getElementById('error-ia')?.classList.add('hidden');renderizarDocumentoEnPantalla();hevaAutoSaveMaterial(materialActual);hevaRecoveryCommit(plan);if(typeof cambiarHerramienta==='function')cambiarHerramienta('crear');if(typeof runQuality==='function')await runQuality();}
 catch(error){hevaResumeMessage=error.message||'La recuperación sigue pendiente. El avance se conserva.';status.textContent=hevaResumeMessage;}
 finally{hevaResumeBusy=false;if(generate)generate.disabled=false;button.disabled=false;}
 };
 actions.append(button,discard);box.append(title,text,actions,status);
}
mostrarRecuperacionPendienteHEVA();
if(typeof MutationObserver==='function'&&document.getElementById('btn-generar'))new MutationObserver(mostrarRecuperacionPendienteHEVA).observe(document.getElementById('btn-generar'),{attributes:true,attributeFilter:['disabled']});
