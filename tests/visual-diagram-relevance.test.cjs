const test=require('node:test');
const assert=require('node:assert/strict');
const D=require('../heva-slide-design.js');
const section={title:'Registro formal versus informal',text:'Ejemplos de comunicación oral; revisar vocabulario, propósito y destinatario.'};
test('Lenguaje: el registro oral genera un esquema comunicativo pertinente',()=>{
 const d=D.diagramPlan(section,'Lenguaje y Comunicación','Registro formal versus informal en la comunicación oral');
 assert.equal(d.title,'Elegir el registro adecuado');
 assert.deepEqual(d.labels,['SITUACIÓN','DESTINATARIO','REGISTRO']);
 assert.doesNotMatch(JSON.stringify(d),/EPP|soldadura|seguridad|materiales/i);
});
test('Una mención espuria de EPP no convierte Lenguaje en un tema técnico',()=>{
 const d=D.diagramPlan(section,'Lenguaje y Comunicación','Comunicación oral, EPP y procedimiento de seguridad');
 assert.equal(d.title,'Elegir el registro adecuado');
});
test('Historia usa diagrama de procesos',()=>{
 const d=D.diagramPlan({title:'Causas de la guerra',text:'Proceso histórico'},'Estudios Sociales','Primera Guerra Mundial');
 assert.equal(d.title,'Analizar un proceso histórico');
});
test('Matemática usa diagrama de ecuaciones',()=>{
 const d=D.diagramPlan({title:'Resolver una ecuación',text:'Procedimiento'},'Educación Matemática','Ecuaciones lineales');
 assert.equal(d.title,'Resolver ecuaciones');
});
test('Seguridad industrial solo se muestra en Construcciones Metálicas',()=>{
 const d=D.diagramPlan({title:'Seguridad en soldadura',text:'Preparar área'},'Construcciones Metálicas','Soldadura');
 assert.equal(d.title,'Procedimiento técnico seguro');
 const nonTech=D.diagramPlan(section,'Lenguaje y Comunicación','Soldadura y seguridad laboral');
 assert.notEqual(nonTech.title,'Procedimiento técnico seguro');
});
test('Una asignatura desconocida no recibe un diagrama ajeno',()=>{
 assert.equal(D.diagramPlan({title:'Materia',text:'Contenido'},'Asignatura no categorizada','Tema general'),null);
});
