/* Matriz OA EPJA ↔ documentos consultados. No infiere libros/páginas desde catálogos. */
'use strict';
const crypto=require('node:crypto');
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const words=v=>new Set(normalize(v).match(/[a-zñ]{5,}/g)||[]);
const stop=new Set('sobre entre desde hasta puede deben donde cuando estos estas otras otros estudio nivel adultos educacion escolar aprendizaje objetivo comprender analizar explicar desarrollar identificar reconocer describir relacionar caracterizar evaluar chile mexico'.split(' '));
const overlap=(text,context)=>{
 const a=words(text),b=words(context);
 return [...a].filter(w=>!stop.has(w)&&[...b].some(q=>q===w||(w.length>8&&q.length>8&&w.slice(0,7)===q.slice(0,7)))).slice(0,12);
};
const countryFor=d=>d.country==='MX'?'MX':'CL';
const idFor=plan=>crypto.createHash('sha256').update(JSON.stringify([plan.marcoCurricular||'',plan.nivel||'',plan.asignatura||'',plan.objetivoAprendizaje||''])).digest('hex').slice(0,20);
function build(plan={},catalog={},bundle={}){
 const enabled=plan.usarTextosEscolares===true;
 const objective=String(plan.objetivoAprendizaje||'').trim();
 const subject=String(plan.asignatura||'').trim();
 const topic=String(plan.temaEspecifico||'').trim();
 const matrix={
  version:1,oaKey:idFor(plan),oaLiteral:objective,marco:plan.marcoCurricular||'',nivel:plan.nivel||'',asignatura:subject,tema:topic,
  enabled,estado:enabled?'sin_paginas_de_libros_verificadas':'desactivado',registros:[],
  cobertura:{CL:{catalogos:0,fragmentosLibro:0,fragmentosOtros:0},MX:{catalogos:0,fragmentosLibro:0,fragmentosOtros:0}},
  alcance:'Matriz por encargo de HEVA. Una página extraída de PDF acredita disponibilidad documental, no equivalencia curricular, exactitud semántica ni aprobación docente. Sin capítulo comprobado, el capítulo queda pendiente.'
 };
 if(!enabled||!objective)return matrix;
 // Catálogos SEP/Chile solo son candidatos bibliográficos; nunca fuentes de contenido.
 for(const item of (Array.isArray(catalog.items)?catalog.items:[]).slice(0,30)){
  if(!item?.url||!/^https:\/\//i.test(item.url))continue;
  const country=countryFor(item);
  matrix.registros.push({pais:country,tipo:'catalogo',estado:'candidato_sin_pdf_verificado',
   titulo:String(item.title||'Catálogo educativo').slice(0,220),fuente:item.source||'',url:item.url,
   capitulo:null,paginaPDF:null,paginaImpresa:null,fragmentoId:null,
   correspondencia:{tipo:'orientacion_bibliografica',criterio:'Coincidencia preliminar de asignatura y términos compartidos entre OA y tema; sin homologación EPJA.'},
   uso:'Solo localizar un documento que un docente pueda revisar. Prohibido atribuir contenido al catálogo.'});
  matrix.cobertura[country].catalogos++;
 }
 const documents=new Map((Array.isArray(bundle.documents)?bundle.documents:[]).filter(d=>d?.id).map(d=>[d.id,d]));
 const fragments=(Array.isArray(bundle.fragments)?bundle.fragments:[]);
 const context=objective+' '+topic;
 for(const f of fragments){
  const doc=documents.get(f?.documentId);
  if(!doc||doc.status!=='consultada'||doc.role!=='contenido'||typeof f.text!=='string'||!f.text.trim()||
   !Number.isInteger(f.page)||f.page<1||!/^https:\/\//.test(f.url||'')||
   !/^[a-f0-9]{64}$/i.test(String(f.sha256||''))||f.sha256!==doc.sha256)continue;
  const matches=overlap(f.text,context);
  if(!matches.length)continue;
  const isBook=doc.optInTextbook===true&&doc.modalidad==='regular';
  const country=countryFor(doc);
  const title=String(doc.title||f.title||'PDF oficial').slice(0,220);
  const snippet=f.text.replace(/\s+/g,' ').trim().slice(0,350);
  const pageEnd=Number.isInteger(f.pageEnd)&&f.pageEnd>=f.page?f.pageEnd:f.page;
  matrix.registros.push({pais:country,tipo:isBook?'fragmento_libro':'fragmento_documental',
   estado:isBook?'pagina_pdf_localizada_pendiente_revision':'documento_regular_localizado_pendiente_revision',
   titulo:title,fuente:doc.publisher||'',url:f.url,edicion:doc.edition||'',
   modalidad:doc.modalidad||'',capitulo:null,paginaPDF:f.page,paginaPDFHasta:pageEnd,paginaImpresa:null,
   fragmentoId:f.id,huellaPDF:doc.sha256,fechaConsulta:doc.checkedAt||null,
   extractoVerificable:snippet,terminosCoincidentes:matches,
   correspondencia:{tipo:'coincidencia_textual_no_equivalencia',criterio:'Texto extraído de página del PDF y términos de OA/tema; pertinencia disciplinar pendiente de validación docente.'},
   uso:isBook?'Posible apoyo conceptual o ejemplo; contrastar OA, contexto y precisión antes de emplearlo.':'Fuente auxiliar de contenido regular; no es un libro de texto ni reemplaza EPJA.'});
  if(isBook)matrix.cobertura[country].fragmentosLibro++;
  else matrix.cobertura[country].fragmentosOtros++;
 }
 // Solo páginas extraídas de un libro identificado permiten afirmar evidencia documental de libro.
 if(matrix.cobertura.CL.fragmentosLibro+matrix.cobertura.MX.fragmentosLibro>0)matrix.estado='pagina_de_libro_localizada_pendiente_validacion_docente';
 else if(matrix.cobertura.CL.fragmentosOtros+matrix.cobertura.MX.fragmentosOtros>0)matrix.estado='fuentes_regulares_localizadas_sin_paginas_de_libros';
 else if(matrix.registros.length)matrix.estado='solo_catalogos_pendientes_verificacion';
 return matrix;
}
function instruction(matrix){
 if(!matrix?.enabled)return '';
 const refs=matrix.registros.filter(r=>r.tipo==='fragmento_libro');
 const evidence=refs.map(r=>({pais:r.pais,titulo:r.titulo,paginaPDF:r.paginaPDF,paginaPDFHasta:r.paginaPDFHasta,fragmentoId:r.fragmentoId,terminos:r.terminosCoincidentes})).slice(0,4);
 return '\nMATRIZ OA–TEXTOS ESCOLARES: El OA EPJA chileno literal y su marco son prioritarios. '+(evidence.length?'Se localizaron fragmentos PDF de texto escolar identificados, con estas páginas reales para contrastar: '+JSON.stringify(evidence)+'. Los extractos están en FUENTES DOCUMENTALES RECUPERADAS y solo se pueden usar si están allí.':'No hay páginas de libros de texto comprobadas para este encargo; cualquier catálogo chileno o mexicano es solo una pista, NO respaldo de contenido.')+' No atribuyas capítulos, páginas impresas, imágenes, ilustraciones, hechos, actividades ni citas de México o Chile no recuperados. No asumas equivalencia entre grados de SEP, educación regular y EPJA chilena. Formula actividades originales conforme al OA; revisión docente de pertinencia pendiente.';
}
module.exports={build,instruction,overlap,idFor};
