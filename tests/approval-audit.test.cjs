const test=require('node:test'),assert=require('node:assert/strict');
const {review}=require('../heva-approval-audit.js');
const base={tipoMaterial:'GUIA',objetivoAprendizaje:'Comparar fuentes de información',paginasExportadas:4,
 revisionPedagogica:{validada:true,revisor:'Docente',fecha:'2026-11-19',oaVerificado:true,contenidoVerificado:true,actividadesVerificadas:true,respuestasVerificadas:true,accesibilidadVerificada:true},
 revisionVisual:{validada:true,revisor:'Docente',fecha:'2026-11-19',paginasRevisadas:4}};
const sections=[{title:'Caso',text:'Contrastar dos fuentes identificadas'}];
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
