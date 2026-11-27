'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {protect}=require('../api/_ai-access.cjs');

const teacherId='01234567-89ab-4cde-8123-456789abcdef';
const authUser={id:teacherId,is_anonymous:false};
const userHeaders={authorization:'Bearer sesion-de-prueba'};
const fakeKey='credencial-ficticia-del-servidor';

function configure(t,env={}){
 const previous={...process.env};
 t.after(()=>{process.env=previous;});
 delete process.env.HEVA_AI_DAILY_LIMIT;
 delete process.env.HEVA_PILOT_DAILY_REQUESTS;
 Object.assign(process.env,{HEVA_AI_REQUIRE_AUTH:'true',HEVA_PILOT_SHARED_QUOTA:'false',
  SUPABASE_URL:'https://supabase.invalid',SUPABASE_SERVICE_ROLE_KEY:fakeKey,...env});
}

function reply(value,status=200){
 return {ok:status>=200&&status<300,status,json:async()=>value};
}

async function ask(headers={}){
 let response;
 const ok=await protect({headers},{
  status(status){response={status};return this;},
  json(body){response.body=body;return this;}
 });
 return {ok,...response};
}

test('el piloto sin flags continúa sin consultar Supabase',async t=>{
 configure(t,{HEVA_AI_REQUIRE_AUTH:'false',SUPABASE_URL:'',SUPABASE_SERVICE_ROLE_KEY:''});
 let requests=0;
 t.mock.method(globalThis,'fetch',async()=>{requests++;});
 assert.deepEqual(await ask(),{ok:true});
 assert.equal(requests,0);
});

test('faltan sesión o configuración: el servidor no llama a la cuota',async t=>{
 configure(t);
 let requests=0;
 t.mock.method(globalThis,'fetch',async()=>{requests++;});
 assert.equal((await ask()).body.codigo,'AI_AUTH_REQUIRED');
 process.env.SUPABASE_SERVICE_ROLE_KEY='';
 const result=await ask(userHeaders);
 assert.equal(result.status,503);
 assert.equal(result.body.codigo,'AI_ACCESS_UNCONFIGURED');
 assert.equal(requests,0);
});

test('un usuario válido requiere un perfil asignado antes de consumir cuota',async t=>{
 configure(t);
 const urls=[];
 t.mock.method(globalThis,'fetch',async url=>{
  urls.push(url);
  return urls.length===1?reply(authUser):reply([]);
 });
 const result=await ask(userHeaders);
 assert.equal(result.status,403);
 assert.equal(result.body.codigo,'AI_ROLE_REQUIRED');
 assert.equal(urls.length,2);
 assert.match(urls[1],/\/heva_perfiles\?usuario=eq\./);
 assert.ok(urls.every(url=>!url.includes('rpc')));
});

test('una sesión anónima se rechaza antes de buscar permisos',async t=>{
 configure(t);
 let requests=0;
 t.mock.method(globalThis,'fetch',async()=>{requests++;return reply({...authUser,is_anonymous:true});});
 assert.equal((await ask(userHeaders)).body.codigo,'AI_AUTH_INVALID');
 assert.equal(requests,1);
});

test('perfiles docente y administrador usan la cuota individual atómica',async t=>{
 configure(t,{HEVA_AI_DAILY_LIMIT:'9999'});
 let role='docente';
 const calls=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  calls.push({url,options});
  switch(calls.length%3){
   case 1:return reply(authUser);
   case 2:return reply([{rol:role}]);
   default:return reply(true);
  }
 });
 assert.deepEqual(await ask(userHeaders),{ok:true});
 role='administrador';
 assert.deepEqual(await ask(userHeaders),{ok:true});
 assert.equal(calls.length,6);
 for(const offset of [0,3]){
  assert.equal(calls[offset].options.headers.Authorization,'Bearer sesion-de-prueba');
  assert.equal(calls[offset+1].options.headers.Authorization,'Bearer '+fakeKey);
  assert.match(calls[offset+2].url,/\/rpc\/heva_consumir_cuota_ia$/);
  assert.deepEqual(JSON.parse(calls[offset+2].options.body),{p_usuario:teacherId,p_limite:100});
 }
});

test('cuota diaria agotada, servicio caído y respuesta inválida se distinguen',async t=>{
 configure(t);
 let quota=reply(false);
 t.mock.method(globalThis,'fetch',async url=>url.includes('/auth/')?reply(authUser):url.includes('/heva_perfiles?')?reply([{rol:'docente'}]):quota);
 const exhausted=await ask(userHeaders);
 assert.equal(exhausted.status,429);
 assert.equal(exhausted.body.codigo,'AI_DAILY_QUOTA_EXHAUSTED');
 for(const value of [reply('false'),reply(null),reply(null,500)]){
  quota=value;
  const unavailable=await ask(userHeaders);
  assert.equal(unavailable.status,503);
  assert.equal(unavailable.body.codigo,'AI_ACCESS_UNAVAILABLE');
 }
});

test('piloto compartido admite un booleano del RPC y no exige cuenta docente',async t=>{
 configure(t,{HEVA_AI_REQUIRE_AUTH:'false',HEVA_PILOT_SHARED_QUOTA:'true',HEVA_PILOT_DAILY_REQUESTS:'150'});
 let answer=false,requests=0;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  requests++;
  assert.match(url,/\/rpc\/heva_consumir_cuota_piloto$/);
  assert.deepEqual(JSON.parse(options.body),{p_limite:150});
  return reply(answer);
 });
 const exhausted=await ask();
 assert.equal(exhausted.status,429);
 assert.equal(exhausted.body.codigo,'AI_PILOT_QUOTA_EXHAUSTED');
 answer='true';
 assert.equal((await ask()).status,503);
 answer=true;
 assert.deepEqual(await ask(),{ok:true});
 assert.equal(requests,3);
});
