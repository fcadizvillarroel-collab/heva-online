'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const render=require('../experimental/material-view.js');
const example=require('../experimental/ejemplo-globalizacion.json');
const catalog=require('../catalogo-publicado.json');
test('ejemplo usa texto literal EPJA y conserva asignatura',()=>{
 const oa=catalog.find(x=>x.clave_interna===example.oaClaveLaboratorio);
 assert.ok(oa);
 assert.equal(example.objetivoAprendizaje,oa.texto_literal);
 assert.equal(example.asignatura,oa.asignatura);
 assert.equal(example.marcoCurricular,oa.marco);
});
test('guía modelo completa y evaluable',()=>{
 const audit=render.audit(example,'GUIA');
 assert.deepEqual(audit.issues,[]);
 assert.ok(audit.sections>=8);
 assert.equal(example.preguntasAlternativas.length,6);
 assert.equal(example.casosEstudio.length,2);
});
test('versión estudiante oculta claves, justificaciones y criterios',()=>{
 const html=render.html(example,'GUIA','student');
 assert.ok(html.includes('Globalización: conexiones, oportunidades y desafíos'));
 assert.ok(html.includes('Cooperativa')||html.includes('cooperativa'));
 assert.ok(!html.includes('Clave:'));
 assert.ok(!html.includes('La dependencia de precios es un riesgo plausible'));
 assert.ok(!html.includes('Criterio:'));
 assert.ok(!html.includes('Notas docentes:'));
});
test('versión docente incorpora pauta y explicaciones',()=>{
 const html=render.html(example,'GUIA','teacher');
 assert.ok(html.includes('Clave: B'));
 assert.ok(html.includes('La dependencia de precios'));
 assert.ok(html.includes('Observaciones pedagógicas'));
});
test('contenido hostil se escapa como texto y no inyecta HTML',()=>{
 const input={...example,titulo:'<script>alert(1)</script>',introduccionLectura:'<img src=x onerror=alert(1)>'};
 const html=render.html(input,'GUIA','student');
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(html.includes('&lt;img'));
 assert.ok(!html.includes('<script>'));
 assert.ok(!html.includes('<img src='));
});
test('el verificador detecta recuentos de respuestas incompletas',()=>{
 const malformed={...example,preguntasAlternativas:[{...example.preguntasAlternativas[0],alternativas:[{letra:'A',texto:'Sí'}],claveCorrecta:'Z'}]};
 const audit=render.audit(malformed);
 assert.ok(!audit.ok);
 assert.ok(audit.issues.some(x=>x.includes('cuatro alternativas')));
 assert.ok(audit.issues.some(x=>x.includes('clave docente')));
});
test('planificación incompleta no se declara validada',()=>{
 const plan={...example,planClase:[{momento:'Inicio',minutos:10},{momento:'Desarrollo',minutos:50},{momento:'Cierre',minutos:20}]};
 const audit=render.audit(plan,'PLANIFICACION');
 assert.ok(!audit.ok);
 assert.match(audit.issues.join(' '),/90 minutos/);
});
