const test=require('node:test'),assert=require('node:assert/strict');
const {review}=require('../heva-approval-audit.js');
const evidence=n=>'sha256:'+String(n).repeat(64);
const base={tipoMaterial:'GUIA',objetivoAprendizaje:'Comparar fuentes de información',paginasExportadas:4,
 revisionPedagogica:{validada:true,revisor:'Persona Revisora de Prueba',fecha:'2026-11-19',evidencia:evidence('a'),evidenciaRespuestas:evidence('b'),oaVerificado:true,contenidoVerificado:true,actividadesVerificadas:true,respuestasVerificadas:true,accesibilidadVerificada:true},
 revisionVisual:{validada:true,revisor:'Persona Revisora de Prueba',fecha:'2026-11-19',paginasRevisadas:4,evidenciaPaginas:evidence('c')}};
const sections=[{title:'Caso',text:'Contrastar dos fuentes identificadas, explicando sus autores, fechas, propósito y evidencias. El estudiante compara la información de ambas fuentes, identifica una coincidencia y una diferencia, argumenta cuál es más pertinente para el objetivo y escribe una conclusión fundamentada en los datos disponibles.'}];
test('unreviewed generated content cannot be approved',()=>{
 const r=review({material:{tipoMaterial:'GUIA',objetivoAprendizaje:'Comparar fuentes'},sections});
 assert.equal(r.aprobado,false);
 assert.ok(r.issues.some(x=>x.code==='EVIDENCIA_PEDAGOGICA_INCOMPLETA'));
});
test('partial page inspection is rejected',()=>{
 const r=review({material:{...base,revisionVisual:{...base.revisionVisual,paginasRevisadas:2}},sections});
 assert.equal(r.aprobado,false);
});
test('unverified documentary photo is rejected',()=>{
 const r=review({material:base,sections,visuals:[{id:'photo1',documentary:true,sourceUrl:'https://example.org/image'}]});
 assert.ok(r.issues.some(x=>x.code==='RECURSO_DOCUMENTAL_SIN_CURADURIA'));
});
test('images requested without identified sources are flagged',()=>{
 const r=review({material:{...base,recursosVisualesHEVA:{imagenes:true}},sections});
 assert.equal(r.aprobado,false);
});
test('all required signed declarations yield approval status',()=>{
 const r=review({material:base,sections});
 assert.equal(r.aprobado,true);
});

test('una marca de aprobado sin acta, identidad o evidencia de respuestas NO certifica el material',()=>{
 for(const revision of [
  {...base.revisionPedagogica,revisor:'Docente'},
  {...base.revisionPedagogica,evidencia:'aprobado'},
  {...base.revisionPedagogica,evidenciaRespuestas:''},
  {...base.revisionPedagogica,fecha:'2030-01-01'},
  {...base.revisionPedagogica,fecha:'2026-02-30'}
 ]){
  const r=review({material:{...base,revisionPedagogica:revision},sections});
  assert.equal(r.aprobado,false);
  assert.ok(r.issues.some(x=>x.code==='EVIDENCIA_PEDAGOGICA_INCOMPLETA'));
 }
});
test('páginas declaradas superiores a las reales o sin huella no acreditan revisión exhaustiva',()=>{
 for(const visual of [
  {...base.revisionVisual,paginasRevisadas:5},
  {...base.revisionVisual,evidenciaPaginas:''},
  {...base.revisionVisual,revisor:'Docente'}
 ]){
  const r=review({material:{...base,revisionVisual:visual},sections});
  assert.equal(r.aprobado,false);
  assert.ok(r.issues.some(x=>x.code==='REVISION_VISUAL_NO_EXHAUSTIVA'));
 }
});
test('derechos de imagen no se declaran verificados sin evidencia específica',()=>{
 const documentary=[{id:'fotografia-historica',documentary:true,sourceUrl:'https://bibliotecanacional.gob.cl/foto.jpg'}];
 const refs=[{id:'fotografia-historica',titulo:'Fotografía',autorInstitucion:'Biblioteca Nacional',url:'https://bibliotecanacional.gob.cl/foto.jpg',
 licencia:'Revisar condiciones del objeto',pertinenciaOA:'Análisis de fuentes',fechaConsulta:'2026-11-19',
 fechaVerificacion:'2026-11-19',verificada:true,revisor:'Persona Revisora de Prueba',derechosVerificados:true}];
 const r=review({material:{...base,fuentesVisualesVerificadas:refs},sections,visuals:documentary});
 assert.ok(r.issues.some(x=>x.code==='RECURSO_DOCUMENTAL_SIN_CURADURIA'));
});
