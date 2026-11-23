'use strict';
/*
 * HEVA experimental: apoyos inclusivos seleccionados por el docente.
 * Son orientaciones pedagógicas (DUA/atención a la diversidad), NO un
 * diagnóstico PIE, ni sustituyen decisiones profesionales o el OA EPJA.
 */
const CHOICES=Object.freeze({
  lectura:'Lectura accesible y vocabulario explicado',
  vision:'Baja visión o ceguera: acceso textual equivalente',
  modelado:'Ejemplo resuelto y andamiaje gradual',
  respuesta:'Modalidades alternativas de respuesta',
  recuperacion:'Reincorporación tras inasistencias',
  desafio:'Desafío de transferencia para avanzar'
});
const keys=Object.keys(CHOICES);
function validate(value){
 if(value==null)return [];
 if(!Array.isArray(value))return ['Los apoyos inclusivos deben ser una lista.'];
 if(value.length>keys.length)return ['Demasiados apoyos inclusivos seleccionados.'];
 if(value.some(v=>typeof v!=='string'||!Object.hasOwn(CHOICES,v)))return ['Se recibió un apoyo inclusivo no reconocido.'];
 if(new Set(value).size!==value.length)return ['Los apoyos inclusivos no pueden repetirse.'];
 return [];
}
function selected(value){
 if(validate(value).length)return [];
 return Array.isArray(value)?value.slice():[];
}
function prompt(plan){
 const ids=selected(plan?.apoyosInclusivos);
 if(!ids.length)return '';
 const exam=plan?.tipoMaterial==='EVALUACION';
 const lines={
  lectura:'Segmenta las explicaciones o estímulos en párrafos breves, define términos indispensables y usa consignas directas. Conserva íntegros los conceptos del OA EPJA y un lenguaje respetuoso con personas adultas.',
  vision:'Proporciona descripciones textuales suficientes de imágenes, tablas, mapas, diagramas y relaciones espaciales. No exijas reconocer colores, detalles pequeños o posiciones visuales como única vía. Organiza información en secuencia lineal con títulos descriptivos. Para PowerPoint ofrece narración o notas docentes equivalentes a lo visual; no afirmes que el archivo cumple una certificación técnica de accesibilidad.',
  modelado:exam?'Es una evaluación: NO incorpores ejemplos resueltos, pistas ni pasos que revelen respuestas; emplea consignas claras, apoyos de lectura neutrales y criterios equivalentes. La práctica modelada corresponde a una guía preparatoria separada.':'Incluye dentro del contrato existente un ejemplo completamente resuelto, explica por qué cada paso es correcto, añade práctica guiada con apoyo y retira el apoyo en la tarea autónoma. Usa situaciones distintas para evitar copiar la solución.',
  respuesta:'Cuando sea compatible con el OA y las reglas institucionales, indica que la respuesta puede entregarse escrita, oral o mediante dictado a una persona autorizada. Mantén las habilidades y criterios de logro; no impongas una modalidad ni afirmes que una evaluación formal se adaptó administrativamente.',
  recuperacion:exam?'Incluye una breve contextualización conceptual neutral antes de los ítems, si el formato lo permite, sin dar respuestas ni pistas. Conserva ítems autónomos que no dependan de clases anteriores o conexión personal.':'Añade una síntesis breve para retomar el contenido tras una ausencia y una tarea de reenganche autosuficiente dentro de las actividades ya solicitadas, sin exigir una clase previa ni acceso personal a internet.',
  desafio:'Integra una tarea de transferencia a una situación nueva que exige justificar y aplicar el mismo OA, sin añadir preguntas sobre los límites solicitados. Si es evaluación, no agregues pistas ni respuestas, y mantén el nivel exigible.'
 };
 return '\nAPOYOS INCLUSIVOS SELECCIONADOS POR EL DOCENTE (aplicar en contenido y actividades, NO solo mencionarlos):\n'+
  ids.map(id=>'- '+CHOICES[id]+': '+lines[id]).join('\n')+
  '\nREGLAS COMUNES: no cambies el texto literal del objetivo de aprendizaje EPJA ni el tema. No inventes diagnósticos individuales ni datos personales. Evita infantilizar, reducir arbitrariamente contenidos o añadir preguntas fuera de las cantidades solicitadas. Las opciones son apoyos pedagógicos, no una certificación PIE/DUA ni prueba de accesibilidad del archivo final.\n';
}
module.exports={CHOICES,validate,selected,prompt};
