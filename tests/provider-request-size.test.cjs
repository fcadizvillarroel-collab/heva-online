'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {call}=require('../api/_providers.cjs');
test('HTTP 413 preserves the request-too-large diagnosis without trying four identical oversized calls',async()=>{
 const original=global.fetch;
 let attempts=0;
 try{
  global.fetch=async()=>{attempts++;return{ok:false,status:413,statusText:'Payload too large',headers:{get:()=>null},json:async()=>({error:{message:'too large'}})};};
  await assert.rejects(()=>call('A'.repeat(500),null,null,'dummy',['gemini'],{deadline:Date.now()+10000}),e=>e.code==='AI_REQUEST_TOO_LARGE'&&e.proveedores.some(p=>p.estadoHTTP===413));
  assert.equal(attempts,1);
 }finally{global.fetch=original;}
});

test('Groq 429 no agota cuota reiterando la misma solicitud en cuatro modelos',async()=>{
 const old=global.fetch;let calls=0;
 try{
  global.fetch=async()=>{calls++;return{ok:false,status:429,headers:{get:()=> '60'},json:async()=>({error:{message:'rate limit'}})};};
  await assert.rejects(()=>call('Guía EPJA',null,null,'test',['gemini'],{deadline:Date.now()+8000}),e=>e.code==='AI_RATE_LIMIT'&&e.retryAfter===60);
  assert.equal(calls,1);
 }finally{global.fetch=old;}
});
test('Groq 404 de modelo permite probar otro modelo gratuito',async()=>{
 const old=global.fetch;let calls=0;
 try{
  global.fetch=async()=>{calls++;if(calls===1)return{ok:false,status:404,headers:{get:()=>null},json:async()=>({error:{message:'model not found'}})};return{ok:true,status:200,headers:{get:()=>null},json:async()=>({choices:[{message:{content:'{"titulo":"Guía válida"}'},finish_reason:'stop'}]})};};
  const result=await call('Guía EPJA',null,null,'test',['gemini'],{deadline:Date.now()+12000});
  assert.equal(calls,2);assert.equal(result.value.titulo,'Guía válida');
 }finally{global.fetch=old;}
});
test('Gemini 429 pasa directamente a Groq sin gastar la misma cuota en otro modelo',async()=>{
 const old=global.fetch;let gemini=0,groq=0;
 try{
  global.fetch=async url=>{if(String(url).includes('generativelanguage')){gemini++;return{ok:false,status:429,headers:{get:()=>null},json:async()=>({error:{message:'quota'}})};}groq++;return{ok:true,status:200,headers:{get:()=>null},json:async()=>({choices:[{message:{content:'{"titulo":"Recuperado"}'},finish_reason:'stop'}]})};};
  const result=await call('Guía EPJA',null,'gemini-test','groq-test',[],{deadline:Date.now()+20000});
  assert.equal(gemini,1);assert.equal(groq,1);assert.equal(result.provider,'groq');
 }finally{global.fetch=old;}
});

test('HTTP 413 makes one compact Groq retry with the same model, not four identical oversized calls',async()=>{
 const old=global.fetch, bodies=[];
 try{
  global.fetch=async(url,config)=>{
   const body=JSON.parse(config.body);bodies.push(body);
   if(bodies.length===1)return{ok:false,status:413,headers:{get:()=>null},json:async()=>({error:{message:'oversized'}})};
   return{ok:true,status:200,headers:{get:()=>null},json:async()=>({choices:[{message:{content:'{"titulo":"Guía generada"}'},finish_reason:'stop'}]})};
  };
  const result=await call('A'.repeat(15000),null,null,'test',['gemini'],{
   deadline:Date.now()+20000,oversizePrompt:'OBJETIVO EPJA: ejemplo concreto. '+ 'B'.repeat(400)});
  assert.equal(result.value.titulo,'Guía generada');
  assert.equal(result.provider,'groq');
  assert.equal(bodies.length,2);
  assert.equal(bodies[0].model,bodies[1].model);
  assert.ok(bodies[1].messages[1].content.length<bodies[0].messages[1].content.length/2);
 }finally{global.fetch=old;}
});
test('HTTP 429 never retries the compact Groq prompt after shared quota exhaustion',async()=>{
 const old=global.fetch;let count=0;
 try{
  global.fetch=async()=>{count++;return{ok:false,status:429,headers:{get:()=> '120'},json:async()=>({error:{message:'quota'}})};};
  await assert.rejects(()=>call('A'.repeat(15000),null,null,'test',['gemini'],{
    deadline:Date.now()+16000,oversizePrompt:'B'.repeat(500)}),e=>e.code==='AI_RATE_LIMIT');
  assert.equal(count,1);
 }finally{global.fetch=old;}
});
