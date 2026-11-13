const {call}=require('./_providers.cjs'),R=require('../lib/recovery.cjs'),S=require('../lib/document-sources.cjs'),P=require('../heva-pedagogy.js'),H=require('../heva-core.js');
module.exports=async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
 if(req.method==='OPTIONS')return res.status(200).end();if(req.method!=='POST')return res.status(405).json({error:'Utilice POST.'});
 const deadline=Date.now()+55000;
 try{
  const {fase,plan:input,base,parts=[],batch,autor}=req.body||{};
  if(JSON.stringify(req.body||{}).length>250000)return res.status(413).json({error:'Documento demasiado extenso.'});
  const plan=R.planOf(input);
  if(!['base','items','finalizar'].includes(fase))return res.status(400).json({error:'Fase no admitida.'});
  if(fase!=='base'&&(!base||!['gemini','groq','openai'].includes(autor?.proveedor)))return res.status(400).json({error:'Falta el documento base o su autoría.'});
  const fuentesDocumentales=await S.retrieve(plan);
  if(fase==='finalizar'){
   const metadata={objetivoAprendizaje:plan.objetivoAprendizaje,asignatura:plan.asignatura,nivel:plan.nivel,marcoCurricular:plan.marcoCurricular,temaEspecifico:plan.temaEspecifico,tipoMaterial:plan.tipoMaterial,estrategiaDidactica:P.strategy(plan.estrategiaDidactica).name};
   let material=H.material(R.merge(base,parts,plan),metadata),issues=R.validate(material,plan);
   if(issues.length)return res.status(422).json({error:'Los bloques requieren corrección. Se conserva el material anterior.',detalle:issues.join('; ')});
   material=P.finalize(material,plan);material.autoriaIA=autor;material.planGeneracion=plan;material.fuentesDocumentales=fuentesDocumentales;
   const evidence=S.validateEvidence(material.respaldoDocumental,fuentesDocumentales);material.respaldoDocumental=evidence.valid;material.incidenciasDocumentales=evidence.invalid;
   return res.status(200).json({exito:true,material});
  }
  const keys=[process.env.ALLOW_PAID_AI==='true'?process.env.OPENAI_API_KEY:'',process.env.GEMINI_API_KEY,process.env.GROQ_API_KEY].map(k=>(k||'').trim());
  const exclude=fase==='items'?['gemini','groq','openai'].filter(p=>p!==autor.proveedor):[];
  const prompt=fase==='base'?R.basePrompt(plan):R.itemPrompt(plan,base,batch,parts);
  let result=await call(prompt+S.evidencePrompt(fuentesDocumentales),...keys,exclude,{deadline,maxOutputTokens:fase==='base'?10000:5000});
  let issues=R.partIssues(result.value,plan,fase==='items'?batch:null);
  if(issues.length&&deadline-Date.now()>5000){
   result=await call(prompt+S.evidencePrompt(fuentesDocumentales)+'\nCORRIGE este bloque completo: '+issues.join('; '),...keys,exclude,{deadline,maxOutputTokens:fase==='base'?10000:5000});
   issues=R.partIssues(result.value,plan,fase==='items'?batch:null);
  }
  if(issues.length)return res.status(422).json({error:'El bloque requiere ajustes. Se conservan los anteriores.',detalle:issues.join('; '),reintentable:true});
  return res.status(200).json({exito:true,parte:result.value,autor:{proveedor:result.provider,modelo:result.model,fecha:new Date().toISOString()},bloques:R.batches(plan)});
 }catch(e){return res.status(e.code?503:400).json({error:e.code==='AI_RATE_LIMIT'?'Cuota temporal de IA agotada. El avance queda guardado para continuar.':e.code?'Este bloque no se pudo completar. El avance queda guardado para continuar.':e.message,codigo:e.code,reintentable:!!e.code,reintentarEn:e.retryAfter||0});}
};
