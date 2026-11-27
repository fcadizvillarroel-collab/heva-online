const {authorizeTeacher,sameOrigin,cookieName}=require('./_ai-access.cjs');
const {parseProfileBackup}=require('../heva-course-workflow.js');

function setSession(res,token='',age=0){
 res.setHeader('Set-Cookie',cookieName+'='+token+'; Path=/; Max-Age='+age+'; HttpOnly; Secure; SameSite=Strict');
}
module.exports=async function courseProfiles(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET')return res.status(200).json({enabled:process.env.HEVA_COURSE_SYNC==='true'});
 if(req.method!=='POST')return res.status(405).json({error:'Utilice POST.'});
 if(!sameOrigin(req))return res.status(403).json({error:'Origen de solicitud inválido.'});
 const {action,email,password,backup,revision,accountId}=req.body||{};
 if(action==='logout'){setSession(res);return res.status(200).json({ok:true});}
 if(process.env.HEVA_COURSE_SYNC!=='true')return res.status(503).json({error:'La sincronización de perfiles está deshabilitada.'});
 const url=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return res.status(503).json({error:'La sincronización no está configurada.'});
 const send=(path,init={})=>fetch(url+path,{...init,headers:{apikey:key,Authorization:'Bearer '+key,
  'Content-Type':'application/json',...init.headers},signal:AbortSignal.timeout(5000)});
 try{
  let account;
  if(action==='login'){
   if(typeof email!=='string'||!email.trim()||email.length>254||typeof password!=='string'||!password||password.length>256){
    return res.status(400).json({error:'Completa correo y contraseña.'});
   }
   const auth=await send('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:email.trim(),password})});
   if(!auth.ok)return res.status(auth.status===429?429:auth.status>=500?503:401).json({error:'No se pudo iniciar sesión.'});
   const session=await auth.json();
   if(typeof session.access_token!=='string'||!/^[-\w]+\.[-\w]+\.[-\w]+$/.test(session.access_token))throw Error();
   account=await authorizeTeacher({headers:{authorization:'Bearer '+session.access_token}},res,url,key);
   if(!account)return;
   setSession(res,session.access_token,Math.min(1800,Number(session.expires_in)||900));
   return res.status(200).json({ok:true});
  }
  if(action!=='read'&&action!=='write')return res.status(400).json({error:'Acción no admitida.'});
  account=await authorizeTeacher(req,res,url,key);
  if(!account)return;
  if(accountId&&accountId!==account)return res.status(409).json({error:'La sesión cambió en otra pestaña. Cierra la sesión de perfiles y vuelve a entrar.'});
  const table='/rest/v1/heva_perfiles_curso_sync';
  const filter='?usuario=eq.'+account;
  if(action==='read'){
   const response=await send(table+filter+'&select=revision,perfiles');
   if(!response.ok)throw Error();
   const rows=await response.json();
   return res.status(200).json({accountId:account,...(rows[0]||{revision:0,perfiles:'{"schema":"heva-perfiles-curso-v1","perfiles":[]}'})});
  }
  if(accountId!==account||!Number.isSafeInteger(revision)||revision<0||revision>=Number.MAX_SAFE_INTEGER)return res.status(400).json({error:'Revisión inválida.'});
  try{parseProfileBackup(backup);}catch(error){return res.status(400).json({error:error.message});}
  const update={revision:revision+1,perfiles:backup};
  const result=revision===0?await send(table,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({usuario:account,...update})}):
   await send(table+filter+'&revision=eq.'+revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(update)});
  if(result.status===409)return res.status(409).json({error:'Otro dispositivo actualizó los perfiles.'});
  if(!result.ok)throw Error();
  if(!(await result.json()).length)return res.status(409).json({error:'Otro dispositivo actualizó los perfiles.'});
  return res.status(200).json(update);
 }catch{return res.status(503).json({error:'No se pudo consultar la sincronización.'});}
};
