const test=require('node:test');
const assert=require('node:assert/strict');
const provider=require('../api/_providers.cjs');
test('HEVA B elige Z.ai cuando devuelve JSON válido y conserva el modelo',async()=>{
 const oldFetch=global.fetch,oldKey=process.env.ZAI_API_KEY,oldModel=process.env.ZAI_MODEL;
 process.env.ZAI_API_KEY='test-key';process.env.ZAI_MODEL='glm-4.7';
 global.fetch=async(url,opts)=>{
  assert.match(url,/api\.z\.ai\/api\/paas\/v4\/chat\/completions/);
  assert.equal(JSON.parse(opts.body).model,'glm-4.7');
  assert.match(opts.headers.Authorization,/Bearer test-key/);
  return {ok:true,status:200,headers:{get:()=>null},json:async()=>({choices:[{message:{content:'{"titulo":"prueba"}'},finish_reason:'stop'}]})};
 };
 try{
  const out=await provider.call('Crea una guía','', '', '',[],{deadline:Date.now()+10000});
  assert.equal(out.provider,'zai');assert.equal(out.model,'glm-4.7');assert.equal(out.value.titulo,'prueba');
 }finally{
  global.fetch=oldFetch;
  if(oldKey===undefined)delete process.env.ZAI_API_KEY;else process.env.ZAI_API_KEY=oldKey;
  if(oldModel===undefined)delete process.env.ZAI_MODEL;else process.env.ZAI_MODEL=oldModel;
 }
});
