const TPInternational=require('../lib/tp-metal-international.cjs');
const {call} = require('./_providers.cjs');
const Skills=require('../heva-skills.js');
const DeepMaterials=require('../heva-deep-materials.cjs');
const Sources=require('../lib/document-sources.cjs');
const Textbooks=require('../lib/textbook-reference-catalog.cjs');
const OATextbookMatrix=require('../lib/oa-textbook-matrix.cjs');
const OAPedagogy=require('../lib/oa-pedagogical-bridge.cjs');
const Pedagogy = require('../heva-pedagogy.js');
const HEVA = require('../heva-core.js');
const LabBridge = require('../lib/lab-strategy.cjs');
const LabMaterialView = require('../experimental/material-view.js');
// api/generate.js — Motor Multi-IA Suite: ChatGPT / Gemini con Prosa Andragógica y RAG

module.exports = async function handler(req, res) {
 require('./_cors.cjs').applyCors(req,res,{methods:'POST,OPTIONS',headers:'Content-Type, Authorization'});

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Utilice POST.' });

  if(!(await require('./_ai-access.cjs').protect(req,res)))return;
  const generationDeadline=Date.now()+55000;
  const {
    modoHerramienta = 'GENERADOR_ESTANDAR', // 'GENERADOR_ESTANDAR', 'DIFERENCIADOR_DIFFIT', 'REMEDIACION_ESCOLAR', 'REGENERAR_PREGUNTA'
    asignatura = 'Estudios Sociales',
    nivel = 'III NIVEL BÁSICO',
    marcoCurricular = 'Decreto Supremo N° 257/2009 EPJA',
    objetivoAprendizaje = '',
    temaEspecifico = '',
    estrategiaDidactica = 'Análisis de contenido disciplinar formativo',
    instruccionesDocente = '',
    disenoPedagogico = null,
    planIntegrado = null,
    estrategiaLaboratorio = null,
    estrategiasLaboratorio = null,
    opcionesLaboratorio = null,
    oaClaveLaboratorio = null,
    textoReferencia: referenciaRecibida = '',
    modoReferencia = 'NINGUNA',
    adecuacionesPIE = [],
    tipoMaterial = 'GUIA',
    cantAlternativas = 6,
    cantDesarrollo = 2,
    cantCasos = 2,
    incluirTicketSalida = true,
    preguntaARegenerar = null
  } = req.body || {};

  // En presentaciones, el contenido evaluable se integra en las diapositivas.
  // Ignorar las cantidades de ítems heredadas del formulario para evitar
  // fallos ALT-# por distractores repetidos ajenos al PowerPoint.
  const cantidadesEfectivas=tipoMaterial==='PRESENTACION'||tipoMaterial==='PLANIFICACION'
    ? {cantAlternativas:0,cantDesarrollo:0,cantCasos:0}
    : {cantAlternativas,cantDesarrollo,cantCasos};
  if(!['NINGUNA','ESTILO','CONTENIDO'].includes(modoReferencia)||typeof referenciaRecibida!=='string'||referenciaRecibida.length>60000)return res.status(400).json({error:'Referencia opcional inválida.'});
  const textoReferencia=modoReferencia==='NINGUNA'?'':referenciaRecibida;
  for (const [name,value,max] of [['cantAlternativas',cantAlternativas,30],['cantDesarrollo',cantDesarrollo,30],['cantCasos',cantCasos,30]]) {
    if (!Number.isInteger(value) || value < 0 || value > max) return res.status(400).json({error:`${name} debe estar entre 0 y ${max}`});
  }
  // Comprobar tipos y límites antes de enviar solicitudes a IA.
  for(const [name,value,max] of [['modoHerramienta',modoHerramienta,60],['tipoMaterial',tipoMaterial,60],['asignatura',asignatura,300],['nivel',nivel,300],['marcoCurricular',marcoCurricular,300],['objetivoAprendizaje',objetivoAprendizaje,3000],['temaEspecifico',temaEspecifico,3000],['estrategiaDidactica',estrategiaDidactica,500],['instruccionesDocente',instruccionesDocente,12000]]){
    if(value!=null&&(typeof value!=='string'||value.length>max))return res.status(400).json({error:'Campo '+name+' inválido o demasiado largo.'});
  }
  for(const [name,value] of [['disenoPedagogico',disenoPedagogico],['planIntegrado',planIntegrado],['preguntaARegenerar',preguntaARegenerar],['adecuacionesPIE',adecuacionesPIE]]){
    if(value!=null&&(typeof value!=='object'||JSON.stringify(value).length>200000))return res.status(400).json({error:'Campo '+name+' inválido o demasiado largo.'});
  }
  if (typeof objetivoAprendizaje !== 'string' || typeof textoReferencia !== 'string' || textoReferencia.length > 60000) return res.status(400).json({error:'Objetivo o texto de referencia inválido o demasiado extenso.'});
  const OPENAI_API_KEY = process.env.ALLOW_PAID_AI === 'true' ? (process.env.OPENAI_API_KEY || '').trim() : '';
  const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
  const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();

  if (!OPENAI_API_KEY && !GEMINI_API_KEY && !GROQ_API_KEY) {
    return res.status(400).json({
      error: 'No hay proveedor habilitado',
      detalle: 'Configura GEMINI_API_KEY o GROQ_API_KEY en Vercel. OpenAI requiere ALLOW_PAID_AI=true explícito. El uso gratuito depende de la cuota y facturación del proveedor.'
    });
  }

  try {
    // CASO 1: REGENERACIÓN DE PREGUNTA INDIVIDUAL
    if (modoHerramienta === 'REGENERAR_PREGUNTA' && preguntaARegenerar) {
      const promptItem = `
Eres docente de la Escuela Héctor Valenzuela CEA (Villarrica).
Reescribe UNA SOLA pregunta de selección múltiple con prosa fluida y rigor disciplinar:
Asignatura: ${asignatura} | Nivel: ${nivel} | Tema: ${temaEspecifico} | Objetivo: ${objetivoAprendizaje}
${textoReferencia ? `Básate en este texto: ${textoReferencia}` : ''}

REGLAS:
- 4 alternativas (A, B, C, D) con distractores plausibles y clave al azar (no necesariamente A).
- Debe ser distinta a la anterior: "${preguntaARegenerar.enunciado || ''}".

Responde ÚNICAMENTE en JSON:
{
  "numero": ${preguntaARegenerar.numero || 1},
  "enunciado": "...",
  "alternativas": [
    { "letra": "A", "texto": "..." },
    { "letra": "B", "texto": "..." },
    { "letra": "C", "texto": "..." },
    { "letra": "D", "texto": "..." }
  ],
  "claveCorrecta": "B",
  "habilidad": "Interpretar",
  "justificacion": "..."
}
`;
      const item = await ejecutarLlamadaIAPriorizada(promptItem, OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY);
      return res.status(200).json({ exito: true, item });
    }

    // CASO 2: DIFERENCIADOR MULTINIVEL (DIFFIT STYLE)
    if (modoHerramienta === 'DIFERENCIADOR_DIFFIT') {
      const promptDiffit = `
Eres especialista en diferenciación curricular andragógica y DUA para la Escuela Héctor Valenzuela CEA de Villarrica.
Crea dos versiones de lectura sobre el tema "${temaEspecifico}" para la asignatura "${asignatura}" (${nivel}):
1. Versión Estándar: Texto completo, rico en vocabulario disciplinar y análisis conceptual.
2. Versión Nivelada / Lectura Fácil DUA: Mismo contenido conceptual pero con oraciones breves, estructura sintáctica directa, apoyos contextuales y sin sobrecarga cognitiva, sin infantilizar al adulto.
Objetivo: ${objetivoAprendizaje}

Responde ÚNICAMENTE en JSON:
{
  "titulo": "Título de la Lectura Diferenciada",
  "lecturaEstandar": "Texto estándar de al menos 280 palabras...",
  "lecturaNiveladaDUA": "Texto adaptado en lectura fácil de al menos 200 palabras...",
  "glosarioApoyo": [
    { "termino": "...", "definicionSencilla": "..." }
  ],
  "preguntasComprobacion": [
    { "numero": 1, "pregunta": "Pregunta de comprensión directa...", "criterio": "..." },
    { "numero": 2, "pregunta": "Pregunta de inferencia o reflexión...", "criterio": "..." }
  ]
}
`;
      const materialDiffit = await ejecutarLlamadaIAPriorizada(promptDiffit, OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY);
      return res.status(200).json({ exito: true, materialDiffit });
    }

    // CASO 3: REMEDIACIÓN Y NIVELACIÓN (REMEDIACIONES STYLE)
    if (modoHerramienta === 'REMEDIACION_ESCOLAR') {
      const promptRemediacion = `
Eres el Coordinador Pedagógico del CEA Héctor Valenzuela de Villarrica.
Diseña un Plan de Remediación y Nivelación escolar para estudiantes que obtuvieron calificación bajo 4.0 en:
Asignatura: ${asignatura} | Nivel: ${nivel} | Tema: ${temaEspecifico}
Objetivo no logrado: ${objetivoAprendizaje}

Estructura requerida:
1. Resumen de repaso conceptual (andamiaje directo).
2. Modelamiento guiado de un ejercicio típico resuelto paso a paso con explicación de errores frecuentes.
3. 3 actividades breves de reaprendizaje progresivo (De menor a mayor complejidad).
4. Pauta de verificación con indicadores de logro concretos.

Responde ÚNICAMENTE en JSON:
{
  "titulo": "Plan de Remediación y Refuerzo de Aprendizajes",
  "diagnosticoErrorComun": "Explicación del nudo de aprendizaje o error típico...",
  "sintesisConceptual": "Resumen directo y claro de los conceptos clave...",
  "ejercicioModelado": {
    "problemaOTexto": "...",
    "pasoAPaso": "1. Identificar datos... 2. Aplicar concepto...",
    "solucion": "..."
  },
  "actividadesNivelacion": [
    { "numero": 1, "instruccion": "...", "espacioRespuesta": true },
    { "numero": 2, "instruccion": "...", "espacioRespuesta": true },
    { "numero": 3, "instruccion": "...", "espacioRespuesta": true }
  ],
  "pautaLogro": [
    { "actividad": 1, "desempenoEsperado": "..." },
    { "actividad": 2, "desempenoEsperado": "..." },
    { "actividad": 3, "desempenoEsperado": "..." }
  ]
}
`;
      const materialRemed = await ejecutarLlamadaIAPriorizada(promptRemediacion, OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY);
      return res.status(200).json({ exito: true, materialRemediacion: materialRemed });
    }

    // Cada material tiene un contrato propio y una estrategia observable en sus tareas.
    if (!Object.hasOwn(Pedagogy.contracts, tipoMaterial)) return res.status(400).json({error:'Tipo de material no admitido.'});
    if (!objetivoAprendizaje.trim()) return res.status(400).json({error:'Selecciona un objetivo curricular antes de generar.'});
    const plan = {...Object.fromEntries(["documentosBase","plantillaVisual","derivacion","usarNoticias","noticiaDidacticaModo","instrumentosEvaluacion","planificacionClase","usarTextosEscolares"].filter(k=>req.body[k]!=null).map(k=>[k,req.body[k]])),asignatura,nivel,marcoCurricular,objetivoAprendizaje,temaEspecifico,estrategiaDidactica,instruccionesDocente,disenoPedagogico,planIntegrado,textoReferencia,modoReferencia,adecuacionesPIE,tipoMaterial,...cantidadesEfectivas,incluirTicketSalida};
    const extraIssues=require('../heva-studio.js').validateExtras(plan);if(extraIssues.length)return res.status(400).json({error:extraIssues.join('; ')});
    const designIssues=require('../heva-design.js').validate(disenoPedagogico,plan);
    if(designIssues.length)return res.status(400).json({error:designIssues.join('; ')});
    let estrategiasLab = [];
    try { estrategiasLab = LabBridge.resolveMany({asignatura,nivel,objetivoAprendizaje,temaEspecifico,tipoMaterial,estrategiaLaboratorio,estrategiasLaboratorio,opcionesLaboratorio,oaClaveLaboratorio,marcoCurricular}); }
    catch (error) { return res.status(400).json({error:'Estrategia Laboratorio: '+error.message}); }
    const fuentesDocumentales=await Sources.retrieve(plan);
    const librosRegulares=Textbooks.recommendations(plan);
    const matrizOA=OATextbookMatrix.build(plan,librosRegulares,fuentesDocumentales);
    const planUsoFuentes=OAPedagogy.build(plan,matrizOA);
    const referenciasMetalmecanica=TPInternational.bibliography(plan);
    const presentationGuidance=tipoMaterial==='PRESENTACION'?'\nMODO PRESENTACIÓN: genera 14 a 24 diapositivas completas en una respuesta JSON. Incluye objetivos, explicación progresiva, ejemplo modelado, actividades de aplicación y cierre. Cada diapositiva requiere título, función, contenido desarrollado y notas docentes. Crea una trazabilidadEstrategia con una referencia DIAPO-1, DIAPO-2, etc. para CADA diapositiva real, con habilidad, evidencia observable y criterio específicos. Incluye además las referencias de otras tareas reales si existen; no inventes referencias ni agregues preguntas por encima de las cantidades solicitadas. REGLA DE COHERENCIA DISCIPLINAR: desarrolla exclusivamente la asignatura, el tema y el objetivo seleccionados. No mezcles Matemática y Lenguaje ni otras asignaturas salvo que el docente solicite explícitamente una integración interdisciplinaria. AUTOSUFICIENCIA: toda actividad que mencione un segundo texto, fuente, noticia, tabla, gráfico, caso o párrafo debe incluir el estímulo completo en la misma diapositiva o en otra diapositiva identificada; nunca remitas a un material inexistente. Evita fuentes inventadas o nombres de empresas ficticias presentadas como reales; etiqueta ejemplos simulados. Diseña diapositivas con 2-4 ideas explicadas y ejemplos específicos, no instrucciones genéricas de relleno. Las notas docentes deben desarrollar lo que no cabe visualmente.':'';
    const promptRedactor = Pedagogy.prompt(plan)+LabBridge.promptMany(estrategiasLab,tipoMaterial)+presentationGuidance+Sources.evidencePrompt(fuentesDocumentales)+Textbooks.instruction(librosRegulares)+OATextbookMatrix.instruction(matrizOA)+OAPedagogy.instructions(planUsoFuentes)+TPInternational.prompt(referenciasMetalmecanica);
    const metadata = {objetivoAprendizaje,asignatura,nivel,marcoCurricular,temaEspecifico,tipoMaterial,estrategiaDidactica:Pedagogy.strategy(estrategiaDidactica).name};
    let author;
    const draft = async prompt => { const r = await call(prompt,OPENAI_API_KEY,GEMINI_API_KEY,GROQ_API_KEY,[],{deadline:generationDeadline}); author={proveedor:r.provider,modelo:r.model,fecha:new Date().toISOString()}; return r.value; };
    const normalize = raw => {
      const normalized=Pedagogy.normalizeStrategyPlan(raw,plan);
      const counted=Pedagogy.enforceRequestedCounts(normalized,plan);
      const traced=Pedagogy.normalizeTaskTraces(counted);
      const m=HEVA.material(traced,metadata);
      // Final defensive boundary: never return surplus items when the teacher
      // requested zero, regardless of model output or intermediary defaults.
      for(const [field,count] of [['preguntasAlternativas',cantidadesEfectivas.cantAlternativas],['preguntasDesarrollo',cantidadesEfectivas.cantDesarrollo],['casosEstudio',cantidadesEfectivas.cantCasos]])m[field]=m[field].slice(0,count);
      m.trazabilidadEstrategia=Pedagogy.normalizeTaskTraces(m).trazabilidadEstrategia;
      return m;
    };
    const check = m => [...HEVA.validate(m,cantidadesEfectivas),...Pedagogy.validate(m,plan),...Skills.generationIssues(m,plan)];
    let material = normalize(await draft(promptRedactor));
    let issues = check(material);
    if (issues.length) {
      const missingRefs=Pedagogy.missingTaskTraces(material);
      const selectedStrategy=Pedagogy.strategy(estrategiaDidactica);
      const strategyPlan=material.planEstrategia||{};
      const missingStrategyFields=['habilidadCentral','aplicacionConcreta','evidenciaEsperada','retroalimentacionDocente'].filter(k=>typeof strategyPlan[k]!=='string'||!strategyPlan[k].trim());
      const strategyRepair=issues.some(x=>x.includes('La estrategia seleccionada no está desarrollada'))?
        '\nPLAN DE ESTRATEGIA OBLIGATORIO: planEstrategia.id debe ser exactamente '+selectedStrategy.id+'. Completa planEstrategia.habilidadCentral, aplicacionConcreta, evidenciaEsperada y retroalimentacionDocente con textos específicos del objetivo y de las tareas reales. Campos actualmente vacíos: '+missingStrategyFields.join(', ')+'. No copies una plantilla genérica; describe cómo se aplica la estrategia y cómo se revisará el trabajo.':'';
      material = normalize(await draft(promptRedactor+'\nCORRIGE LA RESPUESTA COMPLETA. Se detectaron estas incidencias: '+issues.join('; ')+(missingRefs.length?'\nTRAZABILIDAD OBLIGATORIA: agrega exactamente una entrada con habilidad, evidencia y criterio específicos para cada referencia real que falta: '+missingRefs.join(', ')+'. No inventes actividades ni referencias.':'')+strategyRepair ));
      issues = check(material);
    }
    // A complete slide deck must not be discarded solely because the model
    // omitted the strategy metadata. Request only that metadata, and validate
    // it before merging; never synthesize evidence or silently pass validation.
    if(issues.some(x=>x.includes('La estrategia seleccionada no está desarrollada'))&&Date.now()<generationDeadline-6500){
      try{
        const selected=Pedagogy.strategy(estrategiaDidactica);
        const summary=(material.diapositivas||[]).map((d,i)=>({numero:i+1,titulo:d.titulo,contenido:String(Array.isArray(d.contenido)?d.contenido.join(' '):d.contenido||'').slice(0,420)}));
        const repairPrompt='Devuelve SOLO un objeto JSON con planEstrategia. Estrategia obligatoria: '+selected.id+' ('+selected.name+'). Objetivo: '+objetivoAprendizaje+'. Tema: '+temaEspecifico+'. Diapositivas existentes: '+JSON.stringify(summary)+'. Completa los cuatro campos habilidadCentral, aplicacionConcreta, evidenciaEsperada, retroalimentacionDocente con textos específicos y verificables respecto de las diapositivas; no inventes actividades. Forma: {"planEstrategia":{"id":"'+selected.id+'","habilidadCentral":"...","aplicacionConcreta":"...","evidenciaEsperada":"...","retroalimentacionDocente":"..."}}';
        const response=await draft(repairPrompt);
        if(response?.planEstrategia&&typeof response.planEstrategia==='object'){
          const candidate=normalize({...material,planEstrategia:response.planEstrategia});
          const candidateIssues=check(candidate);
          if(candidateIssues.length<issues.length){material=candidate;issues=candidateIssues;}
        }
      }catch(error){console.warn('Reparación puntual de estrategia no disponible:',error.code||'ERROR');}
    }
    if (issues.length) return res.status(422).json({error:'El material no cumple la estructura pedagógica solicitada. Se conserva el documento anterior.',detalle:issues.join('; '),borrador:material});
    material = Pedagogy.finalize(material,plan);
    material.autoriaIA=author;
    material.planGeneracion=plan;
    material.fuentesDocumentales=fuentesDocumentales;
    material.textosEscolaresComplementarios=librosRegulares;material.matrizOATextos=matrizOA;material.planUsoFuentesOA=planUsoFuentes;
    material.referenciasMetalmecanica=referenciasMetalmecanica;
    material.trazabilidadDocumentalTP=TPInternational.documentEvidence(referenciasMetalmecanica,fuentesDocumentales);
    material.planVisualTP=TPInternational.visualPlan(referenciasMetalmecanica,material.trazabilidadDocumentalTP);
    material.controlCalidadTP=TPInternational.qualityReview(material,referenciasMetalmecanica,material.trazabilidadDocumentalTP);
    const evidence=Sources.validateEvidence(material.respaldoDocumental,fuentesDocumentales);
    material.respaldoDocumental=evidence.valid;material.incidenciasDocumentales=evidence.invalid;material.matrizOATextos=OATextbookMatrix.linkActivities(matrizOA,evidence.valid);
    material=Skills.prepare(material,plan,fuentesDocumentales,evidence);
    material=require('../heva-studio.js').link(material,plan);
    material.auditoriaExperimental=require('../experimental/quality-audit.cjs').inspect(material,plan);
    material.auditoriaDisciplinar=require('../experimental/subject-audit.cjs').inspectAll(material,plan);
    material.controlProfundidadHEVA=DeepMaterials.advisory(material,plan);
    // Auditoría adicional del Laboratorio en respuestas reales: informativa, no
    // aprueba contenido disciplinar ni descarta el material que ya pasó HEVA.
    const auditoriaVistaLab=estrategiasLab.length?LabMaterialView.audit(material,tipoMaterial,{
      alternativas:cantidadesEfectivas.cantAlternativas,
      desarrollo:cantidadesEfectivas.cantDesarrollo,
      casos:cantidadesEfectivas.cantCasos
    }):null;
    return res.status(200).json({exito:true,material,revision:{
      alcance:'Estructura, cantidades y trazabilidad; revisión pedagógica docente pendiente',
      tipo:tipoMaterial,estrategia:metadata.estrategiaDidactica,
      laboratorio:estrategiasLab.map(spec=>LabBridge.inspect(spec,material)),
      laboratorioVista:auditoriaVistaLab
    }});

  } catch (error) {
    console.error('Fallo de generación HEVA:',error.code||'ERROR',JSON.stringify(error.proveedores||[]));
    if(error.code==='AI_TIMEOUT'||error.code==='AI_UNAVAILABLE')return res.status(503).json({error:error.code==='AI_TIMEOUT'?'Las IA no respondieron dentro del tiempo disponible.':'Los proveedores de IA no están disponibles.',detalle:'Se conserva tu selección. Los PowerPoint se completan por grupos de diapositivas para reducir el tiempo de cada solicitud.',codigo:error.code,reintentable:true});
    if(error.code==='AI_RATE_LIMIT')return res.status(503).json({error:'Los proveedores de IA están temporalmente saturados.',detalle:'Espera unos minutos y vuelve a intentar. El material anterior permanece disponible.',codigo:error.code,reintentable:true});
    if(error.code?.startsWith('AI_RESPONSE_'))return res.status(502).json({error:'La IA devolvió una respuesta incompleta o con formato inválido.',detalle:'No se pudo recuperar un documento completo. Se conserva el material anterior y tu selección. Puedes volver a generar.',codigo:error.code,reintentable:true});
    return res.status(500).json({
      error: 'Error de IA',
      detalle: String(error.message).replace(/(key=)[^&\s]+/gi,'$1[oculta]')
    });
  }
};


async function ejecutarLlamadaIAPriorizada(...args){return (await call(...args)).value;}
