/* Referencias documentales oficiales (ÍNDICES, no páginas de libros examinadas).
 UCE: Visualización OA priorizados en textos 2023, Historia 2° medio, págs. impresas 193-195.
 SEP: CONALITEG secundaria 2026–2027, títulos y lectores oficiales por grado.
 El marco EPJA sigue siendo el único objetivo curricular exigible. */
'use strict';
const INDEX='https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-334761_objetivos_textos.pdf';
const SEP='https://libros.conaliteg.gob.mx/secundaria.html';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const entries=[
 {oa:'HI2M OA 02',tema:'Crisis de 1929, totalitarismos y crisis del liberalismo',terms:['1929','gran depresion','totalitarismo','fascismo','nazismo'],unidad:'1',leccion:'2',paginas:'24 a 35, 37, 42, 43',pagIndice:193},
 {oa:'HI2M OA 04',tema:'Segunda Guerra Mundial, descolonización, ONU y DD. HH.',terms:['segunda guerra mundial','descolonizacion','creacion de la onu','posguerra'],unidad:'1',leccion:'3',paginas:'48 a 51',pagIndice:193},
 {oa:'HI2M OA 07',tema:'Actores sociales y cultura de masas en Chile',terms:['cultura de masas','ciudadania politica de las mujeres','clase media','radio y cine'],unidad:'1',leccion:'4',paginas:'68 a 74, 77',pagIndice:193},
 {oa:'HI2M OA 08',tema:'Guerra Fría y confrontación bipolar',terms:['guerra fria','bloque occidental','bloque oriental','pacto de varsovia'],unidad:'2',leccion:'1',paginas:'84 a 99',pagIndice:193},
 {oa:'HI2M OA 10',tema:'Revolución Cubana y procesos latinoamericanos',terms:['revolucion cubana','revolucion y reforma','golpes de estado latinoamerica'],unidad:'2',leccion:'2',paginas:'104',pagIndice:193},
 {oa:'HI2M OA 11',tema:'Fin de la Guerra Fría y globalización',terms:['fin de la guerra fria','globalizacion','caida de la urss','sociedad de la informacion'],unidad:'2',leccion:'2',paginas:'112 a 119',pagIndice:194},
 {oa:'HI2M OA 12',tema:'Pobreza urbana y migración campo-ciudad',terms:['migracion campo ciudad','migracion campo-ciudad','pobreza urbana','marginalidad urbana'],unidad:'2',leccion:'3',paginas:'122 a 127',pagIndice:194},
 {oa:'HI2M OA 15',tema:'Golpe de Estado de 1973 e interpretaciones historiográficas',terms:['golpe de estado de 1973','quiebre de la democracia'],unidad:'2',leccion:'4',paginas:'150 a 153, 155',pagIndice:194},
 {oa:'HI2M OA 16',tema:'Dictadura militar y violaciones de derechos humanos',terms:['dictadura militar en chile','violaciones de derechos humanos','supresion del estado de derecho'],unidad:'3',leccion:'1',paginas:'162 a 171, 173',pagIndice:194},
 {oa:'HI2M OA 17',tema:'Modelo económico neoliberal en Chile',terms:['modelo economico neoliberal','neoliberalismo en chile','privatizaciones'],unidad:'3',leccion:'2',paginas:'174 a 181, 184, 185',pagIndice:195},
 {oa:'HI2M OA 19',tema:'Recuperación de la democracia en Chile',terms:['recuperacion de la democracia','protestas de 1983','decada de 1980'],unidad:'3',leccion:'3',paginas:'188 a 193',pagIndice:195},
 {oa:'HI2M OA 20',tema:'Transición democrática y plebiscito de 1988',terms:['transicion a la democracia','plebiscito de 1988'],unidad:'3',leccion:'3',paginas:'194 a 201',pagIndice:195},
 {oa:'HI2M OA 22',tema:'Declaración y protección de derechos humanos',terms:['derechos humanos','declaracion universal de derechos humanos'],unidad:'4',leccion:'1',paginas:'220 a 226',pagIndice:195},
 {oa:'HI2M OA 25',tema:'Diversidad, dignidad y no discriminación',terms:['no discriminacion','diversidad cultural','dignidad humana'],unidad:'4',leccion:'3',paginas:'250 a 259',pagIndice:195}
];
const books=[
 {grado:1,campo:'Ética, naturaleza y sociedades',coleccion:'Ximhai',clave:'S1ETA',familias:['sociales']},
 {grado:2,campo:'Ética, naturaleza y sociedades',coleccion:'Sk´asolil',clave:'S2ETA',familias:['sociales']},
 {grado:3,campo:'Ética, naturaleza y sociedades',coleccion:'Nanahuatzin',clave:'S3ETA',familias:['sociales']},
 {grado:1,campo:'Saberes y pensamiento científico',coleccion:'Ximhai',clave:'S1SAA',familias:['matematica','ciencias']},
 {grado:2,campo:'Saberes y pensamiento científico',coleccion:'Sk´asolil',clave:'S2SAA',familias:['matematica','ciencias']},
 {grado:3,campo:'Saberes y pensamiento científico',coleccion:'Nanahuatzin',clave:'S3SAA',familias:['matematica','ciencias']}
];
function chile(plan={}){
 if(require('./oa-documentary-register.cjs').family(plan.asignatura)!=='sociales')return [];
 const topic=norm(plan.temaEspecifico).trim();
 if(topic.length<7)return [];
 return entries.filter(x=>x.terms.some(t=>topic.includes(t))).slice(0,5).map(x=>({
  pais:'CL',tipo:'indice_paginas_texto_regular',estado:'pagina_indicada_por_indice_oficial_no_inspeccionada',
  titulo:'Historia, Geografía y Ciencias Sociales · 2° medio regular · índice UCE 2023',
  temaIndice:x.tema,oaRegular:x.oa,unidadRegular:x.unidad,leccionRegular:x.leccion,
  paginasTEIndicadas:x.paginas,paginaIndiceImpresa:x.pagIndice,paginaPDF:null,capitulo:null,fragmentoId:null,
  fuente:'UCE · Mineduc · Visualización OA priorizados en textos escolares 2023',url:INDEX,
  correspondencia:{tipo:'coincidencia_tematica_preliminar',criterio:'Unidad, lección y páginas TE del OA regular declaradas en índice UCE. No es una homologación de OA EPJA ni acredita contenido del libro.'},
  uso:'Solo para localizar el libro y cotejar sus páginas en una revisión posterior; no citar texto no consultado.'
 }));
}
function mexico(plan={}){
 const family=require('./oa-documentary-register.cjs').family(plan.asignatura);
 if(!plan.usarTextosEscolares||!['sociales','ciencias','matematica'].includes(family))return [];
 return books.filter(x=>x.familias.includes(family)).map(x=>({
  pais:'MX',tipo:'ficha_libro_oficial',estado:'titulo_y_visor_catalogados_sin_paginas_leidas',
  titulo:'Colección '+x.coleccion+' · '+x.campo+' · '+x.grado+'° grado de secundaria',
  grado:x.grado,campo:x.campo,ciclo:'2026–2027',fuente:'SEP · CONALITEG',
  url:SEP,visor:'https://libros.conaliteg.gob.mx/pdf-reader/reader.html?ciclo=2026&clave='+x.clave+'&nivel=secundaria',
  paginaPDF:null,capitulo:null,fragmentoId:null,
  correspondencia:{tipo:'catalogo_oficial',criterio:'Ficha y visor enlazados desde el catálogo oficial 2026–2027. No se leyó el volumen ni se comprobó equivalencia de grado o OA EPJA.'},
  uso:'Abrir y cotejar un contenido concreto antes de usarlo. No asumir que el contenido corresponde al OA EPJA.'
 }));
}
module.exports={INDEX,SEP,entries,books,chile,mexico};
