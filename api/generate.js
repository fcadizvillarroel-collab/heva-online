// api/generate.js — Motor Multi-IA para HEVA Online

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
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
    nivel = 'III_BASICO',
    marcoCurricular = 'DECRETO_257_2009',
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
    return res.status(500).json({
      error: 'Claves no encontradas en Vercel',
      detalle: 'No se detectó GROQ_API_KEY ni GEMINI_API_KEY en las Environment Variables de Vercel.'
    });
  }

  try {
    // AGENTE 1: PLANIFICADOR
    const promptPlan = `
Eres un Diseñador Curricular especialista en EPJA Chile (Escuela Héctor Valenzuela CEA, Villarrica).
Genera un plan de trabajo andragógico para:
Asignatura: ${asignatura} | Nivel: ${nivel} | Tema: ${temaEspecifico} | Objetivo: ${objetivoAprendizaje}
Cantidad alternativas: ${cantAlternativas} | Cantidad desarrollo: ${cantDesarrollo} | Casos: ${cantCasos}

Responde ÚNICAMENTE un JSON con esta estructura exacta:
{
  "enfoque": "andragogía adultos",
  "subtemasPermitidos": ["subtema 1", "subtema 2"],
  "subtemasProhibidos": ["anacronismos o temas de otras unidades"],
  "distribucionClaves": ["A", "B", "C", "D"]
}
`;

    const plan = await ejecutarLlamadaIA(promptPlan, GROQ_API_KEY, GEMINI_API_KEY);

    // AGENTE 2: REDACTOR PEDAGÓGICO
    const promptRedactor = `
Eres un profesor de EPJA en la Escuela Héctor Valenzuela CEA de Villarrica, Chile.
Redacta el material pedagógico completo para adultos trabajadores.
Plan: ${JSON.stringify(plan)}
Asignatura: ${asignatura} | Nivel: ${nivel} | Tema: ${temaEspecifico}
Requisitos:
- Exactamente ${cantAlternativas} preguntas de selección múltiple con 4 opciones (A, B, C, D) y su clave correcta.
- Exactamente ${cantDesarrollo} preguntas de desarrollo con rúbrica según Decreto 67.
- ${cantCasos} casos reales cotidianos o laborales de adultos.

Responde ÚNICAMENTE un JSON con esta estructura exacta:
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

    const material = await ejecutarLlamadaIA(promptRedactor, GROQ_API_KEY, GEMINI_API_KEY);

    return res.status(200).json({
      exito: true,
      material: material
    });

  } catch (error) {
    console.error('Error detallado de IA:', error);
    return res.status(500).json({
      error: 'Error al consultar la IA',
      detalle: error.message
    });
  }
}

// Función con diagnóstico transparente de errores
async function ejecutarLlamadaIA(prompt, groqKey, geminiKey) {
  let errores = [];

  // 1. Probar Groq si está configurado
  if (groqKey) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Responde ÚNICAMENTE con código JSON válido parseable, sin bloques markdown.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        errores.push(`Groq falló (${resp.status}): ${data.error?.message || 'Error de clave o cuota'}`);
      } else {
        const contenido = data.choices[0]?.message?.content;
        return JSON.parse(contenido);
      }
    } catch (e) {
      errores.push(`Groq red: ${e.message}`);
    }
  }

  // 2. Probar Google Gemini (modelo universal gemini-1.5-flash)
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
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
        errores.push(`Gemini falló (${resp.status}): ${data.error?.message || 'Error de clave o cuota'}`);
      } else {
        const texto = data.candidates[0]?.content?.parts[0]?.text;
        return JSON.parse(texto);
      }
    } catch (e) {
      errores.push(`Gemini red: ${e.message}`);
    }
  }

  throw new Error(errores.join(' | ') || 'No se pudo conectar con los proveedores.');
}
