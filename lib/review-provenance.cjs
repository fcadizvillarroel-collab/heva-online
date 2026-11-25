'use strict';
// Keep provenance on the checkpoint itself, including partially repaired blocks.
const providers=['openai','gemini','groq'];
const valid=p=>providers.includes(p);
function unique(values){return [...new Set(values.filter(valid))];}
function blockProviders(block){return unique(Array.isArray(block?.proveedoresBloque)?block.proveedoresBloque:[]);}
function record(block,...sources){return {...block,proveedoresBloque:unique(sources.flatMap(s=>typeof s==='string'?[s]:blockProviders(s)))};}
function assembly(base,parts,author){const blocks=[base,...parts];return {proveedores:unique([author?.proveedor,...blocks.flatMap(blockProviders)]),completa:blocks.every(b=>blockProviders(b).length>0)};}
function contributors(m={}){return unique([m.autoriaIA?.proveedor,...(m.autoriaBloques?.proveedores||[]),...(Array.isArray(m.edicionesIA)?m.edicionesIA:[]).map(e=>e?.proveedor)]);}
function independent(m,keys){if(m.autoriaBloques?.completa===false)return [];return providers.filter((p,i)=>keys[i]&&!contributors(m).includes(p));}
module.exports={contributors,independent,record,assembly,blockProviders};
