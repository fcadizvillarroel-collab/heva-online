'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname,'..','catalogo-publicado.json'),'utf8'));
test('catálogo EPJA: 407 OA y claves únicas',()=>{
 assert.equal(catalog.length,407,'El número de OA cambió: requiere conciliación curricular');
 const keys=new Set();
 for(const [index,oa] of catalog.entries()){
  assert.equal(typeof oa,'object', 'Registro inválido '+index);
  for(const field of ['clave_interna','codigo_oficial','marco','nivel','asignatura','texto_literal','fuente_documento','pagina_oficial']){
   assert.ok(String(oa[field]??'').trim(), 'OA '+index+' sin '+field);
  }
  assert.ok(!keys.has(oa.clave_interna),'Clave duplicada: '+oa.clave_interna);
  keys.add(oa.clave_interna);
  assert.ok(oa.texto_literal.trim().length>=18,'Texto OA sospechosamente corto: '+oa.clave_interna);
 }
});
test('catálogo EPJA: sin marcadores curriculares provisionales',()=>{
 const suspicious=/\b(lorem ipsum|pendiente de completar|objetivo por definir|texto de ejemplo)\b/i;
 for(const oa of catalog)assert.doesNotMatch(oa.texto_literal,suspicious,oa.clave_interna);
});
test('catálogo EPJA: declaración de aprobación no equivale a material validado',()=>{
 for(const oa of catalog){
  assert.ok(!Object.prototype.hasOwnProperty.call(oa,'materialPedagogicoValidado')||oa.materialPedagogicoValidado!==true,
   'No se debe acreditar aprobación pedagógica sin expediente individual: '+oa.clave_interna);
 }
});
