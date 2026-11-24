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
 // El modelo puede presentar un porcentaje inventado como resultado de un
 // estudio. Sin una cita documental comprobada no debe tratarse como dato real.
 // Es advertencia heurística; jamás sustituye la verificación de la fuente.
 const inspectable=[
  ...((Array.isArray(material.actividadesGuiadas)?material.actividadesGuiadas:[]).map(a=>String(a?.consigna||''))),
  ...((Array.isArray(material.casosEstudio)?material.casosEstudio:[]).map(a=>String(a?.contextoReal||'')))
 ];
 const verifiedSources=Array.isArray(material.respaldoDocumental)?material.respaldoDocumental:[];
 const unverifiedStatistics=inspectable.some(value=>{
  const s=norm(value).replace(/\s+/g,' ');
  return /\b(?:estudio|encuesta|censo|informe|investigacion|segun [^.!?]{3,90})[^.!?]{0,180}\b\d{1,3}(?:[.,]\d+)?\s*%/.test(s)&&
   !/\b(?:simulad[oa]|hipotetic[oa]|fictici[oa]|datos inventados)\b/.test(s);
 });
 if(unverifiedStatistics&&!verifiedSources.length)
  add('CIFRA_ATRIBUIDA_SIN_RESPALDO','Una actividad atribuye porcentajes a un estudio o informe sin respaldo documental validado. Aporte fuente verificable o marque el dato como SIMULADO.',18);
 const guided=material.ejemploGuiado||{};
 const stimulus=String(guided?.situacion||'');
 const quoted=/(?:[«“"][^»”"]{45,}[»”"]|\b(?:texto|fragmento|fuente)\s*:\s*[\s\S]{150,})/i.test(stimulus);
 if(teaching&&/\b(?:se analiza|analice|se lee|lea)\s+(?:un|el)\s+(?:fragmento|texto|documento|noticia)\b/i.test(stimulus)&&
   !quoted&&!String(guided?.texto||guided?.lectura||guided?.fragmento||'').trim())
  add('EJEMPLO_SIN_ESTIMULO','El ejemplo guiado pide analizar un fragmento o texto que no está incorporado en el ejemplo. Incluya el estímulo completo antes de las preguntas.',16);
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
  const slides=material.diapositivas;
  // Tablas y estímulos estructurados también forman parte del contenido:
  // String(objeto) devuelve "[object Object]" y oculta repeticiones reales.
  const contentText=value=>{
   if(value==null)return '';
   if(typeof value==='string'||typeof value==='number')return String(value);
   if(Array.isArray(value))return value.map(contentText).join(' ');
   if(typeof value==='object')return Object.keys(value).sort().map(key=>key+': '+contentText(value[key])).join(' ');
   return '';
  };
  const bodyOf=d=>contentText(d?.contenido).replace(/\s+/g,' ').trim();
  const bodies=slides.map(d=>norm(bodyOf(d))).filter(x=>x.length>=45);
  if(bodies.length>=2&&new Set(bodies).size<bodies.length)add('PPT_CONTENIDO_REPETIDO','Dos o más diapositivas repiten exactamente el mismo desarrollo; comprueba su función didáctica.',20);
  // Detecta una consigna idéntica insertada en gran parte del PPT aunque
  // las explicaciones de las diapositivas sean diferentes.
  const prompts=new Map();
  slides.forEach((d,i)=>{
   const lines=Array.isArray(d?.contenido)?d.contenido:typeof d?.contenido==='string'?d.contenido.split(/\n+/):[];
   const perSlide=new Set(lines.flatMap(value=>typeof value==='string'?value.split(/\n+/):[]).map(value=>norm(value).replace(/\s+/g,' ').trim()).filter(line=>
    line.length>=55&&(/^(?:pregunta|consigna|actividad|desafio)\b/.test(line)||/[¿?]$/.test(line))
   ));
   for(const line of perSlide)prompts.set(line,(prompts.get(line)||0)+1);
  });
  if(slides.length>=6&&[...prompts.values()].some(count=>count>=Math.max(4,Math.ceil(slides.length*.4))))
   add('PPT_CONSIGNA_REITERADA','La misma pregunta o consigna larga aparece en numerosas diapositivas. Varíe el propósito y los ejemplos o deje la pregunta común solo donde corresponda.',15);
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
