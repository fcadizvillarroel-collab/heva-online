const test=require('node:test'),assert=require('node:assert/strict');const audit=require('../experimental/subject-audit.cjs');
function run(asignatura,introduccionLectura,extra={}){return audit.inspectAll({asignatura,objetivoAprendizaje:'Objetivo de prueba',introduccionLectura,diapositivas:[],preguntasAlternativas:[],preguntasDesarrollo:[],...extra});}
test('English listening without audio/transcript flagged',()=>{let x=run('Inglés','Listen to the dialogue and answer the questions.');assert.ok(x.incidencias.some(i=>i.referencia==='ING-AUDIO'))});
test('English listening with transcript does not trigger missing audio warning',()=>{let x=run('Inglés','Listen to the dialogue. Transcripción: Hello, my name is Ana.');assert.ok(!x.incidencias.some(i=>i.referencia==='ING-AUDIO'))});
test('Science investigation requires variable consideration',()=>{let x=run('Ciencias Naturales','Realiza un experimento y registra las observaciones con seguridad.');assert.ok(x.incidencias.some(i=>i.referencia==='CIE-VARIABLES'))});
test('Language reading needs text',()=>{let x=run('Lenguaje y Comunicación','Infiere la idea principal del texto.');assert.ok(x.incidencias.some(i=>i.referencia==='LEN-LECTURA'))});
test('Social studies source needs provenance',()=>{let x=run('Estudios Sociales','Analiza la fuente histórica y responde.');assert.ok(x.incidencias.some(i=>i.referencia==='SOC-CONTEXTO'))});
