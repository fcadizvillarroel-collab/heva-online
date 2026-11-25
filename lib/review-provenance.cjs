'use strict';
// A provider that generated or edited the current version cannot be an independent reviewer.
const providers=['openai','gemini','groq'];
function contributors(m={}){return [...new Set([m.autoriaIA?.proveedor,...(Array.isArray(m.edicionesIA)?m.edicionesIA:[]).map(e=>e?.proveedor)].filter(p=>providers.includes(p)))];}
function independent(m,keys){return providers.filter((p,i)=>keys[i]&&!contributors(m).includes(p));}
module.exports={contributors,independent};
