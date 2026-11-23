/* Inventario determinista de brechas documentales para los OA publicados.
  NO confunde la aprobación del catálogo curricular con cotejo de libros. */
'use strict';
const catalog=require('../catalogo-publicado.json');
const SEP=require('./sep-textbook-catalog.cjs');
const normalize=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function family(subject){
 const s=normalize(subject);
 if(/construccion|metal/.test(s))return 'tp_metal';
 if(/convivencia|responsabilidad personal/.test(s))return 'convivencia';
 if(/insercion laboral/.test(s))return 'laboral';
 if(/emprendimiento|empleabilidad/.test(s))return 'emprendimiento';
 if(/pensamiento computacional|tecnolog/.test(s))return 'digital';
 if(/financiera/.test(s))return 'financiera';
 if(/consumo/.test(s))return 'consumo';
 if(/historia|social|ciudadana/.test(s))return 'sociales';
 if(/matemat/.test(s))return 'matematica';
 if(/lengua|lenguaje|comunicacion/.test(s))return 'lenguaje';
 if(/ciencia|biolog|fisic|quimic/.test(s))return 'ciencias';
 if(/ingles|extranjero/.test(s))return 'ingles';
 if(/filosof/.test(s))return 'filosofia';
 if(/arte|artist|visual/.test(s))return 'artes';
 if(/educacion fisica|salud/.test(s))return 'educacion_fisica';
 return 'otra';
}
const mxLinkByFamily=Object.fromEntries(Object.entries(SEP.fields).map(([id,entries])=>[id,entries?.[0]?{url:entries[0].url,campo:entries[0].title,ciclo:entries[0].cycle}:null]));
const chileanIndex='https://www.curriculumnacional.cl/textos_escolares';
function items(){
 return catalog.map(oa=>{
  const grupo=family(oa.asignatura);
  const mexico=mxLinkByFamily[grupo]||null;
  return {
   oaCodigo:oa.codigo_oficial,
   marco:oa.marco,
   asignatura:oa.asignatura,
   etapa:oa.etapa,
   nivel:oa.nivel,
   grupo,
   objetivoCatalogado:oa.estado==='APROBADO'&&oa.referencia_comprobada===true,
   fuenteCurricular:oa.fuente_documento,
   paginaCurricularDeclarada:oa.pagina_oficial||null,
   // Ningún registro declara capítulos, libros o páginas de texto consultados.
   estadoLibro:'PENDIENTE_COTEJO_DOCUMENTAL',
   fuenteChileCandidata:{tipo:'indice_educacion_regular',url:chileanIndex,libroId:null,capitulo:null,paginaPDF:null},
   fuenteMexicoCandidata:mexico?{tipo:'indice_conaliteg',url:mexico.url,campo:mexico.campo,ciclo:mexico.ciclo,libroId:null,capitulo:null,paginaPDF:null}:null,
   extractosVerificados:[],
   actividadesConCitaValidada:[],
   aprobacionPedagogica:'PENDIENTE'
  };
 });
}
function summary(rows=items()){
 const count=(key,value)=>rows.filter(x=>x[key]===value).length;
 const grouped=Object.fromEntries([...new Set(rows.map(x=>x.grupo))].sort().map(group=>[group,rows.filter(x=>x.grupo===group).length]));
 return {
  objetivosTotales:rows.length,
  objetivosCurricularesAprobados:rows.filter(x=>x.objetivoCatalogado).length,
  marcos:Object.fromEntries([...new Set(rows.map(x=>x.marco))].sort().map(m=>[m,rows.filter(x=>x.marco===m).length])),
  grupos:grouped,
  conCatalogoMexico:rows.filter(x=>x.fuenteMexicoCandidata).length,
  paginasLibroCotejadas:rows.filter(x=>x.extractosVerificados.length).length,
  oaConActividadesDocumentadas:rows.filter(x=>x.actividadesConCitaValidada.length).length,
  aprobacionesPedagogicas:count('aprobacionPedagogica','APROBADO'),
  aviso:'Los 407 OA pertenecen al catálogo curricular. Los enlaces mexicanos/chilenos son propuestas de consulta; no acreditan libro, capítulo, página, equivalencia ni revisión docente.'
 };
}
function findByPlan(plan={}){
 const norm=normalize;
 const target=norm(plan.objetivoAprendizaje).replace(/\s+/g,' ').trim();
 if(target.length<24)return null;
 const candidates=catalog.filter(x=>norm(x.texto_literal).replace(/\s+/g,' ').trim()===target);
 if(!candidates.length)return null;
 // La misma redacción en varios marcos no autoriza adjudicar un código sin contexto.
 const framework=norm(plan.marcoCurricular||'');
 const byFramework=candidates.filter(x=>framework.includes('257')?x.marco==='Decreto 257':/2024|bases/.test(framework)?x.marco==='Bases 2024':false);
 if(byFramework.length!==1)return null;
 const x=byFramework[0],registro=items().find(r=>r.oaCodigo===x.codigo_oficial);
 if(!registro)return null;
 const chosenSubject=family(plan.asignatura);
 if(chosenSubject!==registro.grupo)return null;
 return registro;
}
// A missing literal PDF extraction match is a technical detection limitation.
// It is NOT a reason to reopen a confirmed and published EPJA objective.
function requiresCurricularSourceReview(plan={},sourceStatus=''){
 return sourceStatus!=='localizado_literalmente'&&!findByPlan(plan)?.objetivoCatalogado;
}
module.exports={items,summary,findByPlan,family,requiresCurricularSourceReview};
