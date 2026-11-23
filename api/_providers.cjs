const {parseAIJSON}=require('./_ai-json.cjs');
async function call(prompt, openAiKey, geminiKey, groqKey, exclude = [], options = {}) {
  let errores = [];
  const deadline=Math.min(Date.now()+48000,options.deadline||Infinity);
  const responseErrors=[];
  let rateLimited=false,retryAfter=0,timedOut=false;const providerStatus=[];
  const track=(resp,provider)=>{if(!resp.ok)providerStatus.push({proveedor:provider,estadoHTTP:resp.status});if(resp.status===429){rateLimited=true;const seconds=Number(resp.headers?.get?.('retry-after'));if(Number.isFinite(seconds))retryAfter=Math.max(retryAfter,Math.min(3600,Math.ceil(seconds)));}};
  const timeoutFor=provider=>{const remaining=deadline-Date.now();const reserve=provider==='gemini'&&groqKey&&!exclude.includes('groq')?14000:0;return Math.max(1,Math.min(provider==='gemini'&&reserve?12000:20000,remaining-reserve));};
  const remember=(e,provider)=>{if(e?.name==='TimeoutError'||e?.name==='AbortError'){timedOut=true;providerStatus.push({proveedor:provider,estado:'tiempo_agotado'});}if(String(e?.code||'').startsWith('AI_RESPONSE_')){responseErrors.push(e.code);providerStatus.push({proveedor:provider,estado:e.code});}};

  // 1. ChatGPT (OpenAI - si está configurado)
  if (process.env.ALLOW_PAID_AI === 'true' && openAiKey && !exclude.includes('openai')) {
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(timeoutFor('openai')),
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
      remember(e,'openai');
      errores.push(`ChatGPT: ${e.message}`);
    }
  }

  // 2. Google Gemini (Motor Principal Gratuito)
  if (geminiKey && !exclude.includes('gemini')) {
    const modelosGemini = [...new Set([(process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim(),'gemini-3.1-flash-lite'])];
    for (const mod of modelosGemini) {
     let tryNextModel=false;
     for(let attempt=0;attempt<2&&deadline-Date.now()>(groqKey&&!exclude.includes('groq')?15500:1500);attempt++){
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent`;
        const resp = await fetch(url, {
          method: 'POST', signal: AbortSignal.timeout(timeoutFor('gemini')),
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
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
        // A 429 generally consumes the shared free-account quota, regardless of model.
        // Try other Gemini models for 404 or transient server failures only.
        tryNextModel=[404,500,502,503,504].includes(resp.status);errores.push('Gemini: proveedor no disponible ('+resp.status+').');break;
      } catch(e){
        remember(e,'gemini');errores.push('Gemini: '+(e.code||'conexión no disponible'));
        if(String(e?.code||'').startsWith('AI_RESPONSE_')){
          if(attempt===0 && deadline-Date.now()>4000)continue;
          // A malformed but successful response must not trigger a different model;
          // retry the same model once, then use the independent provider.
          tryNextModel=false;break;
        }
        tryNextModel=true;break;
      }
     }
     if(!tryNextModel)break;
    }
  }

  // 3. Groq (respaldo). On 413 retry *once* with a genuinely shorter,
  // caller-authorized prompt for simple tasks; never repeat the oversized text.
  if (groqKey && !exclude.includes('groq')) {
    const modelosGroq = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant'];
    const primary=options.fallbackPrompt||prompt;
    const shorter=typeof options.oversizePrompt==='string'?options.oversizePrompt:'';
    const canShrink=shorter.length>=300&&shorter.length<primary.length*0.85;
    let stopped=false;
    for (const mod of modelosGroq) {
      if(deadline-Date.now()<=1500)break;
      for(let attempt=0;attempt<(canShrink?2:1);attempt++){
        if(deadline-Date.now()<=1500)break;
        try {
          const sendPrompt=attempt===0?primary:shorter;
          const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST', signal: AbortSignal.timeout(timeoutFor('groq')),
            headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: mod,
              messages: [{ role: 'system', content: 'Responde exclusivamente con JSON válido.' }, { role: 'user', content: sendPrompt }],
              response_format: { type: 'json_object' },
              max_completion_tokens: attempt===1?(options.oversizeMaxOutputTokens||6000):(options.fallbackMaxOutputTokens || options.maxOutputTokens || 8192),
              ...(mod.startsWith('openai/gpt-oss')?{reasoning_effort:'low'}:{}),
              temperature: 0.4
            })
          });
          track(resp,'groq');const data = await resp.json();
          if (resp.ok && data.choices?.[0]?.message?.content) {
            return {value:parseAIJSON(data.choices[0].message.content,data.choices[0].finish_reason),provider:'groq',model:mod};
          }
          errores.push('Groq ('+mod+'): proveedor no disponible ('+resp.status+').');
          if(resp.status===413&&attempt===0&&canShrink&&deadline-Date.now()>5000)continue;
          // Quota and credential failures are account-wide; repeated calls
          // cannot repair them, even if another model ID is available.
          if([413,429,401,403].includes(resp.status))stopped=true;
          // 404 may identify a retired model; try a different model only.
          break;
        } catch(e){
          remember(e,'groq');errores.push('Groq ('+mod+'): '+(e.code||e.message));break;
        }
      }
      if(stopped)break;
    }
  }

  const error=new Error(responseErrors.length?'La IA no logró devolver un documento completo y válido.':'No se pudo obtener respuesta de los proveedores habilitados.');
  error.retryAfter=retryAfter;error.proveedores=providerStatus;
  error.code=providerStatus.some(s=>s.estadoHTTP===413)?'AI_REQUEST_TOO_LARGE':rateLimited&&!responseErrors.length?'AI_RATE_LIMIT':responseErrors.includes('AI_RESPONSE_INCOMPLETE')?'AI_RESPONSE_INCOMPLETE':responseErrors.length?'AI_RESPONSE_INVALID':timedOut?'AI_TIMEOUT':'AI_UNAVAILABLE';
  throw error;
}

module.exports={call};
