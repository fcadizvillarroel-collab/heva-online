/* Catálogo de descubrimiento: no es una fuente curricular EPJA ni
   certifica el contenido de los PDF enlazados. No almacena libros. */
'use strict';
const SEP=require('./sep-textbook-catalog.cjs');
const base='https://www.librosdelmineduc.cl';
const levels={
 basica:{label:'Educación Básica regular (1.º a 8.º)',url:base+'/educacion-basica/'},
 media:{label:'Educación Media regular (1.º a 4.º)',url:base+'/educacion-media/'}
};
// Fichas ministeriales comprobadas, con su curso REGULAR y edición identificados.
const officialExamples=[
 {group:'sociales',stage:'media',title:'Historia, Geografía y Ciencias Sociales · 1.º medio · texto del estudiante (edición 2020)',url:'https://aprendoenlinea.mineduc.gob.cl/recursos/historia-geografia-ciencias-sociales-1-medio-santillana-texto-estudiante',role:'ficha_texto_oficial'},
 {group:'matematica',stage:'basica',title:'Matemática · 7.º básico · texto del estudiante (edición 2020)',url:'https://aprendoenlinea.mineduc.gob.cl/recursos/matematica-7o-basico-sm-texto-estudiante',role:'ficha_texto_oficial'}
];
const subjects=[
 {id:'sociales',label:'Historia, Geografía y Ciencias Sociales',tokens:['historia','estudios sociales','geografia','educacion ciudadana'],stages:['basica','media']},
 {id:'lenguaje',label:'Lenguaje y Literatura',tokens:['lenguaje','lengua castellana','lengua y literatura','comunicacion'],stages:['basica','media']},
 {id:'matematica',label:'Matemática',tokens:['matematica','matematicas'],stages:['basica','media']},
 {id:'ciencias',label:'Ciencias Naturales y ciencias específicas',tokens:['ciencias naturales','biologia','quimica','fisica','ciencias para la ciudadania'],stages:['basica','media']},
 {id:'ingles',label:'Inglés',tokens:['ingles','idioma extranjero ingles','english'],stages:['basica','media']},
 {id:'filosofia',label:'Filosofía',tokens:['filosofia'],stages:['media']},
 {id:'ciudadania',label:'Educación Ciudadana',tokens:['educacion ciudadana','convivencia social','insercion laboral'],stages:['media']}
];
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const contentWords=text=>new Set(normalize(text).match(/[a-zñ]{5,}/g)||[]);
function matchesTopic(topic,objective,record){
 const a=contentWords(topic),b=contentWords(objective);
 // Verifica contenido y OA, no solo el grado. No equivale a cotejar páginas de PDF.
 const ignored=new Set(['estudio','aprendizaje','nivel','adultos','personas','comunicacion','educacion','analizar','explicar','evaluar','comprender','aplicar','historica','procesos','problemas','habilidad','distintos','desarrollar']);
 const tokens=[...a].filter(w=>!ignored.has(w)&&[...b].some(v=>v===w||(w.length>=8&&v.length>=8&&w.slice(0,7)===v.slice(0,7))));
 return {sameTopic:tokens.length>0,matchedWords:tokens.slice(0,8)};
}
function recommendations(plan={}){
 const subject=normalize(plan.asignatura),isBasic=/basica|basico|basic/.test(normalize(plan.nivel)),stage=isBasic?'basica':'media';
 const found=subjects.filter(x=>x.tokens.some(t=>subject.includes(t))&&x.stages.includes(stage));
 const matched=found.length===1?found[0]:null;
 const result={enabled:plan.usarTextosEscolares===true,status:'solo_referencia_sin_libro_verificado',matchedSubject:matched?.id||null,subjectLabel:matched?.label||null,stage,items:[],scope:'Catálogo de educación regular como pista bibliográfica. No se ha abierto ni contrastado el PDF original y no constituye equivalencia curricular EPJA.'};
 if(!result.enabled||!matched||!normalize(plan.temaEspecifico)||!normalize(plan.objetivoAprendizaje))return result;
 const check=matchesTopic(plan.temaEspecifico,plan.objetivoAprendizaje,matched);
 result.topicOverlap=check.sameTopic;
 if(!check.sameTopic){result.status='pendiente_homologacion_docente';return result;}
 // Enlaces al índice; las referencias concretas requieren inspección de libro y páginas.
 result.items=[{title:matched.label+' · '+levels[stage].label,source:'Libros del Mineduc (índice de terceros)',url:levels[stage].url,role:'catalogo_no_verificado'},
 {title:'Textos escolares · Currículum Nacional',source:'Ministerio de Educación',url:'https://www.curriculumnacional.cl/textos_escolares',role:'indice_oficial'},
 {title:'Aprendo en Línea · recursos ministeriales',source:'Ministerio de Educación',url:'https://aprendoenlinea.mineduc.gob.cl/',role:'indice_oficial'}];
 result.items.push(...officialExamples.filter(x=>x.group===matched.id&&x.stage===stage).map(x=>({title:x.title,source:'Ministerio de Educación · Aprendo en Línea',url:x.url,role:x.role})));
 result.items.push(...SEP.recommendations({enabled:result.enabled,subject:matched.id,topicMatched:check.sameTopic}));
 result.referencesByCountry={CL:result.items.filter(x=>x.country!=='MX').length,MX:result.items.filter(x=>x.country==='MX').length};
 result.status='candidata_por_tema_oa_pendiente_libro_y_pagina';
 result.matchedWords=check.matchedWords;
 return result;
}
function instruction(catalog){
 if(!catalog?.enabled)return '';
 return '\nAPOYO CON TEXTOS ESCOLARES DE EDUCACIÓN REGULAR: '+(catalog.status==='candidata_por_tema_oa_pendiente_libro_y_pagina'?'Se identificó SOLO una candidatura de catálogo por asignatura y términos compartidos entre tema y OA.':'No se confirmó una coincidencia documental suficiente.')+' No atribuyas definiciones, imágenes, citas, páginas, actividades ni contenido a un libro sin fragmentos recuperados y comprobados. Utiliza únicamente las fuentes documentales oficiales recuperadas y verificadas por el servidor; nunca sustituyas el OA EPJA ni supongas que los niveles regular y EPJA equivalen. Puedes crear ejemplos y explicaciones originales, adaptados a adultos y al objetivo, sin copiar texto protegido de los libros.'+SEP.instructions((catalog.items||[]).filter(x=>x.country==='MX'));
}
module.exports={levels,subjects,officialExamples,recommendations,instruction,normalize};
