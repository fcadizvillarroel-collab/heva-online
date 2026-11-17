const Skills=require('../heva-skills.js');
const {call}=require('./_providers.cjs'),R=require('../lib/recovery.cjs'),S=require('../lib/document-sources.cjs'),P=require('../heva-pedagogy.js'),H=require('../heva-core.js');
module.exports=async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
 if(req.method==='OPTIONS')return res.status(200).end();if(req.method!=='POST')return res.status(405).json({error:'Utilice POST.'});
 const deadline=Date.now()+55000;
 try{
  const {fase,plan:input,base,parts=[],batch,autor,borradorBloque,repararDuplicados,correcciones=[],corregirFormato=false}=req.body||{};
  if(JSON.stringify(req.body||{}).length>250000)return res.status(413).json({error:'Documento demasiado extenso.'});
  let plan;try{plan=R.planOf(input)}catch(e){return res.status(400).json({error:'El encargo contiene parámetros inválidos.',detalle:e.message,codigo:'PLAN_INVALIDO',reintentable:false})}
  if(!['base','items','finalizar'].includes(fase))return res.status(400).json({error:'Fase no admitida.'});
  if(fase!=='finalizar'&&!(await require('./_ai-access.cjs').protect(req,res)))return;
  if(fase!=='base'&&(!base||!['gemini','groq','openai'].includes(autor?.proveedor)))return res.status(400).json({error:'Falta el documento base o su autoría.'});
  let fuentesDocumentales;try{fuentesDocumentales=await S.retrieve(plan)}catch(e){console.error('HEVA document sources:',e.stack||e);fuentesDocumentales=[];}
  if(fase==='finalizar'){
   const metadata={objetivoAprendizaje:plan.objetivoAprendizaje,asignatura:plan.asignatura,nivel:plan.nivel,marcoCurricular:plan.marcoCurricular,temaEspecifico:plan.temaEspecifico,tipoMaterial:plan.tipoMaterial,estrategiaDidactica:P.strategy(plan.estrategiaDidactica).name};
   const assembled=P.normalizeStrategyPlan(R.merge(base,parts,plan),plan);
   const counted=P.enforceRequestedCounts(assembled,plan);
   let material=H.material(P.normalizeTaskTraces(counted),metadata);
   // Apply the same count and trace boundary used by /api/generate.
   material=P.normalizeTaskTraces(P.enforceRequestedCounts(material,plan));
   let issues=R.validate(material,plan);
   if(issues.length)return res.status(422).json({error:'Los bloques requieren corrección. Se conserva el material anterior.',detalle:issues.join('; '),reparacion:R.repair(base,parts,plan,issues),reintentable:true});
   material=P.finalize(material,plan);material.autoriaIA=autor;material.planGeneracion=plan;material.fuentesDocumentales=fuentesDocumentales;
   const evidence=S.validateEvidence(material.respaldoDocumental,fuentesDocumentales);material.respaldoDocumental=evidence.valid;material.incidenciasDocumentales=evidence.invalid;material=Skills.prepare(material,plan,fuentesDocumentales,evidence);
   material=require('../heva-studio.js').link(material,plan);material.auditoriaExperimental=require('../experimental/quality-audit.cjs').inspect(material,plan);material.auditoriaDisciplinar=require('../experimental/subject-audit.cjs').inspectAll(material,plan);return res.status(200).json({exito:true,material});
  }
  const keys=[process.env.ALLOW_PAID_AI==='true'?process.env.OPENAI_API_KEY:'',process.env.GEMINI_API_KEY,process.env.GROQ_API_KEY].map(k=>(k||'').trim());
  // Permitir respaldo entre proveedores en bloques: una caída del autor inicial no debe bloquear todo el documento.
  const exclude=[];
  const strictFormat=corregirFormato&&fase==='items'&&batch?.tipo==='alternativas'?'\nFORMATO ESTRICTO DE REPARACIÓN: responde únicamente JSON válido con preguntasAlternativas. Cada pregunta incluye enunciado, alternativas como ARRAY de exactamente cuatro objetos {letra,texto} en orden A,B,C,D, claveCorrecta como UNA LETRA A/B/C/D, justificacion y trazabilidadEstrategia. No uses opciones, respuestaCorrecta, índices numéricos ni claves explicadas en frases. No inventes una clave sin comprobar cuál opción es verdadera.':'';
  const caseRepair=corregirFormato&&fase==='items'&&batch?.tipo==='casos'?'\nREPARACIÓN OBLIGATORIA: devuelve un objeto JSON con casosEstudio como arreglo de exactamente '+batch.cantidad+' casos completos y trazabilidadEstrategia con referencia CASO-'+(batch.inicio+1)+'. Cada caso requiere id, titulo, contextoReal, preguntaReflexion, habilidad, criterioEvaluacion. El caso debe ejecutar la estrategia '+P.strategy(plan.estrategiaDidactica).name+'. No devuelvas un arreglo vacío ni reemplaces el caso por una explicación.':'';
  const developmentRepair=fase==='items'&&batch?.tipo==='desarrollo'?'\nBLOQUE DE DESARROLLO OBLIGATORIO: devuelve exclusivamente JSON con preguntasDesarrollo como ARRAY de exactamente '+batch.cantidad+' objetos, con numero y enunciado completos. Incluye trazabilidadEstrategia como ARRAY con referencia DES-'+(batch.inicio+1)+' y cada pregunta consecutiva, habilidad, evidencia y criterio. Para evaluación incluye rubrica con cuatro niveles 0,1,2,3 y descripcion en cada nivel. No sustituyas desarrollo por alternativas ni devuelvas un arreglo vacío.':'';
  const strategyRepair=fase==='base'?'\nPLAN DE ESTRATEGIA OBLIGATORIO: incluye planEstrategia como objeto JSON con id exacto de la estrategia seleccionada, habilidadCentral, aplicacionConcreta, evidenciaEsperada y retroalimentacionDocente. Cada uno de los cuatro textos debe ser específico del objetivo y del material, no un marcador ni un texto genérico. Estrategia seleccionada: '+JSON.stringify(P.strategy(plan.estrategiaDidactica))+'. El plan debe explicar cómo se ejecutará realmente la estrategia en las tareas.':'';
  const correctionContext=Array.isArray(correcciones)&&correcciones.length?'\nCORRECCIONES OBLIGATORIAS DEL CONTROL FINAL (datos): '+JSON.stringify(correcciones).slice(0,6000):'';
  let duplicateOriginal=fase==='items'&&repararDuplicados?R.normalizePart(repararDuplicados,batch):null;
  const duplicateTargets=duplicateOriginal?R.duplicateItems(duplicateOriginal,plan,batch,parts):[];
  if(duplicateOriginal){const oldIssues=R.partIssues(duplicateOriginal,plan,batch,parts);if(!duplicateTargets.length||oldIssues.some(x=>!/repite literalmente/.test(x)))return res.status(400).json({error:'El borrador requiere una reparación distinta de duplicados.',reintentable:false});}
  const duplicateRepair=duplicateOriginal?'\nREPARACIÓN LOCALIZADA DE DUPLICADOS: sustituye únicamente '+duplicateTargets.map(x=>x.referencia).join(', ')+'. Usa una situación, datos y pregunta distintos, no solo cambiar la numeración. Devuelve el bloque completo y sus trazas en el esquema solicitado. El servidor conservará intactos los demás ítems y sus pautas. Borrador como datos: '+JSON.stringify(duplicateOriginal):'';
  const prompt=(fase==='base'?R.basePrompt(plan):R.itemPrompt(plan,base,batch,parts))+strictFormat+caseRepair+developmentRepair+strategyRepair+correctionContext+duplicateRepair;
  const fallback=R.fallbackPrompt(plan,base,batch,parts,correcciones,fuentesDocumentales)+duplicateRepair;
  let result;
  if(fase==='items'&&borradorBloque){
   const preserved=R.normalizePart(borradorBloque,batch),pending=R.partIssues(preserved,plan,batch,parts);
   if(pending.length&&!R.traceIssuesOnly(pending))return res.status(400).json({error:'El borrador no puede repararse solo con trazabilidad.',detalle:pending.join('; '),reintentable:false});
   result={value:preserved,provider:autor.proveedor,model:autor.modelo};
  }else result=await call(prompt+S.evidencePrompt(fuentesDocumentales,{compact:true}),...keys,exclude,{deadline,fallbackPrompt:fallback,fallbackMaxOutputTokens:fase==='base'?4096:3000,maxOutputTokens:fase==='base'?(plan.tipoMaterial==='PRESENTACION'?2600:10000):batch?.formato?8000:batch?.tipo==='diapositivas'?6500:5000});
  if(fase==='items'){result.value=R.normalizePart(result.value,batch);if(duplicateOriginal)result.value=R.mergeDuplicateRepair(duplicateOriginal,result.value,plan,batch,parts);}
  let issues=R.partIssues(result.value,plan,fase==='items'?batch:null,parts);
  if(fase==='items'&&!duplicateOriginal&&R.duplicateItems(result.value,plan,batch,parts).length&&issues.every(x=>/repite literalmente/.test(x)))duplicateOriginal=result.value;
  if(issues.length&&!R.traceIssuesOnly(issues)&&deadline-Date.now()>5000){
   result=await call(prompt+S.evidencePrompt(fuentesDocumentales,{compact:true})+'\nCORRIGE este bloque completo: '+issues.join('; ')+(duplicateOriginal?'\nSustituye solo los duplicados y conserva los demás ítems de este borrador: '+JSON.stringify(duplicateOriginal):''),...keys,exclude,{deadline,fallbackPrompt:fallback+'\nCORRIGE ESTE BLOQUE: '+issues.join('; ')+(duplicateOriginal?'\nConserva ítems válidos del borrador y sustituye solo repetidos: '+JSON.stringify(duplicateOriginal):''),fallbackMaxOutputTokens:fase==='base'?4096:3000,maxOutputTokens:fase==='base'?(plan.tipoMaterial==='PRESENTACION'?2600:10000):batch?.formato?8000:batch?.tipo==='diapositivas'?6500:5000});
   if(fase==='items'){result.value=R.normalizePart(result.value,batch);if(duplicateOriginal)result.value=R.mergeDuplicateRepair(duplicateOriginal,result.value,plan,batch,parts);}
   issues=R.partIssues(result.value,plan,fase==='items'?batch:null,parts);
  }
  if(fase==='items'&&R.traceIssuesOnly(issues)&&deadline-Date.now()>5500){
   try{
    const fixed=await call(R.traceRepairPrompt(plan,result.value,batch),...keys,exclude,{deadline,maxOutputTokens:2600});
    const candidate=R.mergeTraceRepair(result.value,fixed.value,plan,batch),candidateIssues=R.partIssues(candidate,plan,batch,parts);
    if(candidateIssues.length<issues.length){result.value=candidate;issues=candidateIssues;}
   }catch(error){console.warn('HEVA trace repair pending:',error.code||'TRACE_REPAIR_ERROR');}
  }
  if(fase==='items'&&R.traceIssuesOnly(issues))return res.status(422).json({error:'Las preguntas están conservadas; falta completar su trazabilidad pedagógica.',detalle:issues.join('; '),codigo:'ITEM_TRACES_INCOMPLETE',borradorBloque:result.value,reintentable:true});
  // Repair strategy metadata separately instead of regenerating and losing a
  // complete base. This is the endpoint used by "Crear material" recovery.
  if(fase==='base'&&issues.some(x=>x.includes('La estrategia seleccionada no está desarrollada'))&&deadline-Date.now()>6500){
   try{
    const selected=P.strategy(plan.estrategiaDidactica);
    const baseDraft=result.value;
    const tasks=[...(baseDraft.diapositivas||[]).map((d,i)=>({ref:'DIAPO-'+(i+1),titulo:d.titulo,contenido:d.contenido})),...(baseDraft.actividadesGuiadas||[]).map((d,i)=>({ref:'GUIADA-'+(i+1),consigna:d.consigna}))].slice(0,14);
    const repair='Devuelve SOLO JSON con planEstrategia, sin otras claves. Estrategia id '+selected.id+'; nombre '+selected.name+'. Objetivo '+plan.objetivoAprendizaje+'. Tema '+plan.temaEspecifico+'. Tareas reales '+JSON.stringify(tasks).slice(0,6500)+'. Completa id, habilidadCentral, aplicacionConcreta, evidenciaEsperada y retroalimentacionDocente con textos específicos, sin inventar tareas ni resultados. Forma {"planEstrategia":{"id":"'+selected.id+'","habilidadCentral":"...","aplicacionConcreta":"...","evidenciaEsperada":"...","retroalimentacionDocente":"..."}}';
    const fixed=await call(repair,...keys,exclude,{deadline,maxOutputTokens:900});
    if(fixed.value?.planEstrategia&&typeof fixed.value.planEstrategia==='object'){
      const candidate=P.normalizeStrategyPlan({...baseDraft,planEstrategia:fixed.value.planEstrategia},plan);
      const next=R.partIssues(candidate,plan,null);
      if(next.length<issues.length){result.value=candidate;issues=next;}
    }
   }catch(error){console.warn('HEVA strategy-only repair failed',error.code||'ERROR');}
  }
  if(fase==='items'&&R.duplicateItems(result.value,plan,batch,parts).length&&issues.every(x=>/repite literalmente/.test(x)))return res.status(422).json({error:'El bloque contiene preguntas repetidas. Se conservan los ítems válidos.',detalle:issues.join('; '),codigo:'ITEM_DUPLICATES',borradorBloque:result.value,reintentable:true});
  if(issues.length)return res.status(422).json({error:'El bloque requiere ajustes. Se conservan los anteriores.',detalle:issues.join('; '),codigo:fase==='base'&&issues.some(x=>x.includes('La trazabilidad de estrategia no cubre'))?'BASE_TRACES_INCOMPLETE':fase==='base'&&issues.some(x=>x.includes('La estrategia seleccionada no está desarrollada'))?'STRATEGY_PLAN_INCOMPLETE':'BLOCK_INVALID',reintentable:true});
  return res.status(200).json({exito:true,parte:result.value,autor:{proveedor:result.provider,modelo:result.model,fecha:new Date().toISOString()},bloques:R.batches(plan)});
 }catch(e){console.error('HEVA recovery:',e.code||'ERROR',JSON.stringify({fase:String(req.body?.fase||'').slice(0,20),bloque:String(req.body?.batch?.tipo||'').slice(0,30),inicio:Number(req.body?.batch?.inicio)||0,proveedores:e.proveedores||[]}));const tooLarge=e.code==='AI_REQUEST_TOO_LARGE',limited=e.code==='AI_RATE_LIMIT',invalid=String(e?.code||'').startsWith('AI_RESPONSE_'),unavailable=['AI_UNAVAILABLE','AI_TIMEOUT'].includes(e.code);return res.status(limited?429:tooLarge||invalid||unavailable?503:500).json({error:limited?'Cuota temporal de IA agotada.':invalid?'La IA devolvió un bloque incompleto o inválido.':unavailable?'No hubo respuesta de los proveedores disponibles.':'No se pudo completar este bloque.',detalle:tooLarge?'El proveedor rechazó el tamaño de este bloque. Los bloques ya completados siguen guardados.':invalid?'La IA no devolvió este bloque en formato JSON válido; los bloques completados siguen guardados.':unavailable?'Los proveedores de IA no respondieron. Revisa su disponibilidad y vuelve a intentar.':limited?'El proveedor alcanzó su cuota temporal.':e instanceof TypeError?'Error interno al procesar el material. Código TYPE_ERROR; se requiere revisar el registro del servidor.':(e.message||'El avance anterior se conserva.'),codigo:e.code||(e instanceof TypeError?'TYPE_ERROR':'RECOVERY_ERROR'),reintentable:true,reintentarEn:e.retryAfter||0});}
};
