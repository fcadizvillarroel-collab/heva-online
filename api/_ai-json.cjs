function failure(code){const e=new Error(code==='AI_RESPONSE_INCOMPLETE'?'La IA no terminó el documento.':'La IA no devolvió un documento JSON válido.');e.code=code;return e;}
// Solo elimina comas finales fuera de cadenas. Nunca agrega contenido ni cierra un JSON truncado.
function withoutTrailingCommas(text){let out='',quoted=false,escaped=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){out+=c;if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue}if(c==='"'){quoted=true;out+=c;continue}if(c===','){let j=i+1;while(/\s/.test(text[j]||'')&&j<text.length)j++;if(text[j]===']'||text[j]==='}')continue}out+=c;}return out;}
function parseAIJSON(text,finishReason){
 if(finishReason&&!['STOP','stop','FINISH_REASON_UNSPECIFIED'].includes(finishReason))throw failure('AI_RESPONSE_INCOMPLETE');
 if(typeof text!=='string'||text.length>500000)throw failure('AI_RESPONSE_INVALID');
 const clean=text.replace(/^\uFEFF/,'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
 let value;try{value=JSON.parse(clean)}catch{try{value=JSON.parse(withoutTrailingCommas(clean))}catch{throw failure('AI_RESPONSE_INVALID')}}
 if(!value||Array.isArray(value)||typeof value!=='object')throw failure('AI_RESPONSE_INVALID');return value;
}
module.exports={parseAIJSON};
