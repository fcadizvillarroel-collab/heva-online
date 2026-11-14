/* Recupera respuestas largas por bloques; el documento visible solo cambia tras validación final. */
const HEVA_RECOVERY_KEY='heva-recuperacion-v1';
function recoveryRead(plan){try{const x=JSON.parse(localStorage.getItem(HEVA_RECOVERY_KEY));if(x?.planKey!==JSON.stringify(plan))return null;if(x.base&&(!Array.isArray(x.parts)||!Array.isArray(x.bloques)))return null;if(Array.isArray(x.bloques)&&x.parts.length>x.bloques.length)return null;return x}catch{return null}}
function recoverySave(x){try{localStorage.setItem(HEVA_RECOVERY_KEY,JSON.stringify(x))}catch{}}
async function recuperarMaterialHEVA(plan,allowRepair=true){
 let checkpoint=recoveryRead(plan)||{planKey:JSON.stringify(plan),parts:[]};
 const message=document.getElementById('dictamen-calidad');
 const request=async (body,retry=true)=>{
  let response;try{response=await fetch('/api/recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan,...body}),signal:AbortSignal.timeout(58000)});}catch(err){throw Error('La solicitud de '+body.fase+' no llegó a completarse ('+(err.name==='TimeoutError'?'tiempo agotado':'red interrumpida')+'). El avance guardado se conserva. Reintenta Crear material.');}
  let data;try{data=await response.json()}catch{const type=response.headers.get('content-type')||'';throw Error('El servidor respondió HTTP '+response.status+' sin JSON válido durante '+body.fase+'. '+(response.status===504||response.status===502?'Probable límite de tiempo o error de función. ':'')+'El avance guardado se conserva.');}
  if(!response.ok&&retry&&data.codigo==='AI_RATE_LIMIT'&&data.reintentarEn>0&&data.reintentarEn<=60){
   if(message)message.textContent=`Esperando ${data.reintentarEn} segundos por la cuota de IA; el avance está guardado…`;
   await new Promise(resolve=>setTimeout(resolve,(data.reintentarEn+1)*1000));
   return request(body,false);
  }
  if(!response.ok&&retry&&body.fase==='items'&&response.status===422&&typeof data.detalle==='string'&&(/Alternativas o clave inválidas/.test(data.detalle)||(body.batch?.tipo==='casos'&&/casosEstudio:|Falta trazabilidad de CASO|Caso incompleto|estrategia Estudio de casos|estrategia Detección de errores/.test(data.detalle))||(body.batch?.tipo==='desarrollo'&&/preguntasDesarrollo:|Falta trazabilidad de DES|Rúbrica incompleta/.test(data.detalle)))){
   if(message)message.textContent='El bloque no cumplió la estructura pedagógica requerida. Corrigiendo automáticamente sin perder avances…';
   return request({...body,corregirFormato:true},false);
  }
  if(!response.ok&&body.fase==='finalizar'&&data.reparacion)return data;
  if(!response.ok)throw Error((data.detalle||data.error||'Recuperación pendiente.')+(data.codigo?' ['+data.codigo+']':'')+(data.reintentable===false?' Revisa los parámetros del encargo antes de generar nuevamente.':data.codigo==='TYPE_ERROR'?' No se recomienda repetir la misma solicitud hasta corregir el error del servidor.':' Pulsa Crear material para continuar con el mismo encargo.'));
  return data;
 };
 if(!checkpoint.base){if(message)message.textContent='Recuperando la lectura y la estructura del material…';const data=await request({fase:'base'});checkpoint={...checkpoint,base:data.parte,autor:data.autor,bloques:data.bloques};recoverySave(checkpoint);}
 for(let i=checkpoint.parts.length;i<checkpoint.bloques.length;i++){
  if(message)message.textContent=`Completando actividades: bloque ${i+1} de ${checkpoint.bloques.length}…`;
  const data=await request({fase:'items',base:checkpoint.base,autor:checkpoint.autor,parts:checkpoint.parts,batch:checkpoint.bloques[i]});
  checkpoint.parts.push(data.parte);recoverySave(checkpoint);
 }
 if(message)message.textContent='Comprobando objetivo, cantidades, casos y estructura…';
 const result=await request({fase:'finalizar',base:checkpoint.base,parts:checkpoint.parts,autor:checkpoint.autor});
 if(result.reparacion){
  if(!allowRepair)throw Error('El material aún requiere corrección. El avance se conserva para retomarlo.');
  if(result.reparacion.base){checkpoint={planKey:JSON.stringify(plan),parts:[]}}else checkpoint.parts=checkpoint.parts.slice(0,result.reparacion.desde);
  recoverySave(checkpoint);return recuperarMaterialHEVA(plan,false);
 }
 try{localStorage.removeItem(HEVA_RECOVERY_KEY)}catch{}
 return result;
}
