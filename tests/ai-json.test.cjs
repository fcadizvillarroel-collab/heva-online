const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseAIJSON}=require('../api/_ai-json.cjs'),{call}=require('../api/_providers.cjs');
function gemini(text,finishReason='STOP'){return{ok:true,status:200,json:async()=>({candidates:[{finishReason,content:{parts:[{text}]}}]})}}
test('recupera comas finales sin cambiar las cadenas del contenido',()=>{const x=parseAIJSON('```json\n{"titulo":"Texto ,} y ,] y \\\"comillas\\\"","items":[{"valor":2,},],}\n```','STOP');assert.deepEqual(x,{titulo:'Texto ,} y ,] y "comillas"',items:[{valor:2}]})});
test('rechaza documentos truncados y no inventa claves ni cierres',()=>{assert.throws(()=>parseAIJSON('{"titulo":"Guía","items":[{"pregunta":"incompleta'),e=>e.code==='AI_RESPONSE_INVALID');assert.throws(()=>parseAIJSON('{"titulo":"Guía"}','MAX_TOKENS'),e=>e.code==='AI_RESPONSE_INCOMPLETE');assert.throws(()=>parseAIJSON('null'));assert.throws(()=>parseAIJSON('[]'))});
test('combina todas las partes de respuesta y omite los pensamientos',async()=>{const old=global.fetch;global.fetch=async()=>({ok:true,status:200,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'No es el documento'},{text:'{"titulo":'},{text:'"Guía completa"}'}]}}]})});try{const r=await call('OA y tema','', 'TEST','');assert.equal(r.value.titulo,'Guía completa')}finally{global.fetch=old}});
test('reintenta una respuesta mal formada conservando el encargo',async()=>{const old=global.fetch;let requests=[];global.fetch=async(u,r)=>{requests.push(JSON.parse(r.body));return requests.length===1?gemini('{"titulo":no es JSON}'):gemini('{"titulo":"Guía completa"}')};try{const r=await call('OA LITERAL · 6 alternativas','', 'TEST','');assert.equal(requests.length,2);assert.match(requests[1].contents[0].parts[0].text,/OA LITERAL · 6 alternativas/);assert.match(requests[1].contents[0].parts[0].text,/REINTENTO/);assert.equal(r.provider,'gemini')}finally{global.fetch=old}});
test('respuesta cortada se regenera, aunque el texto parezca JSON válido',async()=>{const old=global.fetch;let n=0;global.fetch=async()=>++n===1?gemini('{"titulo":"Parcial"}','MAX_TOKENS'):gemini('{"titulo":"Completa"}');try{assert.equal((await call('Guía','', 'TEST','')).value.titulo,'Completa');assert.equal(n,2)}finally{global.fetch=old}});
test('fallo persistente termina con código claro, sin texto crudo ni bucle',async()=>{const old=global.fetch;let n=0;global.fetch=async()=>{n++;return gemini('{"privado":"TEXTO_RESERVADO"')};try{await assert.rejects(call('Guía','', 'TEST',''),e=>e.code==='AI_RESPONSE_INVALID'&&!e.message.includes('TEXTO_RESERVADO'));assert.equal(n,2)}finally{global.fetch=old}});
test('mantiene el proveedor alternativo tras agotar recuperación de Gemini',async()=>{const old=global.fetch;let urls=[];global.fetch=async u=>{urls.push(u);return u.includes('generativelanguage')?gemini('{invalido'): {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{"titulo":"Respaldo completo"}'}}]})}};try{const r=await call('Guía','', 'TEST','TEST');assert.equal(r.provider,'groq');assert.equal(urls.length,3)}finally{global.fetch=old}});
test('API informa fallo recuperable de formato sin error técnico de JSON',async()=>{const old=global.fetch,env={...process.env};process.env.GEMINI_API_KEY='TEST';process.env.GROQ_API_KEY='';process.env.ALLOW_PAID_AI='false';require('../lib/document-sources.cjs').retrieve=async()=>({documents:[],fragments:[]});global.fetch=async()=>gemini('{mal formado');let status,data,res={setHeader(){},status(n){status=n;return this},json(d){data=d;return this}};try{await require('../api/generate')({method:'POST',body:{tipoMaterial:'GUIA',objetivoAprendizaje:'OA de prueba'}},res);assert.equal(status,502);assert.equal(data.reintentable,true);assert.equal(data.codigo,'AI_RESPONSE_INVALID');assert.match(data.detalle,/conserva el material anterior/);assert.ok(!JSON.stringify(data).includes('Expected double-quoted'))}finally{global.fetch=old;process.env=env}});
test('cuota agotada tiene código y plazo sin exponer respuesta del proveedor',async()=>{const old=global.fetch;global.fetch=async()=>({ok:false,status:429,headers:{get:()=> '12'},json:async()=>({error:{message:'dato reservado'}})});try{await assert.rejects(call('Revisa','','','TEST',[],{maxOutputTokens:2048}),e=>e.code==='AI_RATE_LIMIT'&&e.retryAfter===12&&!e.message.includes('reservado'))}finally{global.fetch=old}});
test('Gemini utiliza respaldo del mismo proveedor ante indisponibilidad temporal',async()=>{const old=global.fetch;let urls=[];global.fetch=async u=>{urls.push(u);return urls.length===1?{ok:false,status:503,headers:{get:()=>null},json:async()=>({error:{message:'indisponible'}})}:gemini('{"revision":"completa"}')};try{const r=await call('Revisar','','TEST','',['groq']);assert.equal(r.provider,'gemini');assert.equal(r.model,'gemini-3.1-flash-lite');assert.equal(urls.length,2);assert.ok(urls.every(u=>u.includes('generativelanguage.googleapis.com')))}finally{global.fetch=old}});
test('reserves a usable fallback window when both Gemini requests time out',async()=>{const oldFetch=global.fetch,oldNow=Date.now;let elapsed=0,calls=[];Date.now=()=>1794780000000+elapsed;global.fetch=async u=>{calls.push(u.includes('generativelanguage')?'gemini':'groq');if(u.includes('generativelanguage')){elapsed+=12000;const e=new Error('timeout');e.name='TimeoutError';throw e;}return{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{"titulo":"Respaldo"}'}}]})}};try{const r=await call('Presentación','','TEST','TEST');assert.equal(r.provider,'groq');assert.deepEqual(calls,['gemini','gemini','groq']);assert.ok(elapsed<=34000)}finally{global.fetch=oldFetch;Date.now=oldNow}});
test('Groq receives the compact request and block output budget after Gemini returns invalid JSON',async()=>{const old=global.fetch,seen=[];global.fetch=async(u,r)=>{const body=JSON.parse(r.body);seen.push({u,body});return u.includes('generativelanguage')?gemini('{invalid'):{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{"titulo":"Bloque válido"}'}}]})}};try{const out=await call('ENCARGO_ORIGINAL_LARGO','','TEST','TEST',[],{fallbackPrompt:'OA LITERAL, esquema del bloque y contexto breve',fallbackMaxOutputTokens:3000,maxOutputTokens:10000});assert.equal(out.provider,'groq');assert.equal(seen[2].body.messages[1].content,'OA LITERAL, esquema del bloque y contexto breve');assert.equal(seen[2].body.max_completion_tokens,3000);assert.equal(seen[0].body.contents[0].parts[0].text,'ENCARGO_ORIGINAL_LARGO')}finally{global.fetch=old}});
test('oversized fallback requests are diagnosed separately from invalid provider output',async()=>{const old=global.fetch;global.fetch=async u=>u.includes('generativelanguage')?gemini('{invalid'):{ok:false,status:413,json:async()=>({error:{message:'TEXTO_RESERVADO'}})};try{await assert.rejects(call('Bloque','','TEST','TEST'),e=>e.code==='AI_REQUEST_TOO_LARGE'&&e.proveedores.some(s=>s.estadoHTTP===413)&&!e.message.includes('TEXTO_RESERVADO'))}finally{global.fetch=old}});

test('recovery API keeps the guide draft on HTTP 422 and resumes with only a reading request',async t=>{
 const pedagogy=require('../heva-pedagogy.js'),sources=require('../lib/document-sources.cjs');
 const plan={tipoMaterial:'GUIA',objetivoAprendizaje:'Comparar dos presupuestos',asignatura:'Matemática',
  temaEspecifico:'Costos unitarios',estrategiaDidactica:'MODELADO',cantAlternativas:0,cantDesarrollo:0,cantCasos:0,
  modoReferencia:'NINGUNA',noticiaDidacticaModo:'NO'};
 const draft=pedagogy.schema('GUIA',plan);
 draft.introduccionLectura='Presupuesto '.repeat(276).trim();
 draft.actividadesGuiadas=[{consigna:'Compara dos presupuestos',apoyo:'Compara el costo por unidad',productoEsperado:'Tabla de comparación'}];
 draft.actividadAutonoma={consigna:'Calcula otra compra',productoEsperado:'Un cálculo explicado'};
 draft.planEstrategia={id:'MODELADO',habilidadCentral:'Comparar costos unitarios',aplicacionConcreta:'Modelar el cálculo antes de comparar compras',evidenciaEsperada:'Tabla de costos con cálculos',retroalimentacionDocente:'Revisar cómo se obtiene el precio unitario'};
 draft.trazabilidadEstrategia=['GUIADA-1','AUTONOMA'].map(referencia=>({
  referencia,habilidad:'Comparar costos',evidencia:'Tabla comparativa con unidades',criterio:'Usa costos por unidad'
 }));
 t.mock.method(sources,'retrieve',async()=>{throw Error('Fuente no disponible en esta prueba');});
 const env={...process.env};
 t.after(()=>{process.env=env;});
 Object.assign(process.env,{GEMINI_API_KEY:'TEST',GROQ_API_KEY:'',ALLOW_PAID_AI:'false',HEVA_AI_REQUIRE_AUTH:'false'});
 const prompts=[];
 let accept=false;
 t.mock.method(globalThis,'fetch',async(_url,options)=>{
  const prompt=JSON.parse(options.body).contents[0].parts[0].text;
  prompts.push(prompt);
  if(prompts.length===1)return gemini(JSON.stringify(draft));
  return gemini(JSON.stringify({introduccionLectura:accept?'Explicación '.repeat(305):'Muy breve',actividadesGuiadas:[]}));
 });
 const request=async body=>{
  let status,data;
  await require('../api/recover')({method:'POST',body:{fase:'base',plan,...body}},{
   setHeader(){},status(n){status=n;return this;},json(value){data=value;return this;}
  });
  return {status,data};
 };
 const pending=await request({});
 assert.equal(pending.status,422);
 assert.equal(pending.data.codigo,'BASE_READING_INCOMPLETE');
 assert.deepEqual(pending.data.borradorBloque.actividadesGuiadas,draft.actividadesGuiadas);
 accept=true;
 const result=await request({borradorBloque:pending.data.borradorBloque,autor:pending.data.autor});
 assert.equal(result.status,200,result.data.detalle);
 assert.equal(prompts.length,3);
 assert.ok(prompts.slice(1).every(prompt=>prompt.startsWith('REPARACIÓN LOCALIZADA:')));
 assert.deepEqual(result.data.parte.actividadesGuiadas,draft.actividadesGuiadas);
 assert.deepEqual(result.data.parte.proveedoresBloque,['gemini']);
});
