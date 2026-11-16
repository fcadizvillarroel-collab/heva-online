// Opt-in authentication for paid-quota-consuming AI endpoints.
// Enable HEVA_AI_REQUIRE_AUTH=true only after the teacher sign-in UI is deployed.
// No service-role secret is ever returned to the client.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function protect(req,res){
 // Piloto sin cuentas: cuota compartida opcional; no equivale a 10 usuarios identificados.
 if(process.env.HEVA_AI_REQUIRE_AUTH!=='true'){
  if(process.env.HEVA_PILOT_SHARED_QUOTA!=='true')return true;
  const url=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=(process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
  if(!url||!key){res.status(503).json({error:'La cuota del piloto no está configurada.'});return false}
  try{
   const limit=Math.max(1,Math.min(1000,Number(process.env.HEVA_PILOT_DAILY_REQUESTS)||100));
   const response=await fetch(url+'/rest/v1/rpc/heva_consumir_cuota_piloto',{
    method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},
    body:JSON.stringify({p_limite:limit}),signal:AbortSignal.timeout(5000)
   });
   const allowed=await response.json().catch(()=>null);
   if(!response.ok){res.status(503).json({error:'No se pudo verificar la cuota del piloto.'});return false}
   if(allowed!==true){res.status(429).json({error:'El piloto alcanzó su límite diario de solicitudes de IA.'});return false}
   return true;
  }catch{res.status(503).json({error:'No se pudo consultar la cuota del piloto.'});return false}
 }

 const url=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
 const key=(process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
 if(!url||!key){res.status(503).json({error:'Acceso docente no configurado.'});return false}
 const match=/^Bearer (\S+)$/i.exec(req.headers?.authorization||'');
 if(!match){res.status(401).json({error:'Inicia sesión para generar materiales.'});return false}
 try{
  const response=await fetch(url+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+match[1]},signal:AbortSignal.timeout(5000)});
  const user=await response.json().catch(()=>null);
  if(!response.ok||!uuid.test(user?.id||'')){res.status(401).json({error:'Sesión docente inválida o vencida.'});return false}
  // Use an atomic DB RPC: concurrent requests cannot evade the daily limit.
  const limit=Math.max(1,Math.min(100,Number(process.env.HEVA_AI_DAILY_LIMIT)||20));
  const usage=await fetch(url+'/rest/v1/rpc/heva_consumir_cuota_ia',{
    method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},
    body:JSON.stringify({p_usuario:user.id,p_limite:limit}),signal:AbortSignal.timeout(5000)
  });
  const accepted=await usage.json().catch(()=>null);
  if(!usage.ok){res.status(503).json({error:'No se pudo verificar la cuota docente.'});return false}
  if(accepted!==true){res.status(429).json({error:'Se alcanzó la cuota diaria de solicitudes de IA.'});return false}
  return true;
 }catch{res.status(503).json({error:'No se pudo comprobar la sesión y la cuota.'});return false}
}
module.exports={protect};
