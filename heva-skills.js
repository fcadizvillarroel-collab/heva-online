(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./heva-didactics.js'),require('./heva-design.js'),require('./heva-pedagogy.js'),require('./heva-audit.js'));else root.HEVASkills=factory(root.HEVADidactics,root.HEVADesign,root.HEVAPedagogy,root.HEVAAudit)})(typeof globalThis!=='undefined'?globalThis:this,function(Didactics,Design,P,Audit){
const registry=[
{id:'diseno_curricular',name:'Diseño curricular EPJA',version:1,steps:['Conservar el objetivo y marco seleccionados','Vincular contenidos, habilidades, tareas, evidencias y criterios','Comprobar la trazabilidad de las tareas reales']},
{id:'revision_independiente',name:'Revisión pedagógica independiente',version:1,steps:['Excluir el proveedor autor','Examinar contrato, disciplina y evidencia','Separar error reproducible, sugerencia y no verificable','Corregir solo errores comprobados y volver a revisar']},
{id:'evaluaciones',name:'Construcción y revisión de evaluaciones',version:1,steps:['Comprobar consignas, opciones, claves y pauta','Mantener cantidades, puntajes y rúbricas','Equilibrar claves sin cambiar su contenido cuando sea seguro','Señalar ambigüedad, pistas y suficiencia para revisión docente']},
{id:'didactica_disciplinar',name:'Didáctica y andragogía por asignatura',version:1,steps:['Seleccionar el perfil de la asignatura','Adaptar las operaciones al OA y tipo de material','Respetar experiencias adultas y recursos institucionales']},
{id:'verificacion_documental',name:'Verificación documental',version:1,steps:['Recuperar solo documentos del registro autorizado','Distinguir currículo EPJA, apoyo regular y orientación','Registrar documento, página, versión y fecha','Localizar citas y declarar límites de interpretación y vigencia']}
];
function instructions(p){return '\nPROCEDIMIENTOS PEDAGÓGICOS HEVA v1:\nDiseño curricular: el OA literal y el marco son inmutables. Cada tarea debe producir evidencia de una habilidad del objetivo con criterio propio, reflejada en trazabilidadEstrategia. No basta nombrar una habilidad.\nEvaluaciones: incluye el estímulo completo cuando una pregunta dependa de un texto, aviso, tabla o datos. Cada alternativa tiene una sola clave defendible y justificación docente; evita opciones combinadas o alusiones a letras de otras opciones. Las preguntas no deben revelar respuestas entre sí. Mantén exactamente las cantidades; cero es válido. Rúbricas y soluciones son docentes.\nRevisión: no declares revisión independiente ni verificación documental por generar el material; son etapas separadas y pueden quedar pendientes.\n'+Didactics.prompt(p)+(typeof module==='object'&&module.exports?require('./experimental/strategy-delivery.js'):globalThis.HEVAStrategyDelivery)?.prompt(p);}
function generationIssues(m,p){const copy=P.finalize(JSON.parse(JSON.stringify({...m,planGeneracion:p})),p);const delivery=typeof module==='object'&&module.exports?require('./experimental/strategy-delivery.js'):globalThis.HEVAStrategyDelivery;const issues=[...(delivery?.audit(copy,p).errores||[]),...Audit.inspect(copy).errores.map(x=>x.ubicacion+': '+x.problema)];if(!String(copy.introduccionLectura||'').trim()&&copy.preguntasAlternativas.some(q=>/segun el (texto|aviso|relato)|de acuerdo (con|al) (el )?(texto|aviso)|texto estimulo/.test(Audit.norm(q.enunciado))))issues.push('Falta el texto o aviso al que remiten las preguntas. Inclúyelo completo en introduccionLectura.');return [...new Set(issues)];}
function remapJustification(value,map){
 const original=String(value||'');
 if(original.includes('§HEVA_REF_'))return null;
 let annotated=original;
 const refs=[];
 const mark=letter=>{const i=refs.length;refs.push(String(letter).toUpperCase());return '§HEVA_REF_'+i+'§';};
 const patterns=[
  /(\b(?:clave|alternativa|opci[oó]n|respuesta|letra|opciones|alternativas|respuestas)\s+(?:correcta\s+(?:es\s+)?)?[“"']?)([ABCD])\b/gi,
  /(\b(?:la\s+)?correcta\s+(?:es\s+)?)([ABCD])\b/gi,
  /(^\s*)([ABCD])([).:]\s)/g
 ];
 for(const rx of patterns)annotated=annotated.replace(rx,(match,prefix,letter,suffix)=>prefix+mark(letter)+(typeof suffix==='string'?suffix:''));
 // Tras identificar referencias explícitas, una secuencia "C y D"
 // también se entiende como letras de opciones, no prosa general.
 if(/\b(?:clave|alternativa|opci[oó]n|letra|respuesta)s?\b/i.test(original)){
  annotated=annotated.replace(/\b([ABCD])\s+(y|o|\/)\s+([ABCD])\b/g,
   (match,a,connector,b)=>mark(a)+' '+connector+' '+mark(b));
 }
 // Referencias no interpretables (p.ej. "A través" o "B corresponde")
 // permanecen bloqueadas; no alterar una explicación ambigua.
 if(/\b[ABCD]\b/.test(annotated))return null;
 return annotated.replace(/§HEVA_REF_(\d+)§/g,(match,i)=>map[refs[Number(i)]]||refs[Number(i)]);
}
function balanceKeys(m,random=Math.random){
 const items=m.preguntasAlternativas||[],letters=['A','B','C','D'];if(items.length<2)return{changed:0,status:'no_necesario'};
 if(items.some(q=>!q||!Array.isArray(q.alternativas)||q.alternativas.length!==4||q.alternativas.map(x=>x?.letra).sort().join('')!=='ABCD'||!q.alternativas.some(x=>x.letra===q.claveCorrecta)))return{changed:0,status:'requiere_revision',motivo:'Hay alternativas o claves incompletas.'};
 const counts=Object.fromEntries(letters.map(l=>[l,items.filter(q=>q.claveCorrecta===l).length]));
 if(Math.max(...Object.values(counts))-Math.min(...Object.values(counts))<=1)return{changed:0,status:'equilibrado',counts};
 const fixed=items.map(q=>/todas las anteriores|ninguna de las anteriores|\b[ABCD]\s*(y|o|\/)\s*[ABCD]\b/i.test(q.enunciado+' '+q.alternativas.map(x=>x.texto).join(' '))||/\b(?:alternativa|opci[oó]n|letra)\s+[ABCD]\b/i.test(q.enunciado+' '+q.alternativas.map(x=>x.texto).join(' '))||remapJustification(q.justificacion,{A:'A',B:'B',C:'C',D:'D'})===null);
 const pinned=Object.fromEntries(letters.map(l=>[l,items.filter((q,i)=>fixed[i]&&q.claveCorrecta===l).length])),floor=Math.floor(items.length/4),extra=items.length%4,high=letters.filter(l=>pinned[l]>floor);
 if(high.length>extra||letters.some(l=>pinned[l]>Math.ceil(items.length/4)))return{changed:0,status:'requiere_revision',counts,blockedRefs:fixed.flatMap((v,i)=>v?['ALT-'+(i+1)]:[]),motivo:'Las preguntas con referencias de letras ambiguas impiden equilibrar sin cambiar su significado.'};
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[a[i],a[j]]=[a[j],a[i]];}return a;};
 high.push(...shuffle(letters.filter(l=>!high.includes(l))).slice(0,extra-high.length));
 const pool=letters.flatMap(l=>Array.from({length:floor+(high.includes(l)?1:0)-pinned[l]},()=>l));
 let target,best=Infinity;
 for(let attempt=0;attempt<48;attempt++){
  const draw=shuffle([...pool]);if(draw.length&&attempt)draw.push(...draw.splice(0,attempt%draw.length));let at=0;const candidate=items.map((q,i)=>fixed[i]?q.claveCorrecta:draw[at++]);let penalty=0;
  candidate.forEach((v,i)=>{if(i>1&&v===candidate[i-1]&&v===candidate[i-2])penalty++;if(i>=7&&candidate.slice(i-3,i+1).join('')===candidate.slice(i-7,i-3).join(''))penalty++;});if(penalty<best){best=penalty;target=candidate;}if(!best)break;
 }
 let changed=0;items.forEach((q,i)=>{if(fixed[i]||q.claveCorrecta===target[i])return;const ordered=[...q.alternativas].sort((a,b)=>letters.indexOf(a.letra)-letters.indexOf(b.letra)),from=ordered.findIndex(x=>x.letra===q.claveCorrecta),to=letters.indexOf(target[i]);[ordered[from],ordered[to]]=[ordered[to],ordered[from]];const map=Object.fromEntries(ordered.map((o,j)=>[o.letra,letters[j]]));q.justificacion=remapJustification(q.justificacion,map);q.alternativas=ordered.map((o,j)=>({...o,letra:letters[j]}));q.claveCorrecta=target[i];changed++;});
 return{changed,status:'equilibrado',counts:Object.fromEntries(letters.map(l=>[l,items.filter(q=>q.claveCorrecta===l).length])),preguntasConservadas:fixed.filter(Boolean).length};
}

function correctCalculations(m){const copy=JSON.parse(JSON.stringify(m)),corrections=[];if(Didactics.family(m.asignatura||m.planGeneracion?.asignatura)!=='matematica')return{material:copy,corrections};for(const [i,q]of (copy.preguntasAlternativas||[]).entries()){const proof=(typeof module==='object'&&module.exports?require('./heva-calculation.js'):globalThis.HEVACalculation).proof(q);if(proof){const before=q.claveCorrecta;q.claveCorrecta=proof.claveEsperada;const explanationChanged=q.justificacion!==proof.explicacion;q.justificacion=proof.explicacion;if(before!==q.claveCorrecta||explanationChanged)corrections.push({referencia:'ALT-'+(i+1),anterior:before,nueva:q.claveCorrecta,comprobacion:proof.explicacion,origen:'control_aritmetico_HEVA'});}}if(corrections.length){delete copy.revisionIA;copy.correccionesLocales=[...(m.correccionesLocales||[]),...corrections];}return{material:copy,corrections};}
function documentaryReport(bundle,evidence={valid:[],invalid:[]}){const docs=Array.isArray(bundle?.documents)?bundle.documents:[],fragments=Array.isArray(bundle?.fragments)?bundle.fragments:[],content=fragments.filter(f=>f.uso==='contenido');return{estado:fragments.length?'respaldo_parcial':'sin_fragmentos',objetivo:bundle?.objetivo||'no_localizado',documentosConsultados:docs.filter(d=>d.status==='consultada').length,documentosNoDisponibles:docs.filter(d=>d.status==='no_disponible').length,fragmentosContenido:content.length,citasLocalizadas:evidence.valid?.length||0,citasRechazadas:evidence.invalid?.length||0,limite:'Citas localizadas no certifican interpretación, cobertura completa ni vigencia normativa.'};}
function record(m,p,bundle,evidence,balance){const profile=Didactics.profile(p.asignatura),audit=Audit.inspect({...m,planGeneracion:p});return{version:1,fecha:new Date().toISOString(),perfil:{id:profile.id,nombre:profile.name,version:profile.version},procedimientos:registry.map(s=>({id:s.id,version:s.version})),curriculo:{objetivoAprendizaje:p.objetivoAprendizaje,marcoCurricular:p.marcoCurricular,tema:p.temaEspecifico,referencias:P.refs(m),alcance:'Vinculación estructural; la pertinencia semántica requiere revisión.'},evaluacion:{erroresEstructurales:audit.errores.length,senalesRevision:audit.sugerencias.length,equilibrio:balance||{status:'sin_cambios',changed:0}},documentacion:documentaryReport(bundle,evidence),revisionIndependiente:'pendiente'};}
function prepare(m,p,bundle,evidence){const prepared=correctCalculations(P.finalize(m,p)).material,balance=balanceKeys(prepared);(typeof module==='object'&&module.exports?require('./heva-assessment.js'):globalThis.HEVAAssessment)?.shuffleMatching(prepared);prepared.cumplimientoEstrategias=(typeof module==='object'&&module.exports?require('./experimental/strategy-delivery.js'):globalThis.HEVAStrategyDelivery)?.audit(prepared,p);prepared.procedimientosHEVA=record(prepared,p,bundle,evidence,balance);return prepared;}
return{registry,instructions,generationIssues,remapJustification,balanceKeys,correctCalculations,documentaryReport,record,prepare};});
