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

  const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').trim();
  const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
  const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();

  if (!OPENAI_API_KEY && !GEMINI_API_KEY && !GROQ_API_KEY) {
    return res.status(400).json({
      error: 'Claves no detectadas',
      detalle: 'Configura OPENAI_API_KEY o GEMINI_API_KEY en las Environment Variables de Vercel.'
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

    // CASO 4: GENERADOR CURRICULAR COMPLETO Y TRANSFORMADOR BRISK
    const esMateriaLaboral = asignatura.includes('Inserción') || asignatura.includes('Empleabilidad') || asignatura.includes('Construcciones') || asignatura.includes('Oficio');
    
    let reglaEnfoque = `
RIGOR DISCIPLINAR ESTRICTO:
- La asignatura es "${asignatura}". Desarrolla en profundidad el tema: "${temaEspecifico}" y el Objetivo: "${objetivoAprendizaje}".
- Estrategia Didáctica Obligatoria: "${estrategiaDidactica}".
`;

    if (textoReferencia && textoReferencia.trim().length > 25) {
      reglaEnfoque += `
CANDADO RAG DE TRANSFORMACIÓN (ESTILO BRISK TEACHING):
El docente aportó este material base obligatorio:
"""${textoReferencia.trim()}"""
Debes basar la lectura y las preguntas EXCLUSIVAMENTE en este contenido. Prohibido inventar datos ajenos.
`;
    } else if (!esMateriaLaboral) {
      reglaEnfoque += `
- PROHIBIDO FORZAR TEMAS DE CONTRATOS O LEYES LABORALES. Trata los contenidos con rigor académico propio de la materia (histórico, científico, matemático o literario).
`;
    }

    if (instruccionesDocente && instruccionesDocente.trim().length > 5) {
      reglaEnfoque += `\nINSTRUCCIONES Y TONO DEL DOCENTE:\n${instruccionesDocente.trim()}\n`;
    }

    const reglaPIE = adecuacionesPIE.length > 0
      ? `ADECUACIONES PIE (DECRETO 83/2015):\n- ${adecuacionesPIE.join('\n- ')}\nAdapta la redacción a lectura clara sin infantilizar.`
      : 'Enfoque andragógico respetuoso.';

    const promptRedactor = `
Eres un profesor de excelencia en la Escuela Héctor Valenzuela CEA de Villarrica, Chile.
Redacta un material pedagógico completo, formal, motivador y con prosa rica y atractiva para adultos.
Nivel: ${nivel} | Asignatura: ${asignatura} | Marco: ${marcoCurricular}
${reglaEnfoque}
${reglaPIE}

REQUISITOS OBLIGATORIOS:
1. Exactamente ${cantAlternativas} preguntas de selección múltiple (A, B, C, D) con claves desordenadas al azar (prohibido patrones A, B, C, D).
2. Exactamente ${cantDesarrollo} preguntas de desarrollo con rúbrica según Decreto 67.
3. ${cantCasos} situaciones de lectura o análisis contextualizadas.
4. ${tipoMaterial === 'TALLER' ? 'Incluye una "listaCotejoTP" con 4 a 5 indicadores técnicos y de seguridad observables.' : ''}
5. ${incluirTicketSalida ? 'Incluye un "ticketSalida" con 2 preguntas breves de metacognición/cierre.' : ''}

Responde ÚNICAMENTE en JSON válido:
{
  "titulo": "Título formal del material",
  "introduccionLectura": "Texto de lectura completo, bien redactado y formativo (mínimo 280 palabras)",
  "casosEstudio": [
    { "id": 1, "titulo": "...", "contextoReal": "...", "preguntaReflexion": "..." }
  ],
  "preguntasAlternativas": [
    {
      "numero": 1,
      "enunciado": "...",
      "alternativas": [
        { "letra": "A", "texto": "..." },
        { "letra": "B", "texto": "..." },
        { "letra": "C", "texto": "..." },
        { "letra": "D", "texto": "..." }
      ],
      "claveCorrecta": "C",
      "habilidad": "Localizar",
      "justificacion": "..."
    }
  ],
  "preguntasDesarrollo": [
    {
      "numero": 1,
      "enunciado": "...",
      "habilidad": "Reflexionar",
      "criterioEvaluacion": "Logrado (3 pts): ..., Medianamente Logrado (2 pts): ..., Por Lograr (1 pto): ..."
    }
  ],
  "listaCotejoTP": [
    { "criterio": "Seguridad y EPP", "indicador": "Aplica normas de protección personal en taller..." },
    { "criterio": "Precisión Técnica", "indicador": "Ejecuta uniones y medidas según tolerancia..." }
  ],
  "ticketSalida": {
    "pregunta1": "¿Cuál es la idea central comprendida en la sesión?",
    "pregunta2": "¿Cómo aplicarías este conocimiento en tu vida o entorno?"
  }
}
`;

    const material = await ejecutarLlamadaIAPriorizada(promptRedactor, OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY);

    return res.status(200).json({
      exito: true,
      material: material
    });

  } catch (error) {
    console.error('Error en proceso:', error);
    return res.status(500).json({
      error: 'Error de IA',
      detalle: error.message
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
    const modelosGemini = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];
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
