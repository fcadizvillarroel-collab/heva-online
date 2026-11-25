'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {build}=require('../lib/compact-generator-prompt.cjs');
const P=require('../heva-pedagogy.js');
const plan={tipoMaterial:'GUIA',modoReferencia:'NINGUNA',asignatura:'Consumo y Calidad de Vida',
 nivel:'I NIVEL MEDIO',marcoCurricular:'Decreto 257 EPJA',
 objetivoAprendizaje:'Analizar críticamente las decisiones de consumo y los costos de compra mediante información comprobable.',
 temaEspecifico:'Comparación de gastos y presupuesto ficticio',estrategiaDidactica:'Análisis de contenido disciplinar formativo',
 cantAlternativas:1,cantDesarrollo:1,cantCasos:1,
 instruccionesDocente:'Una guía completa para EPJA con datos ficticios.',apoyosInclusivos:['lectura'],incluirTicketSalida:true};
test('respaldo compacto mantiene OA literal, conteos, estrategia y esquema JSON',()=>{
 const prompt=build(plan,P);
 assert.ok(typeof prompt==='string'&&prompt.length<15501);
 assert.ok(prompt.includes(plan.objetivoAprendizaje));
 assert.ok(prompt.includes('casosEstudio=1; preguntasAlternativas=1; preguntasDesarrollo=1'));
 assert.ok(prompt.includes('"claveCorrecta"'));
 assert.ok(prompt.includes('trazabilidadEstrategia'));
 assert.ok(prompt.includes(plan.instruccionesDocente));
 assert.ok(prompt.includes('datos')||prompt.includes('FICTICIOS'));
});
test('no compactar un documento base, una referencia docente o treinta preguntas',()=>{
 assert.equal(build({...plan,documentosBase:[{texto:'Documento imprescindible'}]},P),null);
 assert.equal(build({...plan,modoReferencia:'CONTENIDO',textoReferencia:'Datos originales'},P),null);
 assert.equal(build({...plan,cantAlternativas:30},P),null);
 assert.equal(build({...plan,planIntegrado:{slots:[{}]}},P),null);
 assert.equal(build({...plan,tipoMaterial:'PRESENTACION'},P),null);
 assert.equal(build({...plan,instruccionesDocente:'X'.repeat(1400)},P),null);
});

test('compact fallback keeps type-specific depth and independent assessment',()=>{assert.match(build(plan,P),/300–500 palabras/);assert.match(build({...plan,tipoMaterial:'ACCESIBLE'},P),/200–350 palabras/);const exam=build({...plan,tipoMaterial:'EVALUACION'},P);assert.match(exam,/No escribas una clase/);assert.doesNotMatch(exam,/Desarrolla una explicación disciplinar antes de la práctica/);assert.equal(build({...plan,disenoPedagogico:{contenidos:'Diseño editado'}},P),null);});
