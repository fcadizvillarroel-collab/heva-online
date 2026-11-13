const {parseAIJSON}=require('./_ai-json.cjs');
async function call(prompt, openAiKey, geminiKey, groqKey, exclude = [], options = {}) {
  let errores = [];
  const deadline=Math.min(Date.now()+48000,options.deadline||Infinity);
  const responseErrors=[];
  let rateLimited=false,retryAfter=0;const providerStatus=[];
  const track=(resp,provider)=>{if(!resp.ok)providerStatus.push({proveedor:provider,estadoHTTP:resp.status});if(resp.status===429){rateLimited=true;const seconds=Number(resp.headers?.get?.('retry-after'));if(Number.isFinite(seconds))retryAfter=Math.max(retryAfter,Math.min(3600,Math.ceil(seconds)));}};
  const remember=e=>{if(e?.code?.startsWith('AI_RESPONSE_'))responseErrors.push(e.code);};

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

      track(resp,'openai');const data = await resp.json();
      if (resp.ok && data.choices?.[0]?.message?.content) {
        return {value:parseAIJSON(data.choices[0].message.content,data.choices[0].finish_reason),provider:'openai',model:'gpt-4o-mini'};
      } else {
        errores.push(`ChatGPT: ${data.error?.message || resp.statusText}`);
      }
    } catch (e) {
      remember(e);
      errores.push(`ChatGPT: ${e.message}`);
    }
  }

  // 2. Google Gemini (Motor Principal Gratuito)
  if (geminiKey && !exclude.includes('gemini')) {
    const modelosGemini = [...new Set([(process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim(),'gemini-3.1-flash-lite'])];
    for (const mod of modelosGemini) {
     let tryNextModel=false;
     for(let attempt=0;attempt<2&&deadline-Date.now()>1500;attempt++){
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${geminiKey}`;
        const resp = await fetch(url, {
          method: 'POST', signal: AbortSignal.timeout(Math.max(1,Math.min(20000,deadline-Date.now()))),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt+(attempt?'\nREINTENTO: entrega el documento COMPLETO como un solo objeto JSON válido, sin comas finales, comentarios ni texto fuera del JSON. Conserva objetivo, secciones y cantidades solicitadas.':'') }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: options.maxOutputTokens || 16384,
              responseMimeType: 'application/json'
            }
          })
        });

        track(resp,'gemini');const data = await resp.json();
        const candidate=data.candidates?.[0];
        if(resp.ok&&candidate?.content?.parts){
          const texto=candidate.content.parts.filter(p=>typeof p.text==='string'&&!p.thought).map(p=>p.text).join('');
          return {value:parseAIJSON(texto,candidate.finishReason),provider:'gemini',model:mod};
        }
        tryNextModel=[404,429,500,502,503,504].includes(resp.status);errores.push('Gemini: proveedor no disponible ('+resp.status+').');break;
      } catch(e){
        remember(e);errores.push('Gemini: '+(e.code||'conexión no disponible'));
        if(e.code?.startsWith('AI_RESPONSE_')){tryNextModel=true;break;}
        tryNextModel=true;break;
      }
     }
     if(!tryNextModel)break;
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
            max_completion_tokens: options.maxOutputTokens || 8192,
            ...(mod.startsWith('openai/gpt-oss')?{reasoning_effort:'low'}:{}),
            temperature: 0.4
          })
        });

        track(resp,'groq');const data = await resp.json();
        if (resp.ok && data.choices?.[0]?.message?.content) {
          return {value:parseAIJSON(data.choices[0].message.content,data.choices[0].finish_reason),provider:'groq',model:mod};
        }
        errores.push('Groq ('+mod+'): proveedor no disponible ('+resp.status+').');
      } catch (e) {
        remember(e);
        errores.push(`Groq (${mod}): ${e.message}`);
      }
    }
  }

  const error=new Error(responseErrors.length?'La IA no logró devolver un documento completo y válido.':'No se pudo obtener respuesta de los proveedores habilitados.');
  error.retryAfter=retryAfter;error.proveedores=providerStatus;
  error.code=rateLimited&&!responseErrors.length?'AI_RATE_LIMIT':responseErrors.includes('AI_RESPONSE_INCOMPLETE')?'AI_RESPONSE_INCOMPLETE':responseErrors.length?'AI_RESPONSE_INVALID':'AI_UNAVAILABLE';
  throw error;
}

module.exports={call};
