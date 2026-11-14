const {call}=require('./_providers.cjs');
const types=['conceptual','cronologia','causas','comparativo','decisiones'];
const safe=s=>String(s??'').replace(/[\u0000-\u001f]/g,' ').slice(0,300);
module.exports=async(req,res)=>{
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Utiliza POST.'});
 try{
  const {material,tipo='conceptual'}=req.body||{};
  if(!types.includes(tipo))return res.status(400).json({error:'Tipo de diagrama no válido.'});
  if(!material||typeof material!=='object'||JSON.stringify(material).length>90000)return res.status(400).json({error:'Material ausente o demasiado extenso.'});
  const title=safe(material.titulo),topic=safe(material.temaEspecifico),objective=safe(material.objetivoAprendizaje);
  const sections=[...(material.diapositivas||[]).map(x=>({titulo:safe(x.titulo),contenido:safe(Array.isArray(x.contenido)?x.contenido.join(' '):x.contenido)})),...(material.actividadesGuiadas||[]).map(x=>({titulo:safe(x.titulo||x.nombre),contenido:safe(x.descripcion||x.instrucciones)}))].slice(0,16);
  const context=JSON.stringify({title,topic,objective,introduccion:safe(material.introduccionLectura).slice(0,300),sections});
  const instructions={conceptual:'conceptos principales y relaciones semánticas etiquetadas',cronologia:'eventos y fechas en orden temporal, sin inventar fechas',causas:'causas y consecuencias con vínculos fundamentados',comparativo:'comparación de dos o más elementos con criterios explícitos',decisiones:'decisiones y resultados posibles, sin afirmar que sean hechos'}[tipo];
  const prompt='Eres especialista en didáctica EPJA chilena. Construye un organizador visual basado SOLO en el material aportado. Tipo: '+tipo+'. Objetivo: '+instructions+'. No inventes datos, fechas, citas ni vínculos. Si faltan evidencias, marca la relación como por verificar. Responde ÚNICAMENTE JSON con forma {"titulo":"...","nodos":[{"id":"n1","texto":"...","detalle":"..."}],"relaciones":[{"origen":"n1","destino":"n2","etiqueta":"..."}],"advertencias":["..."]}. Entre 2 y 12 nodos, máximo 18 relaciones. Los textos de los nodos deben ser breves y legibles. Material: '+context;
  const keyGemini=(process.env.GEMINI_API_KEY||'').trim(),keyGroq=(process.env.GROQ_API_KEY||'').trim();
  if(!keyGemini&&!keyGroq)return res.status(503).json({error:'No hay proveedor gratuito configurado.'});
  const ai=await call(prompt,'',keyGemini,keyGroq,[],{deadline:Date.now()+42000,maxOutputTokens:3000});
  const raw=ai.value;
  if(!raw||!Array.isArray(raw.nodos)||!Array.isArray(raw.relaciones))throw Error('La IA no entregó un diagrama estructurado.');
  const nodes=raw.nodos.slice(0,12).map((n,i)=>({id:'n'+i,texto:safe(n.texto).slice(0,90),detalle:safe(n.detalle).slice(0,160)})).filter(n=>n.texto);
  const ids=new Map(raw.nodos.slice(0,12).map((n,i)=>[String(n.id),'n'+i]));
  const allowed=new Set(nodes.map(n=>n.id));
  const edges=raw.relaciones.slice(0,18).map(e=>({origen:ids.get(String(e.origen)),destino:ids.get(String(e.destino)),etiqueta:safe(e.etiqueta).slice(0,65)})).filter(e=>allowed.has(e.origen)&&allowed.has(e.destino)&&e.origen!==e.destino);
  if(nodes.length<2)throw Error('La IA no produjo suficientes conceptos verificables.');
  return res.status(200).json({exito:true,diagrama:{titulo:safe(raw.titulo||title),tipo,nodos:nodes,relaciones:edges,advertencias:Array.isArray(raw.advertencias)?raw.advertencias.slice(0,8).map(safe):[]},proveedor:ai.provider,modelo:ai.model,revisionDocentePendiente:true});
 }catch(e){return res.status(e.code==='AI_RATE_LIMIT'?503:502).json({error:'No fue posible generar el organizador inteligente. Se conserva el diagrama local.',detalle:String(e.message).slice(0,240)})}
};
