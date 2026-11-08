// api/generate.js — Motor Multi-IA con Aislamiento Curricular y Adecuaciones PIE (Dec. 83)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilice POST.' });
  }

  const {
    asignatura = 'Estudios Sociales',
    nivel = 'III NIVEL BÁSICO',
    marcoCurricular = 'Decreto Supremo N° 257/2009 EPJA',
    objetivoAprendizaje = '',
    temaEspecifico = '',
    estrategiaDidactica = 'Estudio de casos reales',
    adecuacionesPIE = [],
    tipoMaterial = 'GUIA',
    cantAlternativas = 6,
    cantDesarrollo = 2,
    cantCasos = 2
  } = req.body || {};

  const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
  const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

  if (!GROQ_API_KEY && !GEMINI_API_KEY) {
    return res.status(400).json({
      error: 'Claves no detectadas',
      detalle: 'Configura GROQ_API_KEY o GEMINI_API_KEY en las variables de entorno de Vercel.'
    });
  }

  try {
    const modeloGroq = GROQ_API_KEY ? await resolverModeloGroq(GROQ_API_KEY) : null;
    const modeloGemini = GEMINI_API_KEY ? await resolverModeloGemini(GEMINI_API_KEY) : null;

    // CANDADO DE AISLAMIENTO: Reglas disciplinarias por asignatura
    let directrizAislamiento = `
CANDADO DISCIPLINAR ESTRICTO:
El material pertenece EXCLUSIVAMENTE a la asignatura: "${asignatura}".
QUEDA PROHIBIDO mezclar contenidos de otras asignaturas o periodos históricos ajenos.
`;

    if (asignatura.includes('Consumo')) {
      directrizAislamiento += `
- Foco obligatorio: Derechos del consumidor (SERNAC), presupuesto familiar, endeudamiento responsable, etiquetado de alimentos (Sellos Ley 20.606), servicios básicos domiciliarios y sustentabilidad.
- PROHIBIDO hablar de historia bélica, álgebra abstracta o literatura ajena.
`;
    } else if (asignatura.includes('Inserción Laboral') || asignatura.includes('Empleabilidad')) {
      directrizAislamiento += `
- Foco obligatorio: Código del Trabajo en Chile, contratos laborales, liquidaciones de sueldo (descuentos AFP/Fonasa), finiquitos, Ley 16.744 de accidentes del trabajo, Curriculum Vitae y entrevistas.
- PROHIBIDO tratar temas no vinculados al ámbito laboral y previsional chileno.
`;
    } else if (asignatura.includes('Convivencia') || asignatura.includes('Responsabilidad Personal')) {
      directrizAislamiento += `
- Foco obligatorio: Convivencia democrática, resolución pacífica de conflictos, Derechos Humanos en Chile, proyecto de vida y habilidades sociolaborales.
`;
    } else if (asignatura.includes('Construcciones Metálicas')) {
      directrizAislamiento += `
- Foco obligatorio: Procesos de soldadura (SMAW, MIG-MAG, TIG), trazado, corte de perfiles de acero, normas AWS, seguridad en taller y cubicación de materiales técnicos.
`;
    }

    const directrizPIE = adecuacionesPIE.length > 0
      ? `ADECUACIONES CURRICULARES PIE (DECRETO 83/2015 OBLIGATORIAS):\n- ${adecuacionesPIE.join('\n- ')}\nAdapta la lectura y preguntas con oraciones claras, evitando sobrecarga cognitiva sin infantilizar al estudiante adulto.`
      : 'Enfoque DUA estándar para adultos.';

    // AGENTE 1: PLANIFICADOR
    const promptPlan = `
Eres Diseñador Curricular Senior de EPJA Chile (Escuela Héctor Valenzuela CEA, Villarrica).
Nivel: ${nivel} | Asignatura: ${asignatura} | Marco: ${marcoCurricular}
Tema: ${temaEspecifico} | Objetivo: ${objetivoAprendizaje}
Estrategia Didáctica: ${estrategiaDidactica}
${directrizAislamiento}
${directrizPIE}

Responde ÚNICAMENTE un JSON válido:
{
  "enfoque": "andragogía adultos",
  "subtemasPermitidos": ["concepto clave 1", "concepto clave 2"],
  "subtemasProhibidos": ["temas de otras asignaturas que quedan estrictamente fuera"]
}
`;

    const plan = await llamarIAConFallback(promptPlan, GROQ_API_KEY, modeloGroq, GEMINI_API_KEY, modeloGemini);

    // AGENTE 2: REDACTOR
    const promptRedactor = `
Eres un profesor de la Escuela Héctor Valenzuela CEA de Villarrica, Chile.
Redacta el material pedagógico completo y profesional para adultos.
Plan: ${JSON.stringify(plan)}
Asignatura: ${asignatura} | Nivel: ${nivel} | Tema: ${temaEspecifico}
Estrategia Didáctica obligatoria: ${estrategiaDidactica}
${directrizAislamiento}
${directrizPIE}

REGLAS OBLIGATORIAS:
- Exactamente ${cantAlternativas} preguntas de selección múltiple con 4 alternativas (A, B, C, D) y clave justificada.
- ORDEN ALEATORIO: Prohibido que las claves sigan secuencias lineales (A, B, C, D) o patrones previsibles. Distribúyelas al azar de forma equilibrada.
- Exactamente ${cantDesarrollo} preguntas de desarrollo con rúbrica según Decreto 67.
- ${cantCasos} casos reales cotidianos o laborales de adultos.

Responde ÚNICAMENTE un JSON válido:
{
  "titulo": "Título profesional del material",
  "introduccionLectura": "Texto de lectura contextualizada completo (mínimo 280 palabras)",
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
      "claveCorrecta": "A",
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
  ]
}
`;

    const material = await llamarIAConFallback(promptRedactor, GROQ_API_KEY, modeloGroq, GEMINI_API_KEY, modeloGemini);

    return res.status(200).json({
      exito: true,
      material: material
    });

  } catch (error) {
    console.error('Error detallado:', error);
    return res.status(500).json({
      error: 'Error de IA',
      detalle: error.message
    });
  }
};

async function resolverModeloGroq(key) {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
    if (r.ok) {
      const data = await r.json();
      const disponibles = (data.data || []).map(m => m.id);
      const candidatos = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
      for (const c of candidatos) { if (disponibles.includes(c)) return c; }
      if (disponibles.length > 0) return disponibles[0];
    }
  } catch (e) { console.warn(e.message); }
  return 'openai/gpt-oss-120b';
}

async function resolverModeloGemini(key) {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (r.ok) {
      const data = await r.json();
      const modelos = (data.models || []).filter(m => m.supportedGenerationMethods?.includes('generateContent'));
      const candidatos = ['models/gemini-2.5-flash', 'models/gemini-2.0-flash', 'models/gemini-1.5-flash', 'models/gemini-1.5-pro'];
      for (const c of candidatos) { if (modelos.some(m => m.name === c)) return c.replace('models/', ''); }
      if (modelos.length > 0) return modelos[0].name.replace('models/', '');
    }
  } catch (e) { console.warn(e.message); }
  return 'gemini-2.0-flash';
}

async function llamarIAConFallback(prompt, groqKey, modeloGroq, geminiKey, modeloGemini) {
  let errores = [];

  if (groqKey && modeloGroq) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modeloGroq,
          messages: [
            { role: 'system', content: 'Responde exclusivamente con código JSON válido parseable, sin explicaciones ni markdown.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        errores.push(`Groq (${modeloGroq}): ${data.error?.message || resp.statusText}`);
      } else {
        return limpiarYParsearJSON(data.choices[0]?.message?.content);
      }
    } catch (e) { errores.push(`Groq conexión: ${e.message}`); }
  }

  if (geminiKey && modeloGemini) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modeloGemini}:generateContent?key=${geminiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        errores.push(`Gemini (${modeloGemini}): ${data.error?.message || resp.statusText}`);
      } else {
        return limpiarYParsearJSON(data.candidates[0]?.content?.parts[0]?.text);
      }
    } catch (e) { errores.push(`Gemini conexión: ${e.message}`); }
  }

  throw new Error(errores.join(' | ') || 'Fallo general de conexión.');
}

function limpiarYParsearJSON(texto) {
  const limpio = texto.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(limpio);
}
