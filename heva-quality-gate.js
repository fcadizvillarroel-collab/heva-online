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
 // Revisar contenido realmente desarrollado, no solo presencia de palabras
 // como "ejemplo" o encabezados vacíos "Paso 1". Son advertencias, nunca un
 // bloqueo automático de exportación ni una aprobación pedagógica.
 const rawSections=sections.map(x=>String(x?.text||''));
 const stepHeading=/^(?:paso|etapa)\s*\d{1,2}\s*[:.)-]?\s*$/i;
 const placeholder=/^(?:\.{2,}|por completar|desarrollar aqu[ií]|pendiente)$/i;
 const missingStep=rawSections.some(t=>{
  const lines=t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  return lines.some((line,i)=>stepHeading.test(line)&&(i===lines.length-1||stepHeading.test(lines[i+1])||placeholder.test(lines[i+1])));
 });
 if(teaching&&missingStep)
  add('PASOS_SIN_DESARROLLO','Existen pasos o etapas numeradas sin explicación. Completar el procedimiento antes de usar el material.',18);
 const exampleHeading=/^(?:ejemplo(?:\s+(?:guiado|resuelto|modelado))?|caso\s+guiado|demostraci[oó]n)\s*[:.-]?\s*$/i;
 const missingExample=rawSections.some(t=>{
  const lines=t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  return lines.some((line,i)=>exampleHeading.test(line)&&(i===lines.length-1||placeholder.test(lines[i+1])));
 });
 if(teaching&&missingExample)
  add('EJEMPLO_SIN_RESOLUCION','Hay un ejemplo o demostración vacío o con texto provisional. Desarrollarlo antes de utilizar el material.',15);
 const cases=(material.casosEstudio||[]).map(q=>norm(q?.contextoReal).replace(/\s+/g,' ').trim()).filter(x=>x.length>=55);
 if(cases.length>=2&&new Set(cases).size<cases.length)
  add('CASOS_CONTEXTO_REPETIDO','Dos casos comparten exactamente la misma situación; utilizar contextos o datos diferentes.',16);
 const justifications=(material.preguntasAlternativas||[]).map(q=>norm(q?.justificacion).replace(/\s+/g,' ').trim()).filter(x=>x.length>=12);
 const genericJustification=justifications.some(j=>/^(?:porque|ya que) (?:es|corresponde a) (?:la )?(?:respuesta|alternativa|opcion) correcta[.!]?$/.test(j));
 if(genericJustification||(justifications.length>=3&&new Set(justifications).size<justifications.length))
  add('PAUTAS_POCO_ESPECIFICAS','Existen justificaciones de alternativas idénticas o genéricas. Explicar el razonamiento de cada respuesta.',14);
 const choices=material.recursosVisualesHEVA||material.planGeneracion?.recursosVisualesHEVA;const requestedVisuals=!choices||!Object.keys(choices).length||['imagenes','diagramas','graficos'].some(k=>choices[k]===true)||!['imagenes','diagramas','graficos'].some(k=>choices[k]===false);
 if(teaching&&requestedVisuals&&!visuals.some(v=>v?.image||v?.chart||v?.diagram))add('VISUALES_AUSENTES','No se identifican imágenes, gráficos o diagramas en el resultado planificado.',10);
 const keys=(material.preguntasAlternativas||[]).map(q=>norm(q.claveCorrecta||q.respuestaCorrecta||q.correcta||q.clave||'').trim().toUpperCase()).filter(k=>/^[ABCD]$/.test(k));
 if(keys.length>=8){const counts=Object.fromEntries('ABCD'.split('').map(k=>[k,keys.filter(x=>x===k).length]));if(Math.max(...Object.values(counts))-Math.min(...Object.values(counts))>1)add('CLAVES_DESEQUILIBRADAS','Las respuestas A-D no están distribuidas de forma equilibrada.',15);}
 const questions=(material.preguntasAlternativas||[]).map(q=>norm(q.enunciado||q.pregunta||q.texto||'').replace(/\s+/g,' ').trim()).filter(q=>q.length>18);
 if(questions.length>1&&new Set(questions).size<questions.length)add('PREGUNTAS_DUPLICADAS','Hay enunciados de selección múltiple repetidos.',20);
 // Auditoría del contenido original de las diapositivas, no solo de la hoja Word.
 // Un hallazgo heurístico orienta la revisión; no modifica ni certifica el material.
 if(String(material.tipoMaterial||'').toUpperCase()==='PRESENTACION'&&Array.isArray(material.diapositivas)){
  const slides=material.diapositivas,bodyOf=d=>(Array.isArray(d?.contenido)?d.contenido.join(' '):String(d?.contenido||'')).replace(/\s+/g,' ').trim();
  const bodies=slides.map(d=>norm(bodyOf(d))).filter(x=>x.length>=45);
  if(bodies.length>=2&&new Set(bodies).size<bodies.length)add('PPT_CONTENIDO_REPETIDO','Dos o más diapositivas repiten exactamente el mismo desarrollo; comprueba su función didáctica.',20);
  const titles=slides.map(d=>norm(d?.titulo).replace(/\s*·\s*continuacion(?:\s*\(\d+\))?$/,'').trim()).filter(x=>x.length>=8);
  if(titles.length>=2&&new Set(titles).size<titles.length)add('PPT_TITULOS_REPETIDOS','Existen títulos de diapositiva idénticos. Revisa si aportan contenido diferente.',8);
  const explains=slides.filter(d=>!/actividad|ejercicio|aplicacion|reflexion|ticket|pregunta|evaluacion|cierre|objetivo/i.test(norm([d?.funcion,d?.titulo].join(' '))));
  if(slides.length>=8&&explains.length>=4&&explains.filter(d=>bodyOf(d).length<65).length>explains.length/2)add('PPT_EXPLICACION_BREVE','Más de la mitad de las diapositivas explicativas tienen menos de 65 caracteres; revisar la profundidad y el modelado.',14);
  const inside=visuals.filter(v=>v&&typeof v==='object');
  if(inside.length>=8&&inside.filter(v=>v.visualKind==='cards').length>=Math.ceil(inside.length*.75))add('PPT_FORMATO_REPETITIVO','Al menos tres cuartas partes de las diapositivas utilizan el mismo diseño de tarjetas.',10);
 }
 const oa=norm(material.objetivoAprendizaje||material.oaTexto||'').trim();
 if(teaching&&!oa)add('OA_NO_VISIBLE','No se identificó el objetivo curricular en el material recibido por el auditor.',10);
 const repeated=sections.map(s=>norm(s.text).replace(/\s+/g,' ').trim()).filter(t=>t.length>70);if(new Set(repeated).size<repeated.length)add('SECCIONES_DUPLICADAS','Hay secciones extensas idénticas.',20);
 return {score:Math.max(0,100-issues.reduce((a,i)=>a+i.weight,0)),issues,heuristic:true,inspectedSections:sections.length};
}
return{inspect};
});
