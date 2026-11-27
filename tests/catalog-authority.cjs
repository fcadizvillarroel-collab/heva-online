'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=path=>fs.readFileSync(require('node:path').join(root,path),'utf8');
test('Supabase mantiene los OA EPJA publicados como fuente curricular de verdad',()=>{
 const admin=read('api/curriculum/admin.js');
 assert.match(admin,/\/rest\/v1\/curriculo_publicado\?select=/);
 assert.match(admin,/vigente=eq\.true/);
 assert.match(admin,/action === 'verified'/);
 const guide=read('AGENTS.md');
 assert.match(guide,/fuente de verdad/);
 assert.match(guide,/NO generar, importar, reconstruir/);
 assert.match(guide,/catalogo-publicado\.json/);
});
test('la copia local conserva los 407 OA sin duplicar claves, pero no acredita revisión docente',()=>{
 const records=JSON.parse(read('catalogo-publicado.json'));
 assert.equal(records.length,407);
 assert.equal(new Set(records.map(x=>x.clave_interna)).size,407);
 assert.ok(records.every(x=>x.marco&&x.texto_literal));
 assert.match(read('README.md'),/Supabase.*fuente/);
});

test('Preview consulta los OA con clave publicable y mantiene separadas las operaciones administrativas',async t=>{
 const handler=require('../api/curriculum/admin.js');
 const env={VERCEL_ENV:'preview',SUPABASE_URL:'',SUPABASE_SERVICE_ROLE_KEY:'',
  HEVA_PREVIEW_SUPABASE_URL:'https://hevatest.supabase.co',
  HEVA_PREVIEW_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_prueba'};
 for(const [key,value] of Object.entries(env)){
  const previous=process.env[key];
  process.env[key]=value;
  t.after(()=>{if(previous===undefined)delete process.env[key];else process.env[key]=previous;});
 }
 const original=JSON.parse(read('catalogo-publicado.json')).find(x=>x.clave_interna.includes('|BÁS|')&&x.nivel==='3');
 const {curriculo_staging,...row}=original;
 let calls=0;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  calls++;
  assert.match(url,/curriculo_publicado\?select=id,/);
  assert.match(url,/vigente=eq.true/);
  assert.doesNotMatch(url,/curriculo_staging|aprobado_por/);
  assert.deepEqual(options.headers,{apikey:'sb_publishable_prueba'});
  return {ok:true,json:async()=>[{...row,vigente:true}]};
 });
 const request=async(method,action)=>{
  let status,body;
  await handler({method,query:{action,nivel:'III_BASICO',asignatura:row.asignatura},headers:{}},{setHeader(){},status(n){status=n;return this;},json(x){body=x;return this;}});
  return {status,body};
 };
 const catalog=await request('GET','verified');
 assert.equal(catalog.status,200);
 assert.equal(catalog.body.total,1);
 assert.equal((await request('POST','approve')).status,500);
 process.env.VERCEL_ENV='production';
 assert.equal((await request('GET','verified')).status,500);
 assert.equal(calls,1);
});
