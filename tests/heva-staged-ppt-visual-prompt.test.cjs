'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../lib/recovery.cjs'),Slides=require('../heva-slide-design.js');
const p={tipoMaterial:'PRESENTACION',asignatura:'Estudios Sociales',nivel:'II Nivel Medio',marcoCurricular:'Decreto 257/2009 EPJA',
 objetivoAprendizaje:'Comprender causas, procesos y consecuencias de la globalización',temaEspecifico:'Globalización',
 estrategiaDidactica:'Análisis de contenido disciplinar formativo',cantAlternativas:0,cantDesarrollo:0,cantCasos:0};
test('los bloques del PPT indican uso de fuentes completas, volumen controlado y diagramas nativos',()=>{
 const batch=R.batches(p).find(b=>b.tipo==='diapositivas');
 assert.ok(batch);
 const prompt=R.itemPrompt(p,{titulo:'Globalización'},batch,[]);
 for(const phrase of ['45 a 100 palabras','notasDocente','DISEÑO VISUAL EDITABLE','Causa: ...','Consecuencia: ...','Ventaja: ...','Desventaja: ...','no inventes cifras'])assert.ok(prompt.includes(phrase),phrase);
 assert.ok(prompt.includes(p.objetivoAprendizaje));
});
test('las estructuras alentadas se convierten en relaciones reales y editables',()=>{
 const flow=['Causa: El comercio internacional conecta mercados.', 'Proceso: Las empresas compran insumos de distintos países.', 'Consecuencia: Cambian precios y oportunidades de trabajo local.'];
 const parsed=Slides.structuredFlow(flow);
 assert.ok(parsed);
 assert.equal(parsed.items.length,3);
 assert.deepEqual(parsed.items.map(x=>x.label),['Causa','Proceso','Consecuencia']);
 const cmp=Slides.comparisonPairs(['Ventaja: Puede ampliar oportunidades laborales.','Desventaja: Puede aumentar la competencia entre talleres locales.']);
 assert.ok(cmp);
 assert.equal(cmp.length,2);
});
test('no se inventan diagramas con párrafos genéricos sin estructura',()=>{
 assert.equal(Slides.structuredFlow(['La globalización conecta países','Es un fenómeno económico y cultural','Influye en las decisiones diarias']),null);
});
