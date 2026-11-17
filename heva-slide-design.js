/* Composición visual determinista: no modifica el OA, las preguntas ni sus soluciones. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVASlideDesign=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function image(value){if(!value||typeof value!=='object'||!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value.data||'')||value.data.length>1800000)return null;const w=Number(value.width),h=Number(value.height);if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w/h<.15||w/h>7)return null;return{data:value.data,width:w,height:h,alt:String(value.alt||'Imagen incorporada por el docente').slice(0,300),generated:value.generated===true};}
function role(s){const f=norm(s.role||s.funcion),t=norm(s.title);if(/aplicacion|actividad|practica|desafio|ejercicio/.test(f)||/actividad|ejercicio|desafio|ticket de salida/.test(t))return'activity';if(/objetivo/.test(f))return'opening';if(/cierre|sintesis/.test(f))return'closing';if(/modelamiento|ejemplo/.test(f))return'example';if(/explicacion/.test(f))return'concept';return'editorial';}
const rules=[{id:'intercambio',topic:/globaliza|comercio internacional|cadena de suministro/,slide:/comercio|producto|proveedor|intercambio|cadena|econom/},{id:'dialogo',topic:/resolucion.*conflic|convivencia|escucha activa|mediacion/,slide:/dialog|escuch|mediac|acuerdo|comunic/},{id:'observacion',topic:/germinacion|semilla|crecimiento vegetal/,slide:/germina|semilla|brote|raiz|planta/}];
function decorate(m,sections,assets={}){const topic=norm([m.titulo,m.temaEspecifico,m.objetivoAprendizaje].join(' ')),used=new Set();return sections.map((s,i)=>{const out={...s,design:role(s)},own=image(s.image);if(s.hideImage)return{...out,image:null};if(own)return{...out,image:own};if(m.tipoMaterial!=='PRESENTACION'||m.accesibilidadVisual?.contraste||i===0||out.design==='activity'||out.design==='closing'||out.design==='opening'||out.design==='example'||/comparacion|comparar|versus|diferencias/.test(norm(s.title)))return out;const words=norm(s.title+' '+s.text);for(const rule of rules){const asset=image(assets[rule.id]);if(asset&&!used.has(rule.id)&&rule.topic.test(topic)&&rule.slide.test(words)){used.add(rule.id);return{...out,image:asset};}}return out;});}
function contain(asset,box){const ratio=asset.width/asset.height,w=Math.min(box.w,box.h*ratio),h=w/ratio;return{x:box.x+(box.w-w)/2,y:box.y+(box.h-h)/2,w,h};}
function dataChart(lines){
 if(!Array.isArray(lines)||lines.length<2||lines.length>6)return null;
 const rows=lines.map(line=>String(line).trim().match(/^([^:\n]{1,45}):\s*(\d+(?:,\d{1,2})?)\s*(%|personas?|d[ií]as?|kg|unidades?|pesos?)\.?$/i));
 if(rows.some(x=>!x))return null;
 const units=rows.map(x=>norm(x[3]).replace(/s$/,''));if(new Set(units).size!==1)return null;
 const labels=rows.map(x=>x[1].trim());if(new Set(labels.map(norm)).size!==labels.length)return null;
 const values=rows.map(x=>Number(x[2].replace(',','.')));if(values.some(x=>!Number.isFinite(x)||x>1000000000))return null;
 return{labels,values,unit:rows[0][3],source:lines.slice()};
}
function forAI(m){return{...m,...(Array.isArray(m?.diapositivas)?{diapositivas:m.diapositivas.map(d=>{const x={...d};delete x.imagenHEVA;delete x.ocultarImagenHEVA;return x;})}:{})};}
function restoreImages(before,after){if(!after||!Array.isArray(after.diapositivas))return after;const originals=before.diapositivas||[];return{...after,diapositivas:after.diapositivas.map(d=>{const matches=originals.filter(x=>String(x.titulo||'').trim()===String(d.titulo||'').trim());if(matches.length!==1)return d;const old=matches[0],picture=image(old.imagenHEVA);return{...d,...(picture?{imagenHEVA:picture}:{}),...(typeof old.ocultarImagenHEVA==='boolean'?{ocultarImagenHEVA:old.ocultarImagenHEVA}:{})};})};}
return{image,role,decorate,contain,dataChart,forAI,restoreImages};});
