/* Matriz OA EPJA ↔ documentos consultados. No infiere libros/páginas desde catálogos. */
'use strict';
const crypto=require('node:crypto');
const OACoverage=require('./oa-documentary-register.cjs');
const TextbookIndex=require('./textbook-verified-index-pilot.cjs');
const SecondIndex=require('./textbook-verified-index-2medio.cjs');
const InspectedSample=require('./textbook-sample-inspection.cjs');
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
  oaCatalogo:(()=>{const r=OACoverage.findByPlan(plan);return r?{codigo:r.oaCodigo,marco:r.marco,fuente:r.fuenteCurricular,paginaCurricularDeclarada:r.paginaCurricularDeclarada,estado:'catalogado_sin_validacion_de_libros'}:null;})(),
  verificacionOA:{estado:'pendiente_cotejo_literal',documento:null,paginaPDF:null,fuenteId:null},
  fichasDeLibrosIdentificadas:0,indicesConPaginasTE:0,indicesPDFInspeccionados:0,
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
 // Fuentes externas YA COTEJADAS a nivel de ficha/índice: jamás contabilizar
 // páginas TE declaradas en un índice como páginas del libro realmente leídas.
 const regularIndex=[...TextbookIndex.candidates(plan),...SecondIndex.chile(plan)];
 for(const record of regularIndex)matrix.registros.push(record);
 matrix.indicesConPaginasTE=regularIndex.length;
 const inspectedIndex=InspectedSample.candidates(plan);
 matrix.registros.push(...inspectedIndex);
 matrix.indicesPDFInspeccionados=inspectedIndex.length;
 const mexicanCatalogBooks=SecondIndex.mexico(plan);
 // Las fichas mexicanas quedan seleccionadas por familia disciplinar, NUNCA
 // por equivalencia de niveles EPJA. No son evidencia del contenido.
 matrix.registros.push(...mexicanCatalogBooks);
 matrix.fichasDeLibrosIdentificadas=mexicanCatalogBooks.length;
  const documents=new Map((Array.isArray(bundle.documents)?bundle.documents:[]).filter(d=>d?.id).map(d=>[d.id,d]));
 const fragments=(Array.isArray(bundle.fragments)?bundle.fragments:[]);
 // Un campo 'uso: objetivo_literal' enviado por el cliente NO constituye prueba
 // de que el OA aparece literalmente en el documento: comprobar el texto y hash.
 const literal=s=>String(s||'').normalize('NFC').replace(/\\s+/g,' ').trim();
 const exact=objective.length>=24?fragments.find(f=>f?.uso==='objetivo_literal'&&f?.documentId&&
  documents.get(f.documentId)?.role==='curriculo'&&documents.get(f.documentId)?.status==='consultada'&&
  Number.isInteger(f.page)&&f.page>=1&&typeof f.text==='string'&&
  /^[a-f0-9]{64}$/i.test(String(f.sha256||''))&&documents.get(f.documentId)?.sha256===f.sha256&&
  /^https:\/\//.test(f.url||'')&&literal(f.text).includes(literal(objective))):null;
 if(exact){
  const original=documents.get(exact.documentId);
  matrix.verificacionOA={estado:'localizado_literalmente_en_pdf_epja',documento:original.title||'Marco EPJA',paginaPDF:exact.page,fuenteId:exact.id};
 }
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
 else if(matrix.indicesConPaginasTE||matrix.indicesPDFInspeccionados)matrix.estado='indices_oficiales_con_paginas_te_pendientes_lectura';
 else if(matrix.registros.length)matrix.estado='solo_catalogos_pendientes_verificacion';
 return matrix;
}
function instruction(matrix){
 if(!matrix?.enabled)return '';
 const refs=matrix.registros.filter(r=>r.tipo==='fragmento_libro');
 const evidence=refs.map(r=>({pais:r.pais,titulo:r.titulo,paginaPDF:r.paginaPDF,paginaPDFHasta:r.paginaPDFHasta,fragmentoId:r.fragmentoId,terminos:r.terminosCoincidentes})).slice(0,4);
 return '\nMATRIZ OA–TEXTOS ESCOLARES: El OA EPJA chileno literal y su marco son prioritarios. '+(matrix.oaCatalogo?'Objetivo identificado en el catálogo EPJA publicado: '+matrix.oaCatalogo.codigo+' ('+matrix.oaCatalogo.marco+'). La página declarada del marco curricular NO es una página de libro escolar. ':'Objetivo sin correspondencia inequívoca en el catálogo publicado: no inventes código de OA. ')+(evidence.length?'Se localizaron fragmentos PDF de texto escolar identificados, con estas páginas reales para contrastar: '+JSON.stringify(evidence)+'. Los extractos están en FUENTES DOCUMENTALES RECUPERADAS y solo se pueden usar si están allí.':'No hay páginas de libros de texto comprobadas para este encargo; cualquier catálogo chileno o mexicano es solo una pista, NO respaldo de contenido.')+' Las referencias de índice UCE 2023 (páginas TE) son ubicaciones históricas de EDUCACIÓN REGULAR, NO fragmentos de PDF extraídos ni citas ni evidencia de cumplimiento OA EPJA.'+' Algunas páginas de índice de un PDF de muestra 2020 se inspeccionaron directamente: indican únicamente dónde empieza una lección, NO su contenido. Nunca cites ese índice como respaldo de los hechos históricos.'+' No atribuyas capítulos, páginas impresas, imágenes, ilustraciones, hechos, actividades ni citas de México o Chile no recuperados. No asumas equivalencia entre grados de SEP, educación regular y EPJA chilena. Formula actividades originales conforme al OA; revisión docente de pertinencia pendiente.';
}
function linkActivities(matrix,evidence=[]){
 const result={...matrix,vinculosActividades:[]};
 if(!matrix?.enabled||!Array.isArray(evidence))return result;
 // No basta con que el generador devuelva un ID y una página: se coteja
 // literalmente la cita contra el extracto de esa página consultada.
 const literal=v=>String(v||'').normalize('NFC').replace(/\s+/g,' ').trim();
 const sources=new Map((matrix.registros||[]).filter(x=>
  ['fragmento_libro','fragmento_documental'].includes(x.tipo)&&
  x.fragmentoId&&Number.isInteger(x.paginaPDF)&&
  typeof x.extractoVerificable==='string'&&x.extractoVerificable.trim()
 ).map(x=>[x.fragmentoId,x]));
 const seen=new Set();
 for(const item of evidence.slice(0,40)){
  const doc=sources.get(item?.fuenteId);
  const citation=literal(item?.cita);
  const section=typeof item?.seccion==='string'?item.seccion.trim():'';
  if(!doc||!section||citation.length<12||citation.length>180||
    !Number.isInteger(item.page)||item.page!==doc.paginaPDF||
    !literal(doc.extractoVerificable).includes(citation))continue;
  const key=section+'|'+doc.fragmentoId+'|'+citation;
  if(seen.has(key))continue;
  seen.add(key);
  result.vinculosActividades.push({
   seccion:String(item.seccion).slice(0,100),
   fuenteId:item.fuenteId,
   pais:doc.pais,tipoFuente:doc.tipo,titulo:doc.titulo,paginaPDF:doc.paginaPDF,url:doc.url,
   afirmacion:String(item.afirmacion||'').slice(0,250),citaComprobada:citation,
   estado:'vinculo_documental_literal_validado_pendiente_pertinencia_docente'
  });
 }
 return result;
}
module.exports={build,instruction,linkActivities,overlap,idFor};
