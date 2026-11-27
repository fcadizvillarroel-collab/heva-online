const test=require('node:test');
const assert=require('node:assert/strict');
const recover=require('../api/recover.js');
const review=require('../api/review.js');
const P=require('../heva-pedagogy.js');
const sources=require('../lib/document-sources.cjs');

const plan={tipoMaterial:'GUIA',asignatura:'Matemática',objetivoAprendizaje:'Comparar dos presupuestos',temaEspecifico:'Costos unitarios',estrategiaDidactica:'MODELADO',cantAlternativas:0,cantDesarrollo:0,cantCasos:0,modoReferencia:'NINGUNA',noticiaDidacticaModo:'NO'};

function configure(t){
 const env={...process.env};
 t.after(()=>{process.env=env;});
 Object.assign(process.env,{GEMINI_API_KEY:'TEST',GROQ_API_KEY:'TEST',ALLOW_PAID_AI:'false',HEVA_AI_REQUIRE_AUTH:'false',HEVA_PILOT_SHARED_QUOTA:'false'});
 t.mock.method(sources,'retrieve',async()=>({documents:[],fragments:[],objetivo:'no_localizado'}));
}

async function request(handler,body){
 let status,data;
 await handler({method:'POST',body},{setHeader(){},status(value){status=value;return this;},json(value){data=value;return this;}});
 return {status,data};
}

function gemini(value){
 return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(value)}]}}]})};
}
function groq(value){
 return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]})};
}
const quota={ok:false,status:429,headers:{get:()=>null},json:async()=>({})};

function guideDraft(){
 const draft=P.schema('GUIA',plan);
 draft.introduccionLectura='Presupuesto '.repeat(276).trim();
 draft.actividadesGuiadas=[{consigna:'Compara dos presupuestos',apoyo:'Compara el costo por unidad',productoEsperado:'Tabla de comparación'}];
 draft.actividadAutonoma={consigna:'Calcula otra compra',productoEsperado:'Un cálculo explicado'};
 draft.planEstrategia={id:'MODELADO',habilidadCentral:'Comparar costos unitarios',aplicacionConcreta:'Modelar el cálculo antes de comparar compras',evidenciaEsperada:'Tabla de costos con cálculos',retroalimentacionDocente:'Revisar cómo se obtiene el precio unitario'};
 draft.trazabilidadEstrategia=['GUIADA-1','AUTONOMA'].map(referencia=>({referencia,habilidad:'Comparar costos',evidencia:'Tabla comparativa con unidades',criterio:'Usa costos por unidad'}));
 return draft;
}

test('una propuesta localizada rechazada no excluye a su proveedor de la revisión independiente',async t=>{
 configure(t);
 const draft=guideDraft();
 let round=0,calls=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  const isGemini=url.includes('generativelanguage');
  const payload=JSON.parse(options.body);
  if(!isGemini){
   calls.push('groq');
   if(round===0)return groq({introduccionLectura:'Aún demasiado breve'});
   // Prove that Groq could actually run through the review gate.
   return {ok:false,status:429,headers:{get:()=>null},json:async()=>({})};
  }
  calls.push('gemini');
  if(!payload.contents[0].parts[0].text.startsWith('REPARACIÓN LOCALIZADA:'))return gemini(draft);
  if(round===0)return quota;
  return gemini({introduccionLectura:'Explicación clara '.repeat(160).trim()});
 });
 const pending=await request(recover,{fase:'base',plan});
 assert.equal(pending.status,422,pending.data.detalle);
 assert.deepEqual(pending.data.borradorBloque.proveedoresBloque,['gemini']);
 round++;
 const finished=await request(recover,{fase:'base',plan,borradorBloque:pending.data.borradorBloque,autor:pending.data.autor});
 assert.equal(finished.status,200,finished.data.detalle);
 const assembled=await request(recover,{fase:'finalizar',plan,base:finished.data.parte,autor:finished.data.autor,parts:[]});
 assert.equal(assembled.status,200,assembled.data.detalle);
 assert.deepEqual(assembled.data.material.autoriaBloques,{proveedores:['gemini'],completa:true});
 const checked=await request(review,{material:assembled.data.material});
 assert.equal(checked.status,503);
 assert.notEqual(checked.data.codigo,'REVIEW_NO_INDEPENDENT_PROVIDER');
 assert.deepEqual(calls,['gemini','gemini','groq','gemini','groq']);
});

test('un borrador histórico sin procedencia sigue sin admitir revisión independiente tras repararlo',async t=>{
 configure(t);
 t.mock.method(globalThis,'fetch',async()=>gemini({introduccionLectura:'Explicación clara '.repeat(160).trim()}));
 const autor={proveedor:'groq'};
 const finished=await request(recover,{fase:'base',plan,borradorBloque:guideDraft(),autor});
 assert.equal(finished.status,200,finished.data.detalle);
 assert.deepEqual(finished.data.parte.proveedoresBloque,['gemini']);
 assert.equal(finished.data.parte.procedenciaBloqueIncompleta,true);
 const assembled=await request(recover,{fase:'finalizar',plan,base:finished.data.parte,autor:finished.data.autor,parts:[]});
 assert.equal(assembled.status,200,assembled.data.detalle);
 assert.deepEqual(assembled.data.material.autoriaBloques,{proveedores:['groq','gemini'],completa:false});
 assert.equal(assembled.data.material.procedenciaBloqueIncompleta,undefined);
 const checked=await request(review,{material:assembled.data.material});
 assert.equal(checked.data.codigo,'REVIEW_INCOMPLETE_PROVENANCE');
});

test('la sustitución completa acredita al autor de la versión conservada del bloque',async t=>{
 configure(t);
 let attempts=0;
 t.mock.method(globalThis,'fetch',async url=>{
  if(url.includes('generativelanguage'))return ++attempts===1?gemini({preguntasAlternativas:[]}):quota;
  return groq({
   preguntasAlternativas:[{numero:1,enunciado:'¿Cuál es el primer dato que necesitas para comparar presupuesto por unidad?',alternativas:['La fecha','El nombre del vendedor','El precio unitario','El color de cada producto'].map((texto,i)=>({texto,letra:'ABCD'[i]})),claveCorrecta:'C',justificacion:'Identifica el costo de una unidad.',habilidad:'Comparar'}],
   trazabilidadEstrategia:[{referencia:'ALT-1',habilidad:'Comparar costos',evidencia:'Identifica costos por unidad',criterio:'Relaciona los datos con el costo'}]
  });
 });
 const changed=await request(recover,{fase:'items',plan:{...plan,cantAlternativas:1},base:{titulo:'Actividad'},autor:{proveedor:'gemini'},batch:{tipo:'alternativas',inicio:0,cantidad:1},parts:[]});
 assert.equal(changed.status,200,changed.data.detalle);
 assert.deepEqual(changed.data.parte.proveedoresBloque,['groq']);
});
