'use strict';
// Experimental: conservative checks. Never certify factual accuracy automatically.
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const text=x=>typeof x==='string'?x:JSON.stringify(x||'');
const similarity=(a,b)=>{const A=new Set(norm(a).split(' ').filter(w=>w.length>3)),B=new Set(norm(b).split(' ').filter(w=>w.length>3));if(!A.size||!B.size)return 0;let n=0;for(const w of A)if(B.has(w))n++;return n/Math.max(A.size,B.size)};
function inspect(material,plan={}){
 const issues=[],warnings=[],add=(severity,code,location,detail)=>({severity,code,location,detail});
 const objective=plan.objetivoAprendizaje||material.objetivoAprendizaje||'',topic=plan.temaEspecifico||material.temaEspecifico||'';
 if(!objective.trim())issues.push(add('error','OA_MISSING','objetivoAprendizaje','Falta el objetivo curricular.'));
 if(!topic.trim())warnings.push(add('warning','TOPIC_MISSING','temaEspecifico','Falta un tema específico.'));
 const checks=[['preguntasAlternativas','cantAlternativas'],['preguntasDesarrollo','cantDesarrollo'],['casosEstudio','cantCasos']];
 for(const [field,count] of checks){const expected=plan[count];if(Number.isInteger(expected)&&Array.isArray(material[field])&&material[field].length!==expected)issues.push(add('error','COUNT_MISMATCH',field,'Se solicitaron '+expected+' y llegaron '+material[field].length));}
 const alts=material.preguntasAlternativas||[],counts={A:0,B:0,C:0,D:0};
 for(const [i,q] of alts.entries()){
  const location='ALT-'+(i+1),options=q.alternativas||[];
  if(options.length!==4||options.map(o=>o.letra).join('')!=='ABCD')issues.push(add('error','OPTIONS_INVALID',location,'Se requieren cuatro opciones A-D.'));
  if(!counts.hasOwnProperty(q.claveCorrecta))issues.push(add('error','KEY_INVALID',location,'La clave debe ser A, B, C o D.'));
  else counts[q.claveCorrecta]++;
  if(new Set(options.map(o=>norm(o.texto))).size!==options.length)issues.push(add('error','DUPLICATE_OPTIONS',location,'Hay distractores repetidos.'));
  if(!String(q.justificacion||'').trim())warnings.push(add('warning','KEY_UNVERIFIED',location,'La respuesta carece de justificación docente.'));
 }
 if(alts.length>=4&&Math.max(...Object.values(counts))-Math.min(...Object.values(counts))>1)warnings.push(add('warning','UNBALANCED_KEYS','preguntasAlternativas','Distribución de claves A-D desequilibrada.'));
 const texts=[...alts.map((x,i)=>({id:'ALT-'+(i+1),value:x.enunciado})),...(material.preguntasDesarrollo||[]).map((x,i)=>({id:'DES-'+(i+1),value:x.enunciado})),...(material.casosEstudio||[]).map((x,i)=>({id:'CASO-'+(i+1),value:x.contextoReal+' '+x.preguntaReflexion}))];
 for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++)if(norm(texts[i].value).length>35&&similarity(texts[i].value,texts[j].value)>=0.88)warnings.push(add('warning','POSSIBLE_DUPLICATE',texts[i].id+' / '+texts[j].id,'Consignas muy similares; comprobar si evalúan aprendizajes distintos.'));
 const slots=plan.planIntegrado?.slots||[];
 if(slots.length){
  const totals={alternativas:0,desarrollo:0,lecturas:0};
  for(const slot of slots)for(const k of Object.keys(totals))totals[k]+=Number(slot[k]||0);
  if(totals.alternativas!==plan.cantAlternativas||totals.desarrollo!==plan.cantDesarrollo||totals.lecturas!==plan.cantCasos)issues.push(add('error','STRATEGY_TOTALS','planIntegrado','La distribución de estrategias no coincide con los totales.'));
  warnings.push(add('warning','STRATEGY_SEMANTICS','planIntegrado','Comprobar que cada estrategia elegida se ejecuta en las actividades; la estructura por sí sola no lo demuestra.'));
 }
 const traces=material.trazabilidadEstrategia||[];
 for(const [field,,prefix] of [['preguntasAlternativas',0,'ALT'],['preguntasDesarrollo',0,'DES'],['casosEstudio',0,'CASO']])for(let i=0;i<(material[field]||[]).length;i++)if(!traces.some(t=>t.referencia===prefix+'-'+(i+1)))warnings.push(add('warning','MISSING_TRACE',prefix+'-'+(i+1),'Falta evidencia explícita de habilidad y criterio.'));
 return{version:1,estado:issues.length?'requiere_correccion':'revision_docente_pendiente',errores:issues,advertencias:warnings,alcance:'Auditoría estructural y heurística; no verifica hechos, cumplimiento curricular semántico ni unicidad de respuestas.'};
}
module.exports={inspect,similarity};
