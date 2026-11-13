const Pedagogy = require('../heva-pedagogy.js');
const HEVA = require('../heva-core.js');
// api/generate.js — Motor Multi-IA Suite: ChatGPT / Gemini con Prosa Andragógica y RAG

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Utilice POST.' });

  const {
    modoHerramienta = 'GENERADOR_ESTANDAR', // 'GENERADOR_ESTANDAR', 'DIFERENCIADOR_DIFFIT', 'REMEDIACION_ESCOLAR', 'REGENERAR_PREGUNTA'
    asignatura = 'Estudios Sociales',
    nivel = 'III NIVEL BÁSICO',
    marcoCurricular = 'Decreto Supremo N° 257/2009 EPJA',
    objetivoAprendizaje = '',
    temaEspecifico = '',
    estrategiaDidactica = 'Análisis de contenido disciplinar formativo',
    instruccionesDocente = '',
    textoReferencia = '',
    adecuacionesPIE = [],
    tipoMaterial = 'GUIA',
    cantAlternativas = 6,
    cantDesarrollo = 2,
    cantCasos = 2,
    incluirTicketSalida = true,
    preguntaARegenerar = null
  } = req.body || {};

  for (const [name,value,max] of [['cantAlternativas',cantAlternativas,20],['cantDesarrollo',cantDesarrollo,10],['cantCasos',cantCasos,4]]) {
    if (!Number.isInteger(value) || value < 0 || value > max) return res.status(400).json({error:`${name} debe estar entre 0 y ${max}`});
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
    const plan = {asignatura,nivel,marcoCurricular,objetivoAprendizaje,temaEspecifico,estrategiaDidactica,instruccionesDocente,textoReferencia,adecuacionesPIE,tipoMaterial,cantAlternativas,cantDesarrollo,cantCasos,incluirTicketSalida};
    const promptRedactor = Pedagogy.prompt(plan);
    const metadata = {objetivoAprendizaje,asignatura,nivel,marcoCurricular,temaEspecifico,tipoMaterial,estrategiaDidactica:Pedagogy.strategy(estrategiaDidactica).name};
    const normalize = raw => HEVA.material(raw,metadata);
    const check = m => [...HEVA.validate(m,{cantAlternativas,cantDesarrollo,cantCasos}),...Pedagogy.validate(m,plan)];
    let material = normalize(await ejecutarLlamadaIAPriorizada(promptRedactor,OPENAI_API_KEY,GEMINI_API_KEY,GROQ_API_KEY));
    let issues = check(material);
    if (issues.length) {
      material = normalize(await ejecutarLlamadaIAPriorizada(promptRedactor+'\nCORRIGE LA RESPUESTA COMPLETA. Se detectaron estas incidencias: '+issues.join('; '),OPENAI_API_KEY,GEMINI_API_KEY,GROQ_API_KEY));
      issues = check(material);
    }
    if (issues.length) return res.status(422).json({error:'El material no cumple la estructura pedagógica solicitada. Se conserva el documento anterior.',detalle:issues.join('; '),borrador:material});
    material = Pedagogy.finalize(material,plan);
    return res.status(200).json({exito:true,material,revision:{alcance:'Estructura, cantidades y trazabilidad; revisión pedagógica docente pendiente',tipo:tipoMaterial,estrategia:metadata.estrategiaDidactica}});

  } catch (error) {
    console.error('Error en proceso:', error);
    return res.status(500).json({
      error: 'Error de IA',
      detalle: String(error.message).replace(/(key=)[^&\s]+/gi,'$1[oculta]')
    });
  }
};

async function ejecutarLlamadaIAPriorizada(prompt, openAiKey, geminiKey, groqKey) {
  let errores = [];

  // 1. ChatGPT (OpenAI - si está configurado)
  if (openAiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Eres un diseñador pedagógico senior para el sistema escolar chileno EPJA. Escribe con prosa andragógica de alta calidad, empática e intelectualmente desafiante para adultos. Responde estrictamente en formato JSON válido.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5
        })
      });

      const data = await resp.json();
      if (resp.ok && data.choices?.[0]?.message?.content) {
        return JSON.parse(data.choices[0].message.content);
      } else {
        errores.push(`ChatGPT: ${data.error?.message || resp.statusText}`);
      }
    } catch (e) {
      errores.push(`ChatGPT: ${e.message}`);
    }
  }

  // 2. Google Gemini (Motor Principal Gratuito)
  if (geminiKey) {
    const modelosGemini = [(process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim()];
    for (const mod of modelosGemini) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${geminiKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
              responseMimeType: 'application/json'
            }
          })
        });

        const data = await resp.json();
        if (resp.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          const texto = data.candidates[0].content.parts[0].text;
          return limpiarYParsearJSON(texto);
        } else {
          errores.push(`Gemini (${mod}): ${data.error?.message || resp.statusText}`);
        }
      } catch (e) {
        errores.push(`Gemini (${mod}) red: ${e.message}`);
      }
    }
  }

  // 3. Groq (Respaldo)
  if (groqKey) {
    const modelosGroq = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'];
    for (const mod of modelosGroq) {
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: mod,
            messages: [{ role: 'system', content: 'Responde exclusivamente con JSON válido.' }, { role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.4
          })
        });

        const data = await resp.json();
        if (resp.ok && data.choices?.[0]?.message?.content) {
          return JSON.parse(data.choices[0].message.content);
        }
      } catch (e) {
        errores.push(`Groq (${mod}): ${e.message}`);
      }
    }
  }

  throw new Error(errores.join(' | ') || 'Fallo general de conexión.');
}

function limpiarYParsearJSON(texto) {
  const limpio = texto.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(limpio);
}
