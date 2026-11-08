// api/generate.js — Motor Multi-IA con Autoselección de Modelos Activos

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
      detalle: 'Configura GROQ_API_KEY o GEMINI_API_KEY en las variables de entorno de Vercel y haz Redeploy.'
    });
  }

  try {
    // 1. Resolver los mejores modelos activos para esta cuenta
    const modeloGroq = GROQ_API_KEY ? await resolverModeloGroq(GROQ_API_KEY) : null;
    const modeloGemini = GEMINI_API_KEY ? await resolverModeloGemini(GEMINI_API_KEY) : null;

    // 2. PLANIFICADOR ANDRAGÓGICO
    const promptPlan = `
Actúa como Diseñador Curricular especialista en EPJA Chile para la Escuela Héctor Valenzuela CEA de Villarrica.
Crea un plan pedagógico andragógico breve para:
Nivel: ${nivel} | Asignatura: ${asignatura} | Marco: ${marcoCurricular}
Tema: ${temaEspecifico} | Objetivo: ${objetivoAprendizaje}
Requerimientos: ${cantAlternativas} alternativas, ${cantDesarrollo} preguntas de desarrollo y ${cantCasos} casos situacionales laborales.

Responde ÚNICAMENTE en formato JSON válido:
{
  "enfoqueAndragogico": "estrategia para adultos",
  "subtemasPermitidos": ["concepto clave 1", "concepto clave 2"],
  "subtemasProhibidos": ["anacronismos de otras unidades"]
}
`;

    const plan = await llamarIAConFallback(promptPlan, GROQ_API_KEY, modeloGroq, GEMINI_API_KEY, modeloGemini);

    // 3. REDACTOR PEDAGÓGICO COMPLETO
    const promptRedactor = `
Eres un destacado profesor de EPJA en la Escuela Héctor Valenzuela CEA de Villarrica, Chile.
Redacta el material pedagógico completo para personas jóvenes y adultas (contexto laboral y formativo).
Plan: ${JSON.stringify(plan)}
Nivel: ${nivel} | Asignatura: ${asignatura} | Tema: ${temaEspecifico}

REGLAS:
- Redacta exactamente ${cantAlternativas} preguntas de selección múltiple con 4 alternativas (A, B, C, D) y su clave correcta.
- Las respuestas correctas deben estar desordenadas al azar (sin patrones como A, B, C, D).
- Redacta exactamente ${cantDesarrollo} preguntas de desarrollo con rúbrica analítica según Decreto 67.
- Redacta ${cantCasos} casos reales cotidianos o laborales de adultos.

Responde ÚNICAMENTE en formato JSON válido con esta estructura:
{
  "titulo": "Título formal del material",
  "introduccionLectura": "Lectura contextualizada completa (mínimo 280 palabras)",
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

// Autodetección del modelo activo de Groq
async function resolverModeloGroq(key) {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (r.ok) {
      const data = await r.json();
      const disponibles = (data.data || []).map(m => m.id);
      // Priorizar los modelos oficiales activos
      const candidatos = [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile'
      ];
      for (const c of candidatos) {
        if (disponibles.includes(c)) return c;
      }
      if (disponibles.length > 0) return disponibles[0];
    }
  } catch (e) {
    console.warn('Error listando modelos Groq:', e.message);
  }
  return 'openai/gpt-oss-120b';
}

// Autodetección del modelo activo de Gemini
async function resolverModeloGemini(key) {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (r.ok) {
      const data = await r.json();
      const modelos = (data.models || []).filter(m => m.supportedGenerationMethods?.includes('generateContent'));
      const candidatos = [
        'models/gemini-2.5-flash',
        'models/gemini-2.0-flash',
        'models/gemini-1.5-flash',
        'models/gemini-1.5-pro'
      ];
      for (const c of candidatos) {
        if (modelos.some(m => m.name === c)) return c.replace('models/', '');
      }
      if (modelos.length > 0) return modelos[0].name.replace('models/', '');
    }
  } catch (e) {
    console.warn('Error listando modelos Gemini:', e.message);
  }
  return 'gemini-2.0-flash';
}

// Orquestador con conmutación por error
async function llamarIAConFallback(prompt, groqKey, modeloGroq, geminiKey, modeloGemini) {
  let bitacoraErrores = [];

  // Intento 1: Groq
  if (groqKey && modeloGroq) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
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
        bitacoraErrores.push(`Groq (${modeloGroq}): ${data.error?.message || resp.statusText}`);
      } else {
        const texto = data.choices[0]?.message?.content;
        return limpiarYParsearJSON(texto);
      }
    } catch (e) {
      bitacoraErrores.push(`Groq conexión: ${e.message}`);
    }
  }

  // Intento 2: Google Gemini
  if (geminiKey && modeloGemini) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modeloGemini}:generateContent?key=${geminiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        bitacoraErrores.push(`Gemini (${modeloGemini}): ${data.error?.message || resp.statusText}`);
      } else {
        const texto = data.candidates[0]?.content?.parts[0]?.text;
        return limpiarYParsearJSON(texto);
      }
    } catch (e) {
      bitacoraErrores.push(`Gemini conexión: ${e.message}`);
    }
  }

  throw new Error(bitacoraErrores.join(' | ') || 'Fallo general de conexión con la IA.');
}

function limpiarYParsearJSON(texto) {
  const limpio = texto.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(limpio);
}
