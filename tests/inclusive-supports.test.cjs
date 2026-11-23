'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const S=require('../heva-inclusive-supports.cjs');
const read=x=>fs.readFileSync(path.join(__dirname,'..',x),'utf8');
test('Los seis apoyos inclusivos son únicos, reconocidos y opcionales',()=>{
 assert.deepEqual(Object.keys(S.CHOICES),['lectura','vision','modelado','respuesta','recuperacion','desafio']);
 assert.deepEqual(S.validate([]),[]);
 assert.deepEqual(S.validate(['lectura','recuperacion']),[]);
 assert.ok(S.validate(['lectura','lectura']).length);
 assert.ok(S.validate(['borrar_sistema']).length);
 assert.ok(S.validate('vision').length);
 assert.ok(S.validate(['lectura',1]).length);
 assert.deepEqual(S.selected(['lectura','vision']),['lectura','vision']);
 assert.deepEqual(S.selected(['untrusted']),[]);
 assert.equal(S.prompt({apoyosInclusivos:[]}), '');
});
test('Instrucciones inclusivas se refieren a tareas reales, preservan OA y no añaden preguntas',()=>{
 const p=S.prompt({tipoMaterial:'GUIA',apoyosInclusivos:Object.keys(S.CHOICES)});
 for(const label of Object.values(S.CHOICES))assert.ok(p.includes(label),label);
 assert.match(p,/no cambies el texto literal del objetivo de aprendizaje EPJA/i);
 assert.match(p,/sin añadir preguntas/i);
 assert.match(p,/guía|práctica guiada/i);
 assert.match(p,/descripciones textuales/i);
 assert.match(p,/oral|dictado/i);
 assert.match(p,/ausencia/i);
 assert.ok(!p.includes('Diagnóstico: el estudiante'));
});
test('En evaluaciones se prohíben ejemplos resueltos y pistas de respuestas',()=>{
 const p=S.prompt({tipoMaterial:'EVALUACION',apoyosInclusivos:['modelado','recuperacion','desafio','respuesta']});
 assert.match(p,/NO incorpores ejemplos resueltos/i);
 assert.match(p,/no revelen|sin dar respuestas ni pistas/i);
 assert.match(p,/criterios de logro/i);
 assert.doesNotMatch(p,/Incluye dentro del contrato existente un ejemplo completamente resuelto/);
});
test('El formulario EPJA mantiene los ID existentes y permite seis apoyos sin duplicados',()=>{
 const html=read('index.html');
 const entries=[...html.matchAll(/data-heva-support="(lectura|vision|modelado|respuesta|recuperacion|desafio)"/g)].map(m=>m[1]);
 assert.deepEqual(entries,['lectura','vision','modelado','respuesta','recuperacion','desafio']);
 for(const id of ['pie-lectura-facil','pie-apoyos-visuales','pie-graduacion','pie-respuestas-flexibles','pie-recuperacion','pie-desafio'])
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 assert.match(html,/apoyosInclusivos: \[\.\.\.document\.querySelectorAll/);
 assert.match(html,/adecuacionesPIE: \[\.\.\.document\.querySelectorAll/);
 assert.match(html,/x\.dataset\.hevaSupport==='modelado'/);
 assert.equal((html.match(/id="heva-access-details"/g)||[]).length,1,'No duplicar panel de accesibilidad');
});
test('Servidor direct/recuperación valida e incorpora apoyos en prompts y metadatos',()=>{
 const direct=read('api/generate.js'),recover=read('api/recover.js');
 for(const source of [direct,recover]){
  assert.match(source,/Inclusive\.validate/);
  assert.match(source,/Inclusive\.prompt\(plan\)/);
  assert.match(source,/apoyosInclusivosSolicitados/);
  assert.match(source,/APOYOS_INVALIDOS/);
 }
 assert.match(direct,/apoyosInclusivos:Inclusive\.selected\(apoyosInclusivos\)/);
 assert.match(recover,/R\.planOf\(input\)/);
});
