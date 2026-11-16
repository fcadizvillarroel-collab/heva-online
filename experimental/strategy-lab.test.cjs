'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const L=require('./strategy-lab.js');
const subjects=['sociales','matematica','lenguaje','ciencias','ingles','tp_metal','convivencia','laboral','emprendimiento','financiera','consumo','digital','oficios'];
test('Every subject offers general and discipline-specific strategies',()=>{for(const s of subjects){const items=L.items(s);assert(items.length>=7,s);assert.equal(new Set(items.map(x=>x.id)).size,items.length,s);assert(items.some(x=>x.scope==='Disciplinar'),s)}});
test('All strategies create verifiable demonstration activities for all materials',()=>{for(const s of subjects)for(const strategy of L.items(s))for(const type of Object.keys(L.typeNames)){const c=L.contract({asignatura:s,estrategiaDidactica:strategy.id,tipoMaterial:type,objetivoAprendizaje:'Analizar y fundamentar una situación',temaEspecifico:'tema de prueba'});const d=L.demo(c);const audit=L.verify(c,d);assert(audit.ok,JSON.stringify({s,strategy:strategy.id,type,issues:audit.issues}));}});
test('Detect duplicated instructions and incomplete output',()=>{const c=L.contract({asignatura:'sociales',estrategiaDidactica:'casos',tipoMaterial:'GUIA',objetivoAprendizaje:'Analizar un caso',temaEspecifico:'conflictos'});const d=L.demo(c);d.actividades.push({...d.actividades[0]});assert(!L.verify(c,d).ok);d.actividades=[];assert(!L.verify(c,d).ok)});
test('Reject irrelevant strategy and missing OA',()=>{assert.throws(()=>L.contract({asignatura:'ingles',estrategiaDidactica:'planos',tipoMaterial:'GUIA',objetivoAprendizaje:'OA'}));assert.throws(()=>L.contract({asignatura:'ingles',estrategiaDidactica:'lectura',tipoMaterial:'GUIA',objetivoAprendizaje:''}))});
