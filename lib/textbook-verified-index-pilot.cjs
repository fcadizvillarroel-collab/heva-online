/* Cotejo bibliográfico inicial, documentado y NO homologación curricular EPJA.
   Chile: índice oficial UCE (2023) de páginas del texto escolar regular.
   México: ficha y visor CONALITEG 2026–2027. El lector no acredita texto de páginas.
   Ninguna página de índice constituye una página inspeccionada del libro. */
'use strict';
const CHILE_INDEX='https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-334761_objetivos_textos.pdf';
const CHILE_BOOK='https://aprendoenlinea.mineduc.gob.cl/recursos/historia-geografia-ciencias-sociales-1-medio-santillana-texto-estudiante';
const SEP_INDEX='https://libros.conaliteg.gob.mx/secundaria.html';
const sepViewer='https://libros.conaliteg.gob.mx/pdf-reader/reader.html?ciclo=2026&clave=S1ETA&nivel=secundaria';
const mapping=[
 {regularOA:'HI1M OA 01',topic:'Ideas republicanas, liberalismo y Estado en siglo XIX',terms:['liberalismo','liberal','republicana','republicanas','constitucionalismo','parlamentarismo'],unit:'1',lesson:'1',printed:'18 a 25, 28 a 31',indexPage:176},
 {regularOA:'HI1M OA 03',topic:'Estado nación, nacionalismo y soberanía',terms:['nacionalismo','estado nacion','estado-nacion','soberania','unificacion'],unit:'1',lesson:'2',printed:'34 a 39, 42, 43, 50, 51, 56, 57, 63',indexPage:176},
 {regularOA:'HI1M OA 07',topic:'Primera Guerra Mundial y sociedad civil',terms:['primera guerra mundial','gran guerra','1914','1918'],unit:'2',lesson:'2',printed:'104 a 109, 111',indexPage:176},
 {regularOA:'HI1M OA 08',topic:'Ensayos constitucionales y Constitución de 1833',terms:['1833','ensayos constitucionales','formacion de la republica'],unit:'1',lesson:'3',printed:'44 a 49, 53 a 55, 59',indexPage:176},
 {regularOA:'HI1M OA 10',topic:'Exportaciones, industrialización y economía chilena del XIX',terms:['industrializacion','mercados internacionales','hacienda','inquilinaje','exportacion'],unit:'2',lesson:'1',printed:'80, 81',indexPage:176},
 {regularOA:'HI1M OA 12',topic:'Exploración, reconocimiento y delimitación del territorio chileno',terms:['exploracion del territorio','reconocimiento del territorio','misiones cientificas','delimitacion'],unit:'3',lesson:'1',printed:'140, 141, 144 a 151',indexPage:177},
 {regularOA:'HI1M OA 14',topic:'Ocupación de la Araucanía y sociedad mapuche',terms:['ocupacion de la araucania','reducciones mapuches','sociedad mapuche','ocupacion araucania'],unit:'3',lesson:'2',printed:'160 a 167, 174',indexPage:177},
 {regularOA:'HI1M OA 15',topic:'Guerra del Pacífico y salitre',terms:['guerra del pacifico','salitre','1879'],unit:'3',lesson:'2',printed:'168, 169, 172 a 175',indexPage:177},
 {regularOA:'HI1M OA 18',topic:'Cuestión social y transformaciones del cambio de siglo',terms:['cuestion social','movimiento obrero','demandas populares'],unit:'2',lesson:'4',printed:'124 a 127, 130 a 134',indexPage:177},
 {regularOA:'HI1M OA 20',topic:'Oferta, demanda, colusión y funcionamiento del mercado',terms:['oferta y demanda','colusion','monopolio','inflacion'],unit:'4',lesson:'2',printed:'210 a 213, 216 a 221',indexPage:177},
 {regularOA:'HI1M OA 23',topic:'Posturas políticas frente a la cuestión social',terms:['anarquismo','socialcristianismo','socialismo','comunismo','cuestion social'],unit:'2',lesson:'4',printed:'128, 129',indexPage:177},
 {regularOA:'HI1M OA 24',topic:'Pueblos indígenas y relaciones de conflicto y convivencia',terms:['pueblos indigenas','diversidad cultural','conflicto mapuche'],unit:'3',lesson:'2, 3',printed:'179 a 183, 186 a 192',indexPage:178},
 {regularOA:'HI1M OA 25',topic:'Industrialización, medioambiente y desarrollo sostenible',terms:['desarrollo sostenible','impacto ambiental','contaminacion industrial'],unit:'2',lesson:'1',printed:'86 a 89',indexPage:178}
];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function candidates(plan={}){
 const family=require('./oa-documentary-register.cjs').family(plan.asignatura);
 if(family!=='sociales')return [];
 const topic=norm(plan.temaEspecifico),objective=norm(plan.objetivoAprendizaje);
 // Coincidencia de tema específico es OBLIGATORIA; nunca solo un término genérico en el OA.
 if(topic.length<5)return [];
 return mapping.filter(row=>row.terms.some(t=>topic.includes(norm(t)))).slice(0,4).map(row=>({
  pais:'CL',tipo:'indice_paginas_texto_regular',estado:'pagina_indicada_por_indice_oficial_no_inspeccionada',
  titulo:'Historia, Geografía y Ciencias Sociales · 1° medio regular · texto 2023',
  temaIndice:row.topic,oaRegular:row.regularOA,unidadRegular:row.unit,leccionRegular:row.lesson,
  paginasTEIndicadas:row.printed,paginaIndicePDF:null,paginaIndiceImpresa:row.indexPage,
  fuente:'UCE · Mineduc · Visualización OA priorizados en textos escolares 2023',
  url:CHILE_INDEX,libroFicha:CHILE_BOOK,fragmentoId:null,paginaPDF:null,paginaImpresa:null,capitulo:null,
  correspondencia:{tipo:'coincidencia_tematica_preliminar',criterio:'Índice UCE 2023 confirma solo páginas TE para OA de educación regular; NO confirma contenido leído ni equivalencia con OA EPJA.'},
  uso:'Localizar páginas del libro regular para revisión docente. No usar como citas ni atribuir hechos o actividades al libro sin inspeccionar el texto completo.'
 }));
}
function mexicoBook(){
 return {pais:'MX',tipo:'ficha_libro_oficial',estado:'titulo_y_visor_catalogados_sin_paginas_leidas',
  titulo:'Colección Ximhai · Ética, naturaleza y sociedades · primer grado secundaria',
  fuente:'SEP · CONALITEG · catálogo 2026–2027',url:SEP_INDEX,visor:sepViewer,
  ciclo:'2026–2027',grado:'1° secundaria regular',paginaPDF:null,capitulo:null,fragmentoId:null,
  correspondencia:{tipo:'catalogo_oficial',criterio:'Título y visor oficial comprobados. El contenido del volumen y sus páginas NO fueron extraídos; no existe equivalencia curricular automática.'}};
}
module.exports={CHILE_INDEX,CHILE_BOOK,SEP_INDEX,mapping,candidates,mexicoBook};
