const {test}=require('node:test'),assert=require('node:assert/strict'),R=require('../lib/recovery.cjs'),P=require('../heva-pedagogy.js');
const plan={tipoMaterial:'GUIA',objetivoAprendizaje:'OA literal',estrategiaDidactica:'MODELADO',cantAlternativas:6,cantDesarrollo:2,cantCasos:2,modoReferencia:'NINGUNA'};
test('recuperación conserva cantidades y divide las tareas sin omitir casos',()=>{const bs=R.batches(plan);assert.deepEqual(bs.map(b=>[b.tipo,b.cantidad]),[['alternativas',4],['alternativas',2],['desarrollo',2],['casos',1],['casos',1]]);assert.equal(bs[1].inicio,4);assert.match(R.basePrompt(plan),/FASE BASE/);assert.match(R.itemPrompt(plan,{titulo:'Base'},bs[1],[]),/ALT-5/);assert.throws(()=>R.itemPrompt(plan,{}, {tipo:'alternativas',inicio:99},[]));});
test('no acepta bloques incompletos ni trazabilidad inventada',()=>{assert.throws(()=>R.merge({},[],plan));const batch=R.batches(plan)[0];const part={preguntasAlternativas:Array.from({length:4},()=>({alternativas:'ABCD'.split('').map(letra=>({letra,texto:'Opción '+letra})),claveCorrecta:'A',justificacion:'La opción responde a la consigna.'}))};assert.ok(R.partIssues(part,plan,batch).some(x=>x.includes('trazabilidad')));part.trazabilidadEstrategia=[1,2,3,4].map(i=>({referencia:'ALT-'+i,habilidad:'Aplicar',evidencia:'Explicar',criterio:'Relacionar'}));assert.deepEqual(R.partIssues(part,plan,batch),[]);});
test('ensambla todos los ítems y sus trazas sin sustituir el contenido base',()=>{const bs=R.batches(plan),parts=bs.map(b=>({[b.field]:Array.from({length:b.cantidad},(_,i)=>({numero:b.inicio+i+1})),trazabilidadEstrategia:[]}));const m=R.merge({titulo:'Lectura conservada',introduccionLectura:'Texto original',trazabilidadEstrategia:[]},parts,plan);assert.equal(m.preguntasAlternativas.length,6);assert.equal(m.preguntasDesarrollo.length,2);assert.equal(m.casosEstudio.length,2);assert.equal(m.introduccionLectura,'Texto original');});
test('recuperación rechaza planes arbitrarios y ejemplos no seleccionados',()=>{assert.throws(()=>R.planOf({...plan,cantCasos:100}));assert.throws(()=>R.planOf({...plan,tipoMaterial:'INVENTADO'}));assert.equal(R.planOf({...plan,textoReferencia:'No usar'}).textoReferencia,'');});
test('Chrome retoma el último bloque y conserva el material visible hasta validación',async()=>{const vm=require('node:vm'),fs=require('node:fs');let saved={},calls=[],fail=true;const visible={titulo:'Material anterior'};const checkpointBase={titulo:'Base completa'};const context={localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v,removeItem:k=>delete saved[k]},document:{getElementById:()=>({textContent:''})},AbortSignal,console,materialActual:visible,fetch:async(url,req)=>{const b=JSON.parse(req.body);calls.push(b.fase);if(b.fase==='base')return{ok:true,json:async()=>({parte:checkpointBase,autor:{proveedor:'gemini'},bloques:[{tipo:'casos',inicio:0},{tipo:'casos',inicio:1}]})};if(b.fase==='items'&&b.batch.inicio===1&&fail)return{ok:false,json:async()=>({error:'Cuota agotada'})};if(b.fase==='items')return{ok:true,json:async()=>({parte:{casosEstudio:[{id:b.batch.inicio+1}]}})};assert.equal(b.parts.length,2);return{ok:true,json:async()=>({material:{titulo:'Material validado'}})}}};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../heva-recovery-ui.js'),'utf8'),context);await assert.rejects(context.recuperarMaterialHEVA(plan),/Cuota agotada/);assert.equal(context.materialActual,visible);assert.equal(JSON.parse(Object.values(saved)[0]).parts.length,1);fail=false;const r=await context.recuperarMaterialHEVA(plan);assert.equal(r.material.titulo,'Material validado');assert.equal(calls.filter(x=>x==='base').length,1);assert.equal(Object.keys(saved).length,1,'El avance se conserva hasta mostrar y guardar el resultado');context.hevaRecoveryCommit(plan);assert.equal(Object.keys(saved).length,0);assert.equal(context.materialActual,visible);});
test('espera una cuota breve una sola vez y no entra en bucle',async()=>{const vm=require('node:vm'),fs=require('node:fs');let n=0,waits=0;const ctx={localStorage:{getItem:()=>null},document:{getElementById:()=>({})},AbortSignal,setTimeout:resolve=>{waits++;resolve()},fetch:async()=>{n++;return{ok:false,json:async()=>({codigo:'AI_RATE_LIMIT',reintentarEn:1,error:'Cuota agotada'})}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../heva-recovery-ui.js'),'utf8'),ctx);await assert.rejects(ctx.recuperarMaterialHEVA(plan),/Cuota agotada/);assert.equal(n,2);assert.equal(waits,1);});
test('final correction reveals diagnostics and preserves all completed blocks when no target is known',async()=>{const vm=require('node:vm'),fs=require('node:fs');let saved={},calls=[];const ctx={localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v,removeItem:k=>delete saved[k]},document:{getElementById:()=>({})},AbortSignal,fetch:async(u,req)=>{const b=JSON.parse(req.body);calls.push(b.fase);return{ok:b.fase!=='finalizar',json:async()=>b.fase==='base'?{parte:{titulo:'Base'},autor:{proveedor:'gemini'},bloques:[{tipo:'casos',inicio:0}]}:b.fase==='items'?{parte:{casosEstudio:[{id:1}]}}:{detalle:'Texto neutral ausente en la lectura',reparacion:{base:false,indices:[],localizada:false,diagnostico:['Texto neutral ausente en la lectura']}}}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../heva-recovery-ui.js'),'utf8'),ctx);await assert.rejects(ctx.recuperarMaterialHEVA(plan),/Texto neutral ausente/);assert.deepEqual(calls,['base','items','finalizar']);const checkpoint=JSON.parse(Object.values(saved)[0]);assert.equal(checkpoint.parts.length,1);assert.equal(checkpoint.base.titulo,'Base')});
test('targeted regeneration accepts saved holes while retaining other blocks as context',()=>{const b=R.batches(plan)[0];assert.match(R.itemPrompt(plan,{titulo:'Base'},b,[null,{preguntasAlternativas:[{enunciado:'Pregunta que se conserva'}]}]),/Pregunta que se conserva/)});

test('resumes a short reading from its draft after an interrupted repair',async()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 const store=new Map(),calls=[];
 const draft={titulo:'Guía guardada',introduccionLectura:'Lectura breve',actividadesGuiadas:[{consigna:'Tarea existente'}]};
 const autor={proveedor:'gemini',modelo:'gemini-test'};
 const response=(ok,data)=>({ok,status:ok?200:422,json:async()=>data});
 let interrupted=true;
 const load=()=>{
  const context={
   localStorage:{getItem:key=>store.get(key),setItem:(key,value)=>store.set(key,value)},
   document:{getElementById:()=>({})},AbortSignal,
   fetch:async(_url,request)=>{
    const body=JSON.parse(request.body);
    calls.push(body.fase);
    if(body.fase==='finalizar'){
     assert.deepEqual(body.base.actividadesGuiadas,draft.actividadesGuiadas);
     return response(true,{material:{titulo:'Guía terminada'}});
    }
    if(!body.borradorBloque)return response(false,{codigo:'BASE_READING_INCOMPLETE',borradorBloque:draft,autor});
    assert.deepEqual(body.borradorBloque,draft);
    assert.deepEqual(body.autor,autor);
    if(interrupted)throw Error('Red interrumpida');
    return response(true,{parte:{...draft,introduccionLectura:'Lectura ampliada'},autor,bloques:[]});
   }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../heva-recovery-ui.js'),'utf8'),context);
  return context;
 };
 await assert.rejects(load().recuperarMaterialHEVA(plan),/red interrumpida/);
 assert.deepEqual(JSON.parse(store.get('heva-recuperacion-v2')).pendingBase,{parte:draft,autor});
 interrupted=false;
 assert.equal((await load().recuperarMaterialHEVA(plan)).material.titulo,'Guía terminada');
 assert.equal(JSON.parse(store.get('heva-recuperacion-v2')).pendingBase,undefined);
 assert.deepEqual(calls,['base','base','base','finalizar']);
});

test('un fallo de red al reparar una generación directa conserva la guía completa para retomarla',async()=>{
 const vm=require('node:vm'),fs=require('node:fs'),store=new Map();
 const pending={borrador:{titulo:'Guía',preguntasAlternativas:[{enunciado:'Pregunta existente'}]},autor:{proveedor:'gemini'},firma:'firma'};
 let interrupted=true;
 const context={localStorage:{getItem:key=>store.get(key),setItem:(key,value)=>store.set(key,value)},document:{getElementById:()=>({})},AbortSignal,fetch:async(url,request)=>{
  assert.equal(url,'/api/generate');
  const sent=JSON.parse(request.body);
  assert.deepEqual(sent.reanudarBorrador,pending);
  assert.equal(sent.objetivoAprendizaje,plan.objetivoAprendizaje);
  if(interrupted)throw Error('Red temporalmente interrumpida');
  return {ok:true,json:async()=>({exito:true,material:{titulo:'Guía reparada'}})};
 }};
 vm.runInNewContext(fs.readFileSync(require.resolve('../heva-recovery-ui.js'),'utf8'),context);
 await assert.rejects(context.recuperarMaterialHEVA(plan,true,0,pending),/interrumpió la reparación/);
 assert.deepEqual(JSON.parse(store.get('heva-recuperacion-v2')).pendingDirect,pending);
 interrupted=false;
 assert.equal((await context.recuperarMaterialHEVA(plan)).material.titulo,'Guía reparada');
});
