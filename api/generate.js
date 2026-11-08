// api/generate.js — Motor Multi-IA con prioridad Gemini / ChatGPT y rigor disciplinar estricto

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
    estrategiaDidactica = 'Análisis de contenido disciplinar formativo',
    adecuacionesPIE = [],
    tipoMaterial = 'GUIA',
    cantAlternativas = 6,
    cantDesarrollo = 2,
    cantCasos = 2
  } = req.body || {};

  const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').trim();
  const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
  const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();

  if (!OPENAI_API_KEY && !GEMINI_API_KEY && !GROQ_API_KEY) {
    return res.status(400).json({
      error: 'Claves no detectadas',
      detalle: 'Configura GEMINI_API_KEY en las variables de entorno de Vercel.'
    });
  }

  try {
    // CANDADO DE ENFOQUE DISCIPLINAR GENERAL
    const esMateriaLaboral = asignatura.includes('Inserción') || asignatura.includes('Empleabilidad') || asignatura.includes('Construcciones') || asignatura.includes('Oficio');
    
    let reglaEnfoque = `
REGLA ESTRICTA DE ENFOQUE DISCIPLINAR:
- Céntrate 100% en el contenido académico y formativo propio de la asignatura: "${asignatura}".
- El texto, los casos y las preguntas deben desarrollar directamente el Objetivo de Aprendizaje: "${objetivoAprendizaje}" y el tema: "${temaEspecifico}".
`;

    if (!esMateriaLaboral) {
      reglaEnfoque += `
- PROHIBIDO FORZAR TEMAS DE INSERCIÓN LABORAL, CONTRATOS O LEYES DE TRABAJO. Si la materia es Historia/Estudios Sociales, aborda los hechos y procesos históricos (ej: Segunda Guerra Mundial, civilizaciones, geografía); si es Ciencias, explica los fenómenos naturales; si es Lenguaje, la comprensión lectora; si es Matemática, la resolución de problemas.
- Los casos y lecturas deben ser de carácter formativo general y cultural, adecuados para adultos, sin inventar contextos laborales si el objetivo no los contempla.
`;
    }

    const reglaPIE = adecuacionesPIE.length > 0
      ? `ADECUACIONES PIE (DECRETO 83/2015):\n- ${adecuacionesPIE.join('\n- ')}\nAdapta la redacción a lectura clara sin sobrecarga cognitiva.`
      : 'Enfoque andragógico estándar.';

    // AGENTE 1: PLANIFICADOR DISCIPLINAR
    const promptPlan = `
Eres Diseñador Curricular Senior de EPJA Chile (Escuela Héctor Valenzuela CEA, Villarrica).
Planifica el material pedagógico para:
Asignatura: ${asignatura} | Nivel: ${nivel} | Marco: ${marcoCurricular}
Tema: ${temaEspecifico} | Objetivo: ${objetivoAprendizaje}
Estrategia: ${estrategiaDidactica}
${reglaEnfoque}
${reglaPIE}

Responde ÚNICAMENTE un JSON válido:
{
  "enfoqueDisciplinar": "descripción del tratamiento temático",
  "subtemasPermitidos": ["concepto central 1", "concepto central 2"],
  "subtemasProhibidos": ["desvíos temáticos o elementos ajenos a este objetivo"]
}
`;

    const plan = await ejecutarLlamadaIAPriorizada(promptPlan, OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY);

    // AGENTE 2: REDACTOR DE CONTENIDO
    const promptRedactor = `
Eres un docente destacado de la Escuela Héctor Valenzuela CEA de Villarrica, Chile.
Redacta el material pedagógico completo y profesional.
Plan: ${JSON.stringify(plan)}
Asignatura: ${asignatura} | Nivel: ${nivel} | Tema: ${temaEspecifico}
Estrategia obligatoria: ${estrategiaDidactica}
${reglaEnfoque}
${reglaPIE}

REGLAS OBLIGATORIAS:
- Exactamente ${cantAlternativas} preguntas de selección múltiple con 4 opciones (A, B, C, D) y clave justificada.
- ORDEN ALEATORIO: Las claves de respuestas NO deben seguir secuencias predecibles (A, B, C, D ni nada lineal). Distribúyelas de forma equilibrada y al azar.
- Exactamente ${cantDesarrollo} preguntas de desarrollo reflexivo con pauta analítica según Decreto 67.
- ${cantCasos} situaciones de lectura o análisis contextualizado pertinentes al tema.
- No dejes textos incompletos.

Responde ÚNICAMENTE en JSON válido con esta estructura:
{
  "titulo": "Título formal del material",
  "introduccionLectura": "Texto de lectura completo y formativo (mínimo 280 palabras)",
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

// Prioridad: 1° ChatGPT (si existe clave), 2° Gemini (Gratis), 3° Groq
async function ejecutarLlamadaIAPriorizada(prompt, openAiKey, geminiKey, groqKey) {
  let errores = [];

  // PRIORIDAD 1: ChatGPT (OpenAI - solo si tienes clave configurada)
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
            { role: 'system', content: 'Eres un diseñador pedagógico experto para el sistema escolar chileno EPJA. Responde estrictamente en formato JSON válido sin bloques markdown.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        errores.push(`ChatGPT (${resp.status}): ${data.error?.message || resp.statusText}`);
      } else {
        const contenido = data.choices[0]?.message?.content;
        return JSON.parse(contenido);
      }
    } catch (e) {
      errores.push(`ChatGPT conexión: ${e.message}`);
    }
  }

  // PRIORIDAD 2: Google Gemini (Motor Principal Gratuito)
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
              temperature: 0.2,
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

  // PRIORIDAD 3: Groq (como respaldo)
  if (groqKey) {
    const modelosGroq = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'];
    for (const mod of modelosGroq) {
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: mod,
            messages: [
              { role: 'system', content: 'Responde exclusivamente con código JSON válido parseable.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2
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

  throw new Error(errores.join(' | ') || 'No se pudo conectar con los proveedores de IA.');
}

function limpiarYParsearJSON(texto) {
  const limpio = texto.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(limpio);
}
