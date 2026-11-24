/* Puente entre OA EPJA, evidencias documentales y diseño didáctico del material.
   Solo una cita literal validada puede presentarse como respaldo. */
'use strict';
const DidacticScaffold=require('./oa-textbook-didactic-scaffold.cjs');
const strategies={
 GUIA:['Activación breve con pregunta vinculada al tema y experiencia adulta','Explicación clara de conceptos del OA con un ejemplo guiado resuelto','Ejercicios progresivos de aplicación con consignas autosuficientes','Actividad de análisis o transferencia con devolución y pauta docente'],
 EVALUACION:['Ítems alineados al conocimiento y habilidad del OA','Casos aplicados al contexto adulto sin introducir hechos no verificados','Distractores plausibles y justificaciones coherentes, sin patrones de claves','Criterios de corrección observables y puntaje consistente'],
 PRESENTACION:['Inicio con pregunta o desafío cercano a la vida adulta','Explicación progresiva y ejemplo visual demostrativo','Actividad breve con todos sus insumos incorporados','Síntesis y verificación formativa en la diapositiva final'],
 PLANIFICACION:['Inicio: recuperación de conocimientos y propósito','Desarrollo: modelado de conceptos y trabajo autónomo o cooperativo','Apoyos para lectoescritura y accesibilidad, sin depender de teléfono','Cierre con evidencia observable y retroalimentación'],
 TALLER:['Desafío auténtico contextualizado','Información y procedimiento guiado','Aplicación con producto verificable','Autoevaluación con criterios y ejemplos'],
 ACCESIBLE:['Introducción oral sencilla','Texto segmentado con vocabulario explicado','Ejemplo trabajado y preguntas de escucha','Comprobación oral accesible con pauta docente']
};
function build(plan={},matrix={}){
 const tipo=String(plan.tipoMaterial||'GUIA').toUpperCase();
 const checked=(matrix.registros||[]).filter(r=>['fragmento_libro','fragmento_documental'].includes(r.tipo)&&r.fragmentoId&&Number.isInteger(r.paginaPDF));
 const proof=checked.slice(0,5).map(r=>({fuenteId:r.fragmentoId,pais:r.pais,titulo:r.titulo,paginaPDF:r.paginaPDF,url:r.url,tipo:r.tipo}));
 const indexCount=(matrix.registros||[]).filter(r=>['indice_paginas_texto_regular','ficha_libro_oficial','catalogo'].includes(r.tipo)).length;
 return {version:1,marco:plan.marcoCurricular||'',oaLiteral:plan.objetivoAprendizaje||'',tema:plan.temaEspecifico||'',tipoMaterial:tipo,
  verificacionOA:matrix.verificacionOA||{estado:'pendiente_cotejo_literal',documento:null,paginaPDF:null,fuenteId:null},
  estado:proof.length?'referencias_pdf_recuperadas_pendientes_de_revision_docente':'sin_fragmentos_documentales_para_atribucion',
  fuentesUtilizablesComoPistas:proof,
  indicesSinLectura:indexCount,
  etapas:(strategies[tipo]||strategies.GUIA).slice(),
  secuenciaDocumentada90:DidacticScaffold.plan90(plan),
  adaptacionEPJA:'Explicaciones concretas, vocabulario accesible, ejemplos adultos y actividades realizables sin internet ni teléfono personal.',
  limite:'Las páginas indicadas por índices 2023 y el visor CONALITEG no acreditan lectura de los libros. Las referencias extraídas todavía requieren validación de pertinencia y exactitud.'};
}
function instructions(plan){
 if(!plan?.oaLiteral)return '';
 const ids=plan.fuentesUtilizablesComoPistas.map(x=>x.fuenteId);
 return '\nDISEÑO DIDÁCTICO VINCULADO AL OA EPJA: Mantén literal el OA y el tema seleccionados. Desarrolla en el material, NO solo anuncies, la secuencia: '+plan.etapas.join(' → ')+'. '+plan.adaptacionEPJA+' '+(ids.length?'Hay fragmentos PDF extraídos que pueden servir de apoyo si el texto exacto aparece en FUENTES DOCUMENTALES RECUPERADAS; IDs: '+JSON.stringify(ids)+'. Solo atribuye citas cuando la verificación literal del servidor lo confirme.':'No existe evidencia de páginas de libros leídas para este encargo: NO presentes los índices bibliográficos como fuentes del contenido, NO inventes citas, libros, números de páginas o imágenes.')+DidacticScaffold.prompt(plan.secuenciaDocumentada90)+' Incluye preguntas respondibles desde el contenido entregado, evita repeticiones y no mezcles objetivos EPJA con OA regulares o SEP. La pauta docente debe explicar por qué cada respuesta es correcta.';
}
module.exports={build,instructions,strategies};
