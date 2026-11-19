/* Independent, conservative documentary and pedagogical evidence checks.
   A passing heuristic score is NOT an approval to teach. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVAEvidenceGate=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const generic=[
 'que habilidad solicita este objetivo','explica con tus palabras',
 'describe un ejemplo concreto relacionado con tu vida cotidiana',
 'que evidencia permitiria comprobar que lograste el objetivo',
 'propone una situacion de tu vida adulta','describe como comprobarias que lo lograste'
];
function inspect({material={},sections=[],visuals=[]}={}){
 const text=norm(sections.map(s=>[s.title,s.text].join(' ')).join(' '));
 const issues=[];
 const add=(code,detail)=>issues.push({code,detail});
 const stripped=generic.reduce((t,g)=>t.split(g).join(''),text);
 const oa=norm(material.objetivoAprendizaje||material.oaTexto||'');
 const withoutOA=oa?stripped.split(oa).join(''):stripped;
 const teaching=['GUIA','TALLER','PRESENTACION','ACCESIBLE'].includes(String(material.tipoMaterial||'').toUpperCase());
 if(teaching&&generic.filter(g=>text.includes(g)).length>=2)add('ACTIVIDADES_GENERICAS','Las consignas repiten instrucciones generales sin demostrar aprendizaje específico del OA.');
 if(teaching&&withoutOA.replace(/objetivo de aprendizaje|actividad de aplicacion|comprender|aplicar|revisar|ticket de salida|guia breve de aprendizaje/g,'').trim().length<180)
   add('DESARROLLO_ESPECIFICO_INSUFICIENTE','El contenido fuera del texto literal del OA es demasiado breve para acreditar enseñanza específica.');
 const references=Array.isArray(material.fuentesVisualesVerificadas)?material.fuentesVisualesVerificadas:[];
 const documentary=visuals.filter(v=>v?.documentary===true||v?.fuenteDocumental||v?.sourceUrl);
 for(const v of documentary){
  const match=references.find(r=>r.id===v.id||r.url===v.sourceUrl||r.url===v.fuenteDocumental);
  if(!match||!match.titulo||!match.autorInstitucion||!/^https?:\/\//.test(match.url||'')||!match.licencia||!match.pertinenciaOA||match.verificada!==true)
    add('FUENTE_DOCUMENTAL_NO_VERIFICADA','El recurso documental carece de título, institución, URL, licencia, pertinencia al OA o verificación expresa.');
 }
 const approval=material.revisionPedagogica||{};
 if(teaching&&!(approval.validada===true&&approval.revisor&&approval.fecha&&approval.oaVerificado===true))
   add('REVISION_PEDAGOGICA_PENDIENTE','No consta revisión docente fechada de contenidos, OA, ejemplos, actividades y respuestas.');
 if(teaching&&!(material.revisionVisual?.validada===true&&material.revisionVisual?.paginasRevisadas>0))
   add('REVISION_VISUAL_PENDIENTE','No consta inspección visual humana de las páginas exportadas.');
 return {aprobado:issues.length===0,issues,documentaryImagesChecked:documentary.length,verifiedDocumentarySources:references.filter(r=>r.verificada===true&&r.url&&r.licencia).length,scope:'evidence_not_heuristic'};
}
return {inspect};
});
