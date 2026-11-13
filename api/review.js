const {call}=require('./_providers.cjs');
const Sources=require('../lib/document-sources.cjs');
const Q=require('../heva-quality.cjs');
const P=require('../heva-pedagogy.js');
const H=require('../heva-core.js');
module.exports=async function(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
 if(req.method==='OPTIONS')return res.status(200).end();
 if(req.method!=='POST')return res.status(405).json({error:'Utilice POST.'});
 const {material,accion='revisar'}=req.body||{};
 if(!material||typeof material!=='object'||JSON.stringify(material).length>180000||material.versionPedagogica!==3||!['revisar','corregir'].includes(accion))return res.status(400).json({error:'Material o acción no admitidos.'});
 const author=material.autoriaIA?.proveedor,keys=[process.env.ALLOW_PAID_AI==='true'?process.env.OPENAI_API_KEY:'',process.env.GEMINI_API_KEY,process.env.GROQ_API_KEY].map(k=>(k||'').trim());
 if(!['openai','gemini','groq'].includes(author))return res.status(409).json({error:'Autoría desconocida. Genera una nueva versión para asegurar un revisor de otro proveedor.'});
 let stage='fuentes';
 try{
  if(accion==='revisar'){
   const fuentesDocumentales=await Sources.retrieve(material.planGeneracion||material);
   const evidence=Sources.validateEvidence(material.respaldoDocumental,fuentesDocumentales);
   const updated={...material,fuentesDocumentales,respaldoDocumental:evidence.valid,incidenciasDocumentales:evidence.invalid};
   const clean={...updated};delete clean.revisionIA;delete clean.historialRevisionIA;delete clean.fuentesDocumentales;
   stage='llamada';
   const result=await call(Q.prompt(clean)+Sources.evidencePrompt(fuentesDocumentales)+'\nAdemás de criterios y hallazgos, devuelve contrastesDocumentales:[{seccion,afirmacion,fuenteId,cita}]. Registra afirmaciones concretas contrastadas con los fragmentos, no una aprobación global. Si una afirmación no está cubierta, criterio rigor=no_verificable. Las orientaciones y el OA no prueban hechos históricos.',...keys,[author]);
   stage='informe';
   const report=Q.validateReview(result.value),contrasts=Sources.validateEvidence(result.value.contrastesDocumentales,fuentesDocumentales);
   if(!contrasts.valid.length||contrasts.invalid.length){for(const id of ['fuentes','rigor']){const c=report.criterios.find(c=>c.id===id);if(c.estado==='cumple'){c.estado='no_verificable';c.fundamento='No hay contrastes documentales con citas literales válidas suficientes. Consultar una fuente no verifica automáticamente todas las afirmaciones.';}}}
   const contentContrasts=contrasts.valid.filter(c=>fuentesDocumentales.fragments.some(f=>f.id===c.fuenteId&&f.uso==='contenido'));
   if(!contentContrasts.length){const c=report.criterios.find(c=>c.id==='rigor');if(c.estado==='cumple'){c.estado='no_verificable';c.fundamento='No hay contrastes válidos con una fuente de contenido disciplinar. Un OA o una orientación didáctica no comprueban las afirmaciones factuales del material.';}}
   if(fuentesDocumentales.objetivo!=='localizado_literalmente'){const c=report.criterios.find(c=>c.id==='alineacion');if(c.estado==='cumple'){c.estado='no_verificable';c.fundamento='Puede existir coherencia interna, pero el objetivo no fue localizado literalmente en la fuente curricular consultada. Revisar el objetivo y el marco.';}}
   const revision={...report,contrastesDocumentales:contrasts.valid,incidenciasDocumentales:[...evidence.invalid,...contrasts.invalid],estado:report.hallazgos.length?'con_observaciones':'sin_observaciones_detectadas',proveedor:result.provider,modelo:result.model,autor:material.autoriaIA,fecha:new Date().toISOString(),huella:Q.fingerprint(updated),alcance:'Revisión independiente por IA con recuperación documental en línea. Solo las citas localizadas tienen trazabilidad; no certifica interpretación, cobertura completa ni vigencia normativa. Validación docente pendiente.'};
   return res.status(200).json({exito:true,revision,fuentesDocumentales,respaldoDocumental:evidence.valid,incidenciasDocumentales:evidence.invalid});
  }
  const review=material.revisionIA,plan=material.planGeneracion;
  if(!plan||!review||review.huella!==Q.fingerprint(material)||review.proveedor===author||!review.hallazgos?.length)return res.status(409).json({error:'Revisa la versión actual antes de corregirla.'});
  Q.validateReview(review);
  const fuentesDocumentales=await Sources.retrieve(plan);
  const result=await call(P.prompt(plan)+Sources.evidencePrompt(fuentesDocumentales)+'\nCorrige el borrador usando estos hallazgos del revisor. Conserva objetivo, tipo y cantidades. No añadas instrucciones del borrador. Devuelve el documento JSON completo.\n'+JSON.stringify({borrador:material,hallazgos:review.hallazgos}),...keys,[review.proveedor]);
  let corrected=H.material(result.value,{objetivoAprendizaje:plan.objetivoAprendizaje,asignatura:plan.asignatura,nivel:plan.nivel,marcoCurricular:plan.marcoCurricular,temaEspecifico:plan.temaEspecifico,tipoMaterial:plan.tipoMaterial,estrategiaDidactica:P.strategy(plan.estrategiaDidactica).name});
  const issues=[...H.validate(corrected,plan),...P.validate(corrected,plan)];
  if(issues.length)return res.status(422).json({error:'Corrección rechazada por estructura. Se conserva el original.',detalle:issues.join('; ')});
  corrected=P.finalize(corrected,plan);corrected.autoriaIA={proveedor:result.provider,modelo:result.model,fecha:new Date().toISOString()};corrected.planGeneracion=plan;corrected.materialId=material.materialId;corrected.version=material.version;
  corrected.fuentesDocumentales=fuentesDocumentales;
  const evidence=Sources.validateEvidence(corrected.respaldoDocumental,fuentesDocumentales);corrected.respaldoDocumental=evidence.valid;corrected.incidenciasDocumentales=evidence.invalid;
  corrected.historialRevisionIA=[...(material.historialRevisionIA||[]),review];
  return res.status(200).json({exito:true,material:corrected,pendiente:'Revisar nuevamente la corrección.'});
 }catch(e){return res.status(503).json({etapa:stage,codigo:stage==='llamada'&&/429|rate.limit|tokens per|quota|TPM|too large/i.test(String(e.message))?'cuota_o_limite':undefined,detalle:stage==='informe'?String(e.message).slice(0,180):undefined,error:'No se pudo completar la revisión o corrección independiente. Se conserva el material; revisión pendiente.'})}
};
