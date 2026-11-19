/* Conservative OA approval audit: declarations are evidence, not proof of correctness. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVAApprovalAudit=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const plain=x=>String(x||'').trim();
const isDate=x=>/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(plain(x))&&!Number.isNaN(Date.parse(x));
function review({material={},sections=[],visuals=[]}={}){
 const issues=[],add=(code,detail)=>issues.push({code,detail});
 const type=plain(material.tipoMaterial).toUpperCase();
 const teaching=['GUIA','TALLER','PRESENTACION','ACCESIBLE','PRUEBA','EVALUACION'].includes(type);
 const review=material.revisionPedagogica||{},visualReview=material.revisionVisual||{};
 const oa=plain(material.objetivoAprendizaje||material.oaTexto);
 const sectionsText=sections.map(s=>typeof s==='string'?s:JSON.stringify(s||{})).join(' ').trim();
 if(teaching&&sectionsText.length<180)add('CONTENIDO_INSUFICIENTE','El material requiere desarrollo disciplinar concreto; una estructura o títulos aislados no bastan.');
 if(teaching&&/(?:\b(?:ejemplo pendiente|contenido por desarrollar|lorem ipsum)\b|\bpaso [123]\s*(?:[:.\-]?\s*$|[:.\-]?\s*(?=paso [123]\b)))/i.test(sectionsText))add('MARCADOR_SIN_DESARROLLAR','Hay marcadores o actividades sin desarrollar.');
 if(teaching&&!oa)add('OA_SIN_TEXTO','No consta el objetivo curricular literal.');
 if(teaching&&!(review.validada===true&&plain(review.revisor)&&isDate(review.fecha)&&review.oaVerificado===true&&review.contenidoVerificado===true&&review.actividadesVerificadas===true&&review.respuestasVerificadas===true&&review.accesibilidadVerificada===true))
   add('EVIDENCIA_PEDAGOGICA_INCOMPLETA','Se requiere firma y fecha, más verificación explícita de OA, contenidos, actividades, respuestas y accesibilidad.');
 const pages=Number(material.paginasExportadas||material.totalPaginasExportadas||0);
 if(teaching&&!(visualReview.validada===true&&plain(visualReview.revisor)&&isDate(visualReview.fecha)&&pages>0&&Number(visualReview.paginasRevisadas)>=pages))
   add('REVISION_VISUAL_NO_EXHAUSTIVA','Falta inspección firmada y fechada de todas las páginas exportadas.');
 const documentary=visuals.filter(v=>v?.documentary===true||v?.fuenteDocumental||v?.sourceUrl);
 const refs=Array.isArray(material.fuentesVisualesVerificadas)?material.fuentesVisualesVerificadas:[];
 if(teaching&&material.recursosVisualesHEVA?.imagenes===true&&documentary.length>0&&refs.length===0)add('SIN_FUENTES_VERIFICADAS','Las imágenes documentales utilizadas requieren evidencias verificables.');
 for(const v of documentary){
  const match=refs.find(r=>(v.id&&r.id===v.id)||(v.sourceUrl&&r.url===v.sourceUrl)||(v.fuenteDocumental&&r.url===v.fuenteDocumental));
  if(!match||!plain(match.titulo)||!plain(match.autorInstitucion)||!/^https?:\/\//.test(plain(match.url))||!plain(match.licencia)||!plain(match.pertinenciaOA)||!plain(match.fechaConsulta)||!isDate(match.fechaConsulta)||match.verificada!==true||!plain(match.revisor)||!isDate(match.fechaVerificacion)||match.derechosVerificados!==true)
   add('RECURSO_DOCUMENTAL_SIN_CURADURIA','Un recurso documental no tiene atribución, licencia, pertinencia, derechos y revisión fechada completos.');
 }
 if(teaching&&material.recursosVisualesHEVA?.imagenes===true&&visuals.length===0)
   add('VISUALES_SOLICITADOS_SIN_EVIDENCIA','Se solicitaron imágenes, pero no se entregó ninguna imagen o ilustración para revisar.');
 if(teaching&&sections.length===0)add('SIN_SECCIONES','No se entregaron secciones para revisar.');
 return {aprobado:teaching&&issues.length===0,issues,teaching,documentaryChecked:documentary.length,
  notice:'Una aprobación documental declara revisión, pero no garantiza por sí sola precisión factual.'};
}
return{review};
});
