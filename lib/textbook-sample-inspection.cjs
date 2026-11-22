/* Inspección puntual del PDF oficial de muestra, NO de todas las lecciones.
 * Fuente Mineduc: Historia, Geografía y Ciencias Sociales, 1° medio, Santillana.
 * https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-145429_textoescolar_muestra.pdf
 * Se comprobaron las páginas de ÍNDICE impresas 4 y 5 (PDF 6 y 7).
 * Las páginas citadas para lecciones corresponden al índice, NO a una lectura
 * del contenido de esas lecciones ni a la edición del índice UCE 2023.
 */
'use strict';
const PDF='https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-145429_textoescolar_muestra.pdf';
const sample=[
 {topic:'Liberalismo e ideas republicanas',terms:['liberalismo','ideas republicanas'],unidad:1,leccion:1,comienzoLibro:10,paginaIndiceImpresa:4,paginaIndicePDF:6,
 tituloLeccion:'¿Cómo se consolidaron las ideas liberales y republicanas en el siglo XIX?'},
 {topic:'Formación de estados nacionales',terms:['estados nacionales','estado-nacion','estado nacion'],unidad:1,leccion:2,comienzoLibro:34,paginaIndiceImpresa:4,paginaIndicePDF:6,
 tituloLeccion:'¿Cómo surgieron los Estados nacionales?'},
 {topic:'Formación del Estado-nación en Chile',terms:['formacion del estado-nacion','formacion del estado nacion','estado nacional chileno'],unidad:1,leccion:3,comienzoLibro:44,paginaIndiceImpresa:4,paginaIndicePDF:6,
 tituloLeccion:'¿Cómo se formó el Estado-nación en Chile?'},
 {topic:'Revolución Industrial',terms:['revolucion industrial','industrializacion','mundo industrializado'],unidad:2,leccion:1,comienzoLibro:66,paginaIndiceImpresa:4,paginaIndicePDF:6,
 tituloLeccion:'El mundo industrializado: ¿un mundo mejor?'},
 {topic:'Imperialismo y Primera Guerra Mundial',terms:['imperialismo','primera guerra mundial'],unidad:2,leccion:2,comienzoLibro:92,paginaIndiceImpresa:4,paginaIndicePDF:6,
 tituloLeccion:'Imperialismo y Primera Guerra Mundial: ¿la crisis del progreso?'},
 {topic:'Exploración del territorio chileno',terms:['exploracion y reconocimiento del territorio','reconocimiento del territorio'],unidad:3,leccion:1,comienzoLibro:140,paginaIndiceImpresa:5,paginaIndicePDF:7,
 tituloLeccion:'Exploración y reconocimiento del territorio'},
 {topic:'Expansión territorial chilena',terms:['guerra del pacifico','ocupacion de la araucania','expansion territorial'],unidad:3,leccion:2,comienzoLibro:152,paginaIndiceImpresa:5,paginaIndicePDF:7,
 tituloLeccion:'¿Cómo fueron las políticas de expansión territorial de Chile en el siglo XIX?'},
 {topic:'Pueblos originarios',terms:['pueblos originarios','pueblos indigenas'],unidad:3,leccion:3,comienzoLibro:178,paginaIndiceImpresa:5,paginaIndicePDF:7,
 tituloLeccion:'¿Cómo son las relaciones con los pueblos originarios hoy?'},
 {topic:'Funcionamiento del mercado',terms:['oferta y demanda','mercado','consumo responsable'],unidad:4,leccion:2,comienzoLibro:210,paginaIndiceImpresa:5,paginaIndicePDF:7,
 tituloLeccion:'¿Cómo funciona el mercado?'}
];
const normalize=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function candidates(plan={}){
 if(require('./oa-documentary-register.cjs').family(plan.asignatura)!=='sociales'||!plan.usarTextosEscolares)return[];
 const topic=normalize(plan.temaEspecifico);
 if(topic.length<6)return[];
 return sample.filter(x=>x.terms.some(t=>topic.includes(normalize(t)))).slice(0,4).map(x=>({
  pais:'CL',tipo:'indice_de_libro_inspeccionado',estado:'indice_pdf_inspeccionado_contenido_leccion_no_leido',
  titulo:'Texto del estudiante · Historia 1° medio Santillana (edición 2020, muestra Mineduc)',
  tituloLeccion:x.tituloLeccion,temaIndice:x.topic,
  unidadRegular:x.unidad,leccionRegular:x.leccion,paginaInicioLeccionImpresa:x.comienzoLibro,
  paginaIndiceImpresa:x.paginaIndiceImpresa,paginaIndicePDF:x.paginaIndicePDF,
  paginaPDF:null,paginaImpresa:null,capitulo:null,fragmentoId:null,
  fuente:'Mineduc · muestra del Texto del Estudiante Historia 1° medio, Santillana',
  url:PDF+'#page='+x.paginaIndicePDF,
  correspondencia:{tipo:'ubicacion_confirmada_en_indice_del_pdf',criterio:'Título, lección y página de comienzo comprobados visualmente en el índice del PDF oficial de muestra. No se examinó el desarrollo de la lección ni se homologó el OA regular con EPJA.'},
  uso:'Referencia para abrir y leer la lección. NO utilizar como cita del contenido del libro.'
 }));
}
module.exports={PDF,sample,candidates};
