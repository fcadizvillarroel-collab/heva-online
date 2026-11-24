'use strict';
/*
 * Puente de estrategias internacionales verificadas en páginas institucionales.
 * No reemplaza el OA EPJA chileno ni afirma haber leído libros/PDF completos.
 * Una ficha en un portal no es evidencia documental de una página de libro.
 */
const publicSources=Object.freeze([
 {id:'SEP_MX_REGISTROS_2022',pais:'México',organismo:'SEP México · Secretaría de Educación Pública · Aprende en Casa',
  titulo:'Cómo me hables, nos comunicamos',
  url:'https://aprendeencasa.sep.gob.mx/secundaria/como-me-hables-nos-comunicamos/',
  tipo:'secuencia didáctica pública; página HTML inspeccionada, no libro de texto',
  aporte:'Comparación de grados de formalidad según destinatario, situación y propósito; tarjetas de diálogo y producción oral.'},
 {id:'EDUCAR_AR_REGISTROS_2011',pais:'Argentina',organismo:'Educ.ar · Secretaría de Educación',
  titulo:'Tipos de registros',
  url:'https://www.educ.ar/recursos/14911/tipos-de-registros',
  tipo:'ficha descriptiva pública de una secuencia didáctica; actividad completa no inspeccionada',
  aporte:'Reconocimiento del registro en relación con interlocutor y contexto; adecuación comunicativa.'},
 {id:'EDUCAR_AR_FORMAL_2011',pais:'Argentina',organismo:'Educ.ar · Secretaría de Educación',
  titulo:'El registro formal o informal',
  url:'https://www.educ.ar/recursos/15238/el-registro-formal-o-informal/fullscreen',
  tipo:'ficha descriptiva pública; contenido interactivo completo no inspeccionado',
  aporte:'Análisis y adaptación de textos para adecuar el mensaje al destinatario.'}
]);
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
const additionalSources=Object.freeze([
 {id:'INTEF_ES_INDUSTRIAL',pais:'España',organismo:'INTEF',titulo:'Revolución Industrial y sus consecuencias',url:'https://descargas.intef.es/recursos_educativos/RED_ES/03_Eso/2/S_2_029_2025_0568/secuencia_competencial.html',tipo:'índice y secuencia HTML inspeccionados; no libro de texto',aporte:'Comparar paisajes antes y después de la industrialización, analizar causas y cambios laborales y preparar una exposición final.',subject:/historia|social/,topic:/industriali|revolucion industrial/}
]);
function additional(plan){const s=norm(plan.asignatura),t=norm([plan.temaEspecifico,plan.objetivoAprendizaje].join(' '));return additionalSources.filter(x=>x.subject.test(s)&&x.topic.test(t)).map(({subject,topic,...x})=>x);}
function languageApplicable(plan={}){
 const s=norm(plan.asignatura),topic=norm([plan.temaEspecifico,plan.objetivoAprendizaje].join(' '));
 return /lenguaje|lengua|comunicacion|literatura/.test(s)&&
  /registro(?:s)?(?:\s+de\s+habla|\s+formal|\s+informal)?|formal(?:idad)?\s+e\s+informal|formal\s+(?:o|y)\s+informal/.test(topic);
}
function applicable(plan={}){return languageApplicable(plan)||additional(plan).length>0;}
function references(plan={}){
 return [...(languageApplicable(plan)?publicSources:[]),...additional(plan)].map(x=>({...x,estado:'referencia metodológica pública; no equivale a verificación de un texto escolar'}));
}
function prompt(plan={}){
 if(!applicable(plan))return '';
 if(!languageApplicable(plan))return '\nAPORTES DIDÁCTICOS INTERNACIONALES (no OA ni evidencia factual): '+additional(plan).map(x=>x.organismo+' · '+x.titulo+' ('+x.url+'): '+x.aporte).join('; ')+'. Diseña actividades originales para adultos de Chile, pertinentes al OA literal EPJA. No cites páginas ni hechos no comprobados. En evaluación no muestres respuestas; en enseñanza incluye modelamiento, práctica y comprobación.\n';
 const kind=plan.tipoMaterial;
 const guide=['GUIA','ACCESIBLE','TALLER','PRESENTACION'].includes(kind);
 const planning=kind==='PLANIFICACION';
 const evaluation=kind==='EVALUACION';
 const paths=publicSources.map(x=>x.organismo+' · '+x.titulo+' ('+x.url+')').join('; ');
 return '\nREFERENCIAS DIDÁCTICAS COMPLEMENTARIAS VERIFICADAS (no son OA chilenos ni se reprodujeron libros): '+paths+
 '\nMINEDUC CHILE: El objetivo seleccionado del catálogo EPJA y los fragmentos documentales efectivamente recuperados prevalecen sobre cualquier enfoque extranjero. No sustituyas el currículo EPJA por tercero de secundaria, fases mexicanas ni cursos argentinos.\n'+
 'ADAPTACIÓN ORIGINAL A EPJA CHILE: El registro formal e informal depende de quién habla, a quién, para qué, en qué contexto y con qué efecto. No enseñes que "informal" es siempre incorrecto. En ejemplos modelados utiliza situaciones chilenas adultas diversas: solicitud a una organización, diálogo entre compañeros, exposición comunitaria y coordinación laboral. Evita repetir siempre entrevistas de trabajo, correos al jefe y tutor académico. Usa español natural de Chile, sin importar mexicanismos o argentinismos de los recursos originales.\n'+
 (guide?'SECUENCIA SUGERIDA: presenta dos mensajes ORIGINALES completos con el mismo propósito y destinatarios diferentes; explícalos en una comparación de dos columnas y justifica las diferencias. Ofrece una tarjeta de situación nueva con los cuatro datos (hablante, destinatario, propósito, contexto) y modelo oral de 30 a 60 segundos que el docente puede leer en voz alta. Luego pide adaptar otro mensaje y producir una intervención breve sin grabación. En PPT alterna comparación visual real, diálogo en dos columnas, ejemplo comentado, error explicado y aplicación independiente; usa textos legibles, no infografías genéricas. La guía deberá contener los ejemplos y estímulos completos, no promesas de archivos anexos.\n':'')+
 (planning?'PLANIFICACIÓN: reserva tiempo para una comparación modelada, análisis de tarjetas y una intervención oral observable. Los recursos que se seleccionen (textos, noticias, imágenes, mapas) deben tener una forma de acceso real: texto íntegro o descripción textual/identificación expresa de material propio. Si no existe un mapa relevante al OA, no fuerces mapas ni fotos. Sin necesidad de celulares o grabaciones personales.\n':'')+
 (evaluation?'EVALUACIÓN: formula estímulos y criterios neutrales, sin modelos que anticipen las respuestas. Para un OA de expresión oral solicita una breve intervención oral y criterios observables (adecuación, fluidez, claridad, coherencia), con evaluación presencial sin grabaciones. Diferencia actividades por destinatario y propósito, no repitas el mismo correo o frase en distintos ítems.\n':'')+
 'PROVENIENCIA: los portales mexicanos y argentinos inspiran decisiones metodológicas originales, NO validan cada dato del material ni autorizan a citar páginas de libros no recuperadas. La autoría y ejemplos deben ser originales y adecuados a personas adultas.\n';
}
module.exports={publicSources,applicable,references,prompt};
