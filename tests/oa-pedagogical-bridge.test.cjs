'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=require('../lib/oa-pedagogical-bridge.cjs');
const root=path.join(__dirname,'..');
const input={tipoMaterial:'GUIA',marcoCurricular:'Bases Curriculares EPJA 2024',
 objetivoAprendizaje:'Analizar continuidad y cambio en procesos históricos',
 temaEspecifico:'Guerra del Pacífico y ocupación de la Araucanía'};
test('sin páginas recuperadas, mantiene OA y evita presentar índice como evidencia',()=>{
 const matrix={registros:[{tipo:'indice_paginas_texto_regular',pais:'CL',paginasTEIndicadas:'160 a 167',paginaPDF:null},
  {tipo:'ficha_libro_oficial',pais:'MX',paginaPDF:null}]};
 const plan=P.build(input,matrix);
 assert.equal(plan.estado,'sin_fragmentos_documentales_para_atribucion');
 assert.equal(plan.fuentesUtilizablesComoPistas.length,0);
 assert.equal(plan.indicesSinLectura,2);
 assert.deepEqual(plan.etapas,P.strategies.GUIA);
 assert.match(P.instructions(plan),/NO inventes citas/);
});
test('solo fragmentos PDF realmente extraídos se ofrecen como pistas, pendientes de revisión',()=>{
 const matrix={registros:[
  {tipo:'fragmento_libro',fragmentoId:'TEXTO_REG_HIST1_MUESTRA-P3-T',pais:'CL',paginaPDF:3,url:'https://aprendoenlinea.mineduc.gob.cl/x.pdf#page=3',titulo:'Muestra Historia'},
  {tipo:'fragmento_documental',fragmentoId:'REG_HIST1-P12-T',pais:'CL',paginaPDF:12,url:'https://aprendoenlinea.mineduc.gob.cl/y.pdf#page=12',titulo:'Programa'},
  {tipo:'catalogo',titulo:'Catálogo SEP',pais:'MX',paginaPDF:null}
 ]};
 const p=P.build(input,matrix);
 assert.equal(p.fuentesUtilizablesComoPistas.length,2);
 assert.equal(p.indicesSinLectura,1);
 assert.equal(p.estado,'referencias_pdf_recuperadas_pendientes_de_revision_docente');
 assert.match(P.instructions(p),/FUENTES DOCUMENTALES RECUPERADAS/);
 assert.doesNotMatch(P.instructions(p),/Catálogo SEP/);
});
test('presentaciones y pruebas reciben estrategias diferentes y no sustituyen OA',()=>{
 const guia=P.build(input,{registros:[]});
 const ppt=P.build({...input,tipoMaterial:'PRESENTACION'},{registros:[]});
 const testPlan=P.build({...input,tipoMaterial:'EVALUACION'},{registros:[]});
 assert.notDeepEqual(ppt.etapas,guia.etapas);
 assert.notDeepEqual(testPlan.etapas,ppt.etapas);
 assert.equal(ppt.oaLiteral,guia.oaLiteral);
 assert.match(P.instructions(testPlan),/pauta docente/);
});
test('motor normal y por bloques conservan plan de fuentes y consignas didácticas',()=>{
 for(const file of ['api/generate.js','api/recover.js']){
  const s=fs.readFileSync(path.join(root,file),'utf8');
  assert.match(s,/OAPedagogy\.build\(plan,matrizOA\)/);
  assert.match(s,/OAPedagogy\.instructions\(planUsoFuentes\)/);
  assert.match(s,/material\.planUsoFuentesOA=planUsoFuentes/);
 }
});
