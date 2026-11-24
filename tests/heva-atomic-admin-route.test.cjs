'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/curriculum/admin.js');
const userId='22222222-2222-4222-8222-222222222222';
const stagingId='11111111-1111-4111-8111-111111111111';
function res(){
 return {statusCode:200,body:null,headers:{},
  setHeader(k,v){this.headers[k]=v;return this},
  status(c){this.statusCode=c;return this},
  json(d){this.body=d;return this},
  end(){return this}
 };
}
function reply(value,ok=true){return {ok,json:async()=>value};}
test('approved curriculum goes through one atomic RPC, never three manual writes',async()=>{
 const previousFetch=global.fetch,previousUrl=process.env.SUPABASE_URL,previousKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const called=[];
 try{
  process.env.SUPABASE_URL='https://heva-test.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY='fake-service-key-for-test-only';
  global.fetch=async(url,opts={})=>{
   called.push({url:String(url),method:opts.method||'GET',body:opts.body});
   if(String(url).includes('/auth/v1/user'))return reply({id:userId});
   if(String(url).includes('/rest/v1/heva_perfiles?'))return reply([{usuario:userId}]);
   if(String(url).includes('/rest/v1/rpc/heva_aprobar_objetivo'))return reply({id:'33333333-3333-4333-8333-333333333333',clave_interna:'OA-EJEMPLO'});
   throw new Error('Unexpected direct database request: '+url);
  };
  const out=res();
  await handler({method:'POST',query:{action:'approve'},headers:{authorization:'Bearer simulated'},body:{stagingId,comprobadoDocumentalmente:true,notas:'Fuente contrastada'}},out);
  assert.equal(out.statusCode,200);
  assert.equal(out.body.exito,true);
  assert.equal(out.body.atomico,true);
  assert.equal(called.length,3);
  assert.equal(called.filter(c=>c.url.includes('/rest/v1/rpc/heva_aprobar_objetivo')).length,1);
  assert.equal(called.filter(c=>/\/rest\/v1\/(curriculo_publicado|curriculo_staging|curriculo_auditoria)(\?|$)/.test(c.url)).length,0);
  const payload=JSON.parse(called[2].body);
  assert.equal(payload.p_staging_id,stagingId);
  assert.equal(payload.p_usuario,userId);
 }finally{
  global.fetch=previousFetch;
  if(previousUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=previousUrl;
  if(previousKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=previousKey;
 }
});
test('approval denies missing documentary attestation without network write',async()=>{
 const previousFetch=global.fetch,previousUrl=process.env.SUPABASE_URL,previousKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 try{
  process.env.SUPABASE_URL='https://heva-test.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY='fake-service-key-for-test-only';
  let touched=false;global.fetch=async(url,opts)=>{
   if((opts||{}).method==='POST')touched=true;
   if(String(url).includes('/auth/v1/user'))return reply({id:userId});
   if(String(url).includes('/rest/v1/heva_perfiles?'))return reply([{usuario:userId}]);
   throw new Error('Unexpected request');
  };
  const out=res();
  await handler({method:'POST',query:{action:'approve'},headers:{authorization:'Bearer simulated'},body:{stagingId,comprobadoDocumentalmente:'false'}},out);
  assert.equal(out.statusCode,400);
  assert.equal(touched,false);
 }finally{
  global.fetch=previousFetch;
  if(previousUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=previousUrl;
  if(previousKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=previousKey;
 }
});
