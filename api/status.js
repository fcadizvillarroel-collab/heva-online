// Diagnostic-only connectivity checks. Never expose credentials or provider response bodies.
module.exports=async function status(req,res){
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.setHeader('Access-Control-Allow-Origin','*');
 if(req.method!=='GET')return res.status(405).json({error:'Utilice GET.'});
 const checks=[
  {name:'gemini',key:process.env.GEMINI_API_KEY,url:'https://generativelanguage.googleapis.com/v1beta/models',headers:k=>({'x-goog-api-key':k})},
  {name:'groq',key:process.env.GROQ_API_KEY,url:'https://api.groq.com/openai/v1/models',headers:k=>({Authorization:'Bearer '+k})},
  {name:'zai',key:process.env.ZAI_API_KEY,url:'https://api.z.ai/api/paas/v4/models',headers:k=>({Authorization:'Bearer '+k})}
 ];
 const results=await Promise.all(checks.map(async p=>{
  if(!p.key)return{configurado:false,conectividad:'sin_configurar'};
  try{
   const response=await fetch(p.url,{method:'GET',headers:p.headers(p.key),signal:AbortSignal.timeout(6000)});
   return{configurado:true,conectividad:response.ok?'correcta':'error_http',estadoHTTP:response.status};
  }catch(e){return{configurado:true,conectividad:e?.name==='TimeoutError'?'tiempo_agotado':'no_disponible'};}
 }));
 return res.status(200).json({estado:'diagnostico',proveedores:{gemini:results[0],groq:results[1],zai:results[2]},nota:'La conectividad no garantiza cuota disponible ni generación correcta.'});
};
