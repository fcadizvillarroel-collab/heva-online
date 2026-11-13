async function call(prompt, openAiKey, geminiKey, groqKey, exclude = []) {
  let errores = [];
  const deadline=Date.now()+48000;

  // 1. ChatGPT (OpenAI - si está configurado)
  if (openAiKey && !exclude.includes('openai')) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(Math.max(1,Math.min(20000,deadline-Date.now()))),
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
        return {value:JSON.parse(data.choices[0].message.content),provider:'openai',model:'gpt-4o-mini'};
      } else {
        errores.push(`ChatGPT: ${data.error?.message || resp.statusText}`);
      }
    } catch (e) {
      errores.push(`ChatGPT: ${e.message}`);
    }
  }

  // 2. Google Gemini (Motor Principal Gratuito)
  if (geminiKey && !exclude.includes('gemini')) {
    const modelosGemini = [(process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim()];
    for (const mod of modelosGemini) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${geminiKey}`;
        const resp = await fetch(url, {
          method: 'POST', signal: AbortSignal.timeout(Math.max(1,Math.min(20000,deadline-Date.now()))),
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
          return {value:limpiarYParsearJSON(texto),provider:'gemini',model:mod};
        } else {
          errores.push(`Gemini (${mod}): ${data.error?.message || resp.statusText}`);
        }
      } catch (e) {
        errores.push(`Gemini (${mod}) red: ${e.message}`);
      }
    }
  }

  // 3. Groq (Respaldo)
  if (groqKey && !exclude.includes('groq')) {
    const modelosGroq = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'];
    for (const mod of modelosGroq) {
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST', signal: AbortSignal.timeout(Math.max(1,Math.min(20000,deadline-Date.now()))),
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
          return {value:JSON.parse(data.choices[0].message.content),provider:'groq',model:mod};
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

module.exports={call};
