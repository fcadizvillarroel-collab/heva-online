// Auth and quotas are opt-in until the teacher sign-in flow is available.
// Privileged credentials stay inside these server-side requests.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedRole=role=>role==='docente'||role==='administrador';
function limitFor(value,fallback,maximum){
 if(!String(value||'').trim())return fallback;
 const limit=Number(value);
 if(!Number.isSafeInteger(limit)||limit<1)throw new Error('Cuota configurada inválida');
 return Math.min(limit,maximum);
}
async function checkQuota(url,headers,body){
 const response=await fetch(url,{method:'POST',headers:{...headers,'Content-Type':'application/json'},
  body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw new Error('No se verificó la cuota');
 const accepted=await response.json();
 if(typeof accepted!=='boolean')throw new Error('Respuesta de cuota no reconocida');
 return accepted;
}
async function protect(req,res){
 const requiresTeacher=process.env.HEVA_AI_REQUIRE_AUTH==='true';
 if(!requiresTeacher&&process.env.HEVA_PILOT_SHARED_QUOTA!=='true')return true;
 const url=(process.env.SUPABASE_URL||'').trim().replace(/\/$/,'');
 const key=(process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
 if(!url||!key){
  res.status(503).json({codigo:'AI_ACCESS_UNCONFIGURED',error:'El control de acceso a IA no está configurado.'});
  return false;
 }
 const serviceHeaders={apikey:key,Authorization:'Bearer '+key};
 if(!requiresTeacher){
  try{
   const limit=limitFor(process.env.HEVA_PILOT_DAILY_REQUESTS,100,1000);
   if(await checkQuota(url+'/rest/v1/rpc/heva_consumir_cuota_piloto',serviceHeaders,{p_limite:limit}))return true;
   res.status(429).json({codigo:'AI_PILOT_QUOTA_EXHAUSTED',error:'El piloto alcanzó su límite diario de solicitudes de IA.'});
  }catch{
   res.status(503).json({codigo:'AI_QUOTA_UNAVAILABLE',error:'No se pudo verificar la cuota del piloto.'});
  }
  return false;
 }
 try{
  const userId=await authorizeTeacher(req,res,url,key);
  if(!userId)return false;
  const limit=limitFor(process.env.HEVA_AI_DAILY_LIMIT,20,100);
  if(await checkQuota(url+'/rest/v1/rpc/heva_consumir_cuota_ia',serviceHeaders,{p_usuario:userId,p_limite:limit}))return true;
  res.status(429).json({codigo:'AI_DAILY_QUOTA_EXHAUSTED',error:'Se alcanzó la cuota diaria de solicitudes de IA.'});
 }catch{
  res.status(503).json({codigo:'AI_ACCESS_UNAVAILABLE',error:'No se pudieron comprobar la sesión, los permisos o la cuota.'});
 }
 return false;
}
const cookieName='__Host-heva-teacher';
function sameOrigin(req){
 try{
  const origin=new URL(req.headers.origin);
  return origin.host===req.headers.host&&
   (origin.protocol==='https:'||(origin.protocol==='http:'&&['localhost','127.0.0.1'].includes(origin.hostname)));
 }catch{return false;}
}
function sessionCookie(req){
 return req.headers?.cookie?.split(';').map(value=>value.trim()).find(value=>value.startsWith(cookieName+'='))?.slice(cookieName.length+1);
}
async function authorizeTeacher(req,res,url,key){
 const serviceHeaders={apikey:key,Authorization:'Bearer '+key};
 const bearer=/^Bearer (\S+)$/i.exec(req.headers?.authorization||'')?.[1]||
  (sameOrigin(req)?sessionCookie(req):null);
 if(!bearer){
  res.status(401).json({codigo:'AI_AUTH_REQUIRED',error:'Inicia sesión para generar materiales.'});
  return false;
 }
 try{
  const response=await fetch(url+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+bearer},signal:AbortSignal.timeout(5000)});
  if(response.status===401||response.status===403){
   res.status(401).json({codigo:'AI_AUTH_INVALID',error:'Sesión docente inválida o vencida.'});
   return false;
  }
  if(!response.ok)throw new Error('Servicio de autenticación no disponible');
  const user=await response.json();
  if(!uuid.test(user?.id||'')||user.is_anonymous===true){
   res.status(401).json({codigo:'AI_AUTH_INVALID',error:'Sesión docente inválida o vencida.'});
   return false;
  }
  const profiles=await fetch(url+'/rest/v1/heva_perfiles?usuario=eq.'+encodeURIComponent(user.id)+'&select=rol&limit=1',
   {headers:serviceHeaders,signal:AbortSignal.timeout(5000)});
  if(!profiles.ok)throw new Error('No se verificó el perfil');
  const rows=await profiles.json();
  if(!Array.isArray(rows))throw new Error('Respuesta de perfiles no reconocida');
  if(!rows.some(row=>allowedRole(row?.rol))){
   res.status(403).json({codigo:'AI_ROLE_REQUIRED',error:'La cuenta necesita un perfil docente o administrador habilitado.'});
   return false;
  }
  return user.id;
 }catch{
  res.status(503).json({codigo:'AI_ACCESS_UNAVAILABLE',error:'No se pudieron comprobar la sesión o los permisos.'});
  return false;
 }
}
module.exports={protect,authorizeTeacher,sameOrigin,cookieName};
