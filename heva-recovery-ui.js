/* Recupera respuestas largas por bloques; el documento visible solo cambia tras validación final. */
const HEVA_RECOVERY_KEY='heva-recuperacion-v1';
function recoveryRead(plan){try{const x=JSON.parse(localStorage.getItem(HEVA_RECOVERY_KEY));return x?.planKey===JSON.stringify(plan)?x:null}catch{return null}}
function recoverySave(x){try{localStorage.setItem(HEVA_RECOVERY_KEY,JSON.stringify(x))}catch{}}
async function recuperarMaterialHEVA(plan){
 let checkpoint=recoveryRead(plan)||{planKey:JSON.stringify(plan),parts:[]};
 const message=document.getElementById('dictamen-calidad');
 const request=async body=>{
  const response=await fetch('/api/recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan,...body}),signal:AbortSignal.timeout(58000)});
  let data;try{data=await response.json()}catch{throw Error('La conexión se interrumpió. Pulsa Crear material para continuar desde el último bloque guardado.');}
  if(!response.ok)throw Error((data.detalle||data.error||'Recuperación pendiente.')+' Pulsa Crear material para continuar con el mismo encargo.');
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
 try{localStorage.removeItem(HEVA_RECOVERY_KEY)}catch{}
 return result;
}
