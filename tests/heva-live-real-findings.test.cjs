'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Matrix=require('../lib/oa-textbook-matrix.cjs');
const Bridge=require('../lib/oa-pedagogical-bridge.cjs');
const Q=require('../heva-quality-gate.js');
const Deep=require('../heva-deep-materials.cjs');
const objective='Comprender diferentes ámbitos en los que se expresa el fenómeno de la globalización a nivel nacional y a escala planetaria distinguiendo efectos positivos y negativos en la realidad vivida.';
const plan={asignatura:'Estudios Sociales',nivel:'II Nivel Medio',tipoMaterial:'GUIA',marcoCurricular:'Decreto Supremo N° 257/2009 EPJA',objetivoAprendizaje:objective,temaEspecifico:'Globalización',usarTextosEscolares:false};
const digest='a'.repeat(64),source={
 documents:[{id:'D257',role:'curriculo',status:'consultada',sha256:digest,title:'Decreto 257/2009 · EPJA'}],
 fragments:[{id:'D257-P87-OA',uso:'objetivo_literal',documentId:'D257',page:87,sha256:digest,
 url:'https://aprendoenlinea.mineduc.gob.cl/decreto257.pdf#page=87',text:'7. '+objective}]
};
test('el OA se reconoce en el PDF oficial aunque los textos escolares estén desactivados',()=>{
 const m=Matrix.build(plan,{items:[]},source);
 assert.equal(m.enabled,false);
 assert.equal(m.registros.length,0);
 assert.equal(m.verificacionOA.estado,'localizado_literalmente_en_pdf_epja');
 assert.equal(m.verificacionOA.paginaPDF,87);
 const bridge=Bridge.build(plan,m);
 assert.equal(bridge.verificacionOA.estado,'localizado_literalmente_en_pdf_epja');
 assert.equal(bridge.fuentesUtilizablesComoPistas.length,0);
});
test('marcadores o hashes falsos NO acreditan OA',()=>{
 const tampered={...source,fragments:[{...source.fragments[0],sha256:'f'.repeat(64)}]};
 assert.equal(Matrix.build(plan,{},tampered).verificacionOA.estado,'pendiente_cotejo_literal');
 const notLiteral={...source,fragments:[{...source.fragments[0],text:'Otro objetivo no relacionado'}]};
 assert.equal(Matrix.build(plan,{},notLiteral).verificacionOA.estado,'pendiente_cotejo_literal');
});
const raw='Un estudio de mercado indica que el 70% de los alimentos que se consumen en grandes ciudades provienen de cadenas internacionales.';
const sourceLess={tipoMaterial:'GUIA',objetivoAprendizaje:objective,
 actividadesGuiadas:[{consigna:'Lea: '+raw}],ejemploGuiado:{
 situacion:'Se analiza un fragmento informativo sobre ropa usada en ferias libres de Chile.',
 pasos:[{accion:'Identificar quién es el autor del fragmento',explicacion:'Para atribuir la afirmación al texto.'}],
 conclusion:'Se concluye que hay diferencias de precio.'},
 respaldoDocumental:[]};
test('una guía real detecta cifra sin fuente y fragmento ausente',()=>{
 const audit=Q.inspect({material:sourceLess,sections:[]});
 assert.ok(audit.issues.some(x=>x.code==='CIFRA_ATRIBUIDA_SIN_RESPALDO'));
 assert.ok(audit.issues.some(x=>x.code==='EJEMPLO_SIN_ESTIMULO'));
 assert.equal(audit.heuristic,true);
});
test('no presenta ejemplos SIMULADOS como cifras oficiales',()=>{
 const m={...sourceLess,actividadesGuiadas:[{consigna:'EJEMPLO SIMULADO: '+raw}],
 ejemploGuiado:{...sourceLess.ejemploGuiado,texto:'Texto completo y original proporcionado para analizar la comparación de dos precios.'}};
 const audit=Q.inspect({material:m,sections:[]});
 assert.ok(!audit.issues.some(x=>x.code==='CIFRA_ATRIBUIDA_SIN_RESPALDO'));
 assert.ok(!audit.issues.some(x=>x.code==='EJEMPLO_SIN_ESTIMULO'));
});
test('presentación detecta pregunta genérica repetida en múltiples diapositivas',()=>{
 const question='Pregunta de análisis: ¿Qué información permite justificar una explicación vinculada al ejemplo?';
 const slides=Array.from({length:16},(_,i)=>({
  titulo:'Dimensión '+(i+1),contenido:['Idea específica '+(i+1)+' con argumentos para abordar el tema.',question]
 }));
 const audit=Q.inspect({material:{tipoMaterial:'PRESENTACION',objetivoAprendizaje:objective,diapositivas:slides}});
 assert.ok(audit.issues.some(x=>x.code==='PPT_CONSIGNA_REITERADA'));
 const varied=slides.map((d,i)=>({...d,contenido:[d.contenido[0],'¿Cómo influye el factor número '+(i+1)+' en este caso específico y qué evidencia muestra su efecto?']}));
 assert.ok(!Q.inspect({material:{tipoMaterial:'PRESENTACION',objetivoAprendizaje:objective,diapositivas:varied}}).issues.some(x=>x.code==='PPT_CONSIGNA_REITERADA'));
});
test('el prompt obliga a integrar fuentes y estímulos sin desbordar el OA',()=>{
 const prompt=Deep.guidance(plan);
 assert.match(prompt,/DATOS Y FUENTES/);
 assert.match(prompt,/EJEMPLO SIMULADO/);
 assert.match(prompt,/estímulo íntegro/);
 assert.match(prompt,/\bOA\b/);
});
