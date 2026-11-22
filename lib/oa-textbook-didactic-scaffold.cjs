/* Análisis directo de las páginas impresas 6 y 7 del PDF oficial de muestra.
 * Solo organización didáctica; NO contenido de las lecciones no incluidas en muestra.
 * https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-145429_textoescolar_muestra.pdf
 * PDF #page=8 y #page=9 (índices físicos base cero 7 y 8).
 * Diseño EPJA original, no reproducción de actividades protegidas del libro. */
'use strict';
const source={
 id:'MUESTRA_HISTORIA_1M_ORGANIZACION_P6_P7',
 titulo:'Historia, Geografía y Ciencias Sociales 1° medio · organización del texto · muestra Santillana',
 pais:'CL',marco:'Educación regular (no EPJA)',
 url:'https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-145429_textoescolar_muestra.pdf',
 paginasImpresas:[6,7],paginasPDF:[8,9],
 estado:'metodologia_inspeccionada_no_contenido_disciplinar',
 verificado:'La muestra describe inicio de unidad/ideas previas, desarrollo con recursos y modelado, miradas interdisciplinarias, habilidades, síntesis y autoevaluación.',
 limitacion:'No contiene capítulos completos de Historia ni su contenido disciplinar; solo inspira arquitectura didáctica original.'
};
const stages=[
 {id:'inicio',nombre:'Inicio con propósito y experiencia previa',evidencia:'Pregunta central y pregunta diagnóstica sobre una experiencia adulta',minutos:10},
 {id:'modelado',nombre:'Explicación guiada y ejemplo resuelto',evidencia:'Dos o tres conceptos explicados con ejemplo y pasos completos',minutos:20},
 {id:'fuente',nombre:'Trabajo con un recurso autosuficiente',evidencia:'Fuente, problema, texto o gráfico incorporado con consignas verificables',minutos:25},
 {id:'aplicacion',nombre:'Transferencia a una situación de vida adulta',evidencia:'Caso nuevo, toma de postura fundamentada o procedimiento aplicable',minutos:20},
 {id:'cierre',nombre:'Síntesis y autoevaluación',evidencia:'Síntesis de ideas y comprobación breve con retroalimentación',minutos:15}
];
function applicable(plan={}){
 const family=require('./oa-documentary-register.cjs').family(plan.asignatura);
 return family==='sociales'&&plan.usarTextosEscolares===true;
}
function plan90(plan={}){
 if(!applicable(plan))return null;
 return {version:1,origen:'Patrón didáctico adaptado de organización del texto de Historia regular; NO es transcripción ni metodología oficial EPJA.',
 fuente:source,tiempoTotalMinutos:90,
 etapas:stages.map(x=>({...x,contenido:'El docente debe seleccionar conceptos y recursos exclusivamente desde el OA EPJA y las fuentes disponibles; no inventar citas.'})),
 accesibilidad:['Texto breve con vocabulario explicado','Consignas legibles y posibilidad de lectura oral','Trabajo posible sin teléfonos y con impresión en papel'],
 validacion:'propuesta_heuristica_pendiente_revision_docente'};
}
function prompt(scaffold){
 if(!scaffold)return '';
 return '\nPATRÓN DIDÁCTICO DOCUMENTADO Y ADAPTADO (solo organización, no datos históricos): Inicio con conocimientos previos; explicación guiada paso a paso; recurso incorporado y contextualizado; transferencia adulta; cierre con síntesis y autoevaluación. En planificación de 90 minutos distribuir 10+20+25+20+15 minutos y dar instrucciones completas para cada momento. El patrón se inspira en la ORGANIZACIÓN del texto oficial de muestra (páginas impresas 6 y 7), no en una lección leída ni en OA regulares. Nunca atribuir ejemplos, preguntas o explicaciones concretos al libro sin fuente textual comprobada. Material original y accesible para EPJA.';
}
module.exports={source,stages,applicable,plan90,prompt};
