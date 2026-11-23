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
