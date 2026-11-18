const test=require('node:test'),assert=require('node:assert/strict');
const handler=require('../api/status.js');
async function run(method='GET'){
 let code=200,body,headers={};const res={setHeader(k,v){headers[k]=v},status(n){code=n;return this},json(v){body=v;return this}};
 await handler({method},res);return{code,body,headers};
}
test('status does not reveal keys and rejects writes',async()=>{
 const prior=[process.env.GEMINI_API_KEY,process.env.GROQ_API_KEY,global.fetch];
 try{
  process.env.GEMINI_API_KEY='PRIVATE_GEMINI_VALUE';process.env.GROQ_API_KEY='PRIVATE_GROQ_VALUE';
  global.fetch=async(url,opts)=>({ok:true,status:200});
  const r=await run();assert.equal(r.code,200);assert.equal(r.body.proveedores.gemini.conectividad,'correcta');assert.equal(r.body.proveedores.groq.conectividad,'correcta');assert.ok(!JSON.stringify(r.body).includes('PRIVATE_'));assert.equal((await run('POST')).code,405);
 }finally{[process.env.GEMINI_API_KEY,process.env.GROQ_API_KEY,global.fetch]=prior;}
});
test('status distinguishes configured credentials from connectivity',async()=>{
 const prior=[process.env.GEMINI_API_KEY,process.env.GROQ_API_KEY,global.fetch];
 try{
  delete process.env.GEMINI_API_KEY;process.env.GROQ_API_KEY='dummy';
  global.fetch=async()=>({ok:false,status:401});
  const r=await run();assert.equal(r.body.proveedores.gemini.conectividad,'sin_configurar');assert.equal(r.body.proveedores.groq.estadoHTTP,401);
 }finally{[process.env.GEMINI_API_KEY,process.env.GROQ_API_KEY,global.fetch]=prior;}
});
