'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Q=require('../heva-quality-gate.js');
const base={
 tipoMaterial:'GUIA',objetivoAprendizaje:'Comparar evidencias y afirmaciones sobre el entorno',
 introduccionLectura:'Según un informe de 2022, los talleres redujeron su personal en un 20 % y las importaciones aumentaron 35 %.',
 actividadesGuiadas:[],respaldoDocumental:[]
};
const issue=m=>Q.inspect({material:m}).issues.find(x=>x.code==='CIFRA_ATRIBUIDA_SIN_RESPALDO');
test('sin fuentes: observa dos porcentajes atribuidos a un informe real',()=>assert.ok(issue(base)));
test('una fuente verificada pero que cita otros datos NO acredita el porcentaje',()=>{
 const m={...base,respaldoDocumental:[{fuenteId:'DOCUMENTO-1',page:12,cita:'El sector minero aumentó su participación en el 6 %.'}]};
 assert.ok(issue(m),'No basta con que exista alguna cita del registro');
});
test('debe haber cita literal con ambas cifras y página',()=>{
 const r1={fuenteId:'INFORME-P12',page:12,cita:'Importaciones aumentaron 35 %.'};
 const r2={fuenteId:'INFORME-P13',page:13,cita:'Los talleres redujeron su personal en 20 %.'};
 assert.ok(issue({...base,respaldoDocumental:[r1]}));
 assert.equal(issue({...base,respaldoDocumental:[r1,r2]}),undefined);
});
test('un rótulo SIMULADO explícito no se hace pasar por evidencia empírica',()=>{
 assert.equal(issue({...base,introduccionLectura:'Ejemplo SIMULADO: '+base.introduccionLectura}),undefined);
});
test('también inspecciona estadísticas en diapositivas aunque haya referencias irrelevantes',()=>{
 const m={tipoMaterial:'PRESENTACION',diapositivas:[
  {titulo:'Informe regional',contenido:['Una encuesta de 2022 sostiene que el 70% de los consumidores prefieren importar.']}
 ],respaldoDocumental:[{fuenteId:'UNRELATED',page:2,cita:'Se produjo un 45% de aumento en otro período.'}]};
 assert.ok(issue(m));
});
test('una cita sin ID de fuente o página no sirve como verificación',()=>{
 assert.ok(issue({...base,respaldoDocumental:[{cita:'Se redujo en 20 % y aumentó 35 %.'}]}));
});
