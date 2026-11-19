/* Auditoría heurística: detecta riesgos, no certifica calidad pedagógica. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVAQualityGate=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function inspect({material={},sections=[],visuals=[]}={}){
 const issues=[],text=norm(sections.map(x=>[x.title,x.text].join(' ')).join('\n'));
 const add=(code,detail,weight=10)=>issues.push({code,detail,weight});
 const teaching=['GUIA','TALLER','PRESENTACION','ACCESIBLE'].includes(material.tipoMaterial);
 if(teaching&&!/ejemplo|demostracion|caso guiado|paso a paso|modelo resuelto/.test(text))add('EJEMPLO_AUSENTE','Falta un ejemplo resuelto o demostración identificable.',15);
 if(teaching&&!/significa|consiste|se define|se refiere|porque|por que|es un|es una|procedimiento/.test(text))add('EXPLICACION_PENDIENTE','Revisar definiciones y procedimientos antes de evaluar.',20);
 if(teaching&&!/actividad|pregunta|practica|aplica|resuelve|analiza/.test(text))add('PRACTICA_AUSENTE','No se reconoce una actividad de aplicación.',15);
 if(teaching&&material.recursosVisualesHEVA?.imagenes!==false&&material.recursosVisualesHEVA?.diagramas!==false&&!visuals.some(v=>v?.image||v?.chart||v?.diagram))add('VISUALES_AUSENTES','No se identifican imágenes, gráficos o diagramas en el resultado planificado.',10);
 const keys=(material.preguntasAlternativas||[]).map(q=>norm(q.respuestaCorrecta||q.correcta||q.clave||'').trim().toUpperCase()).filter(k=>/^[ABCD]$/.test(k));
 if(keys.length>=8){const counts=Object.fromEntries('ABCD'.split('').map(k=>[k,keys.filter(x=>x===k).length]));if(Math.max(...Object.values(counts))-Math.min(...Object.values(counts))>1)add('CLAVES_DESEQUILIBRADAS','Las respuestas A-D no están distribuidas de forma equilibrada.',15);}
 const repeated=sections.map(s=>norm(s.text).replace(/\s+/g,' ').trim()).filter(t=>t.length>70);if(new Set(repeated).size<repeated.length)add('SECCIONES_DUPLICADAS','Hay secciones extensas idénticas.',20);
 return {score:Math.max(0,100-issues.reduce((a,i)=>a+i.weight,0)),issues,heuristic:true,inspectedSections:sections.length};
}
return{inspect};
});
