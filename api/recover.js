const Skills=require('../heva-skills.js');
const {call}=require('./_providers.cjs'),R=require('../lib/recovery.cjs'),S=require('../lib/document-sources.cjs'),P=require('../heva-pedagogy.js'),H=require('../heva-core.js');
module.exports=async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
 if(req.method==='OPTIONS')return res.status(200).end();if(req.method!=='POST')return res.status(405).json({error:'Utilice POST.'});
 const deadline=Date.now()+55000;
 try{
  const {fase,plan:input,base,parts=[],batch,autor,corregirFormato=false}=req.body||{};
  if(JSON.stringify(req.body||{}).length>250000)return res.status(413).json({error:'Documento demasiado extenso.'});
  let plan;try{plan=R.planOf(input)}catch(e){return res.status(400).json({error:'El encargo contiene parámetros inválidos.',detalle:e.message,codigo:'PLAN_INVALIDO',reintentable:false})}
  if(!['base','items','finalizar'].includes(fase))return res.status(400).json({error:'Fase no admitida.'});
  if(fase!=='base'&&(!base||!['gemini','groq','openai'].includes(autor?.proveedor)))return res.status(400).json({error:'Falta el documento base o su autoría.'});
  let fuentesDocumentales;try{fuentesDocumentales=await S.retrieve(plan)}catch(e){console.error('HEVA document sources:',e.stack||e);fuentesDocumentales=[];}
  if(fase==='finalizar'){
   const metadata={objetivoAprendizaje:plan.objetivoAprendizaje,asignatura:plan.asignatura,nivel:plan.nivel,marcoCurricular:plan.marcoCurricular,temaEspecifico:plan.temaEspecifico,tipoMaterial:plan.tipoMaterial,estrategiaDidactica:P.strategy(plan.estrategiaDidactica).name};
   let material=H.material(R.merge(base,parts,plan),metadata),issues=R.validate(material,plan);
   if(issues.length)return res.status(422).json({error:'Los bloques requieren corrección. Se conserva el material anterior.',detalle:issues.join('; '),reparacion:R.repair(base,parts,plan),reintentable:true});
   material=P.finalize(material,plan);material.autoriaIA=autor;material.planGeneracion=plan;material.fuentesDocumentales=fuentesDocumentales;
   const evidence=S.validateEvidence(material.respaldoDocumental,fuentesDocumentales);material.respaldoDocumental=evidence.valid;material.incidenciasDocumentales=evidence.invalid;material=Skills.prepare(material,plan,fuentesDocumentales,evidence);
   material=require('../heva-studio.js').link(material,plan);return res.status(200).json({exito:true,material});
  }
  const keys=[process.env.ALLOW_PAID_AI==='true'?process.env.OPENAI_API_KEY:'',process.env.GEMINI_API_KEY,process.env.GROQ_API_KEY].map(k=>(k||'').trim());
  // Permitir respaldo entre proveedores en bloques: una caída del autor inicial no debe bloquear todo el documento.
  const exclude=[];
  const strictFormat=corregirFormato&&fase==='items'&&batch?.tipo==='alternativas'?'\\nFORMATO ESTRICTO DE REPARACIÓN: responde únicamente JSON válido con preguntasAlternativas. Cada pregunta incluye enunciado, alternativas como ARRAY de exactamente cuatro objetos {letra,texto} en orden A,B,C,D, claveCorrecta como UNA LETRA A/B/C/D, justificacion y trazabilidadEstrategia. No uses opciones, respuestaCorrecta, índices numéricos ni claves explicadas en frases. No inventes una clave sin comprobar cuál opción es verdadera.':'';
  const prompt=(fase==='base'?R.basePrompt(plan):R.itemPrompt(plan,base,batch,parts))+strictFormat;
  let result=await call(prompt+S.evidencePrompt(fuentesDocumentales,{compact:true}),...keys,exclude,{deadline,maxOutputTokens:fase==='base'?10000:5000});
  let issues=R.partIssues(result.value,plan,fase==='items'?batch:null);
  if(issues.length&&deadline-Date.now()>5000){
   result=await call(prompt+S.evidencePrompt(fuentesDocumentales,{compact:true})+'\nCORRIGE este bloque completo: '+issues.join('; '),...keys,exclude,{deadline,maxOutputTokens:fase==='base'?10000:5000});
   issues=R.partIssues(result.value,plan,fase==='items'?batch:null);
  }
  if(issues.length)return res.status(422).json({error:'El bloque requiere ajustes. Se conservan los anteriores.',detalle:issues.join('; '),reintentable:true});
  return res.status(200).json({exito:true,parte:result.value,autor:{proveedor:result.provider,modelo:result.model,fecha:new Date().toISOString()},bloques:R.batches(plan)});
 }catch(e){console.error('HEVA recovery:',e.stack||e);const limited=e.code==='AI_RATE_LIMIT',invalid=e.code?.startsWith('AI_RESPONSE_'),unavailable=e.code==='AI_UNAVAILABLE';return res.status(limited?429:invalid||unavailable?503:500).json({error:limited?'Cuota temporal de IA agotada.':invalid?'La IA devolvió un bloque incompleto o inválido.':unavailable?'No hubo respuesta de los proveedores disponibles.':'No se pudo completar este bloque.',detalle:invalid?'La IA devolvió contenido incompleto; el avance se mantiene.':unavailable?'Los proveedores de IA no respondieron. Revisa su disponibilidad y vuelve a intentar.':limited?'El proveedor alcanzó su cuota temporal.':e instanceof TypeError?'Error interno al procesar el material. Código TYPE_ERROR; se requiere revisar el registro del servidor.':(e.message||'El avance anterior se conserva.'),codigo:e.code||(e instanceof TypeError?'TYPE_ERROR':'RECOVERY_ERROR'),reintentable:true,reintentarEn:e.retryAfter||0});}
};
