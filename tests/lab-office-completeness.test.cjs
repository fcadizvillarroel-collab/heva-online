'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const HEVA=require('../heva-core.js');
const sample=require('../experimental/ejemplo-globalizacion.json');

test('exportación Word de guía LAB importada conserva ejemplo, prácticas, cierre y vocabulario sin versión explícita',()=>{
 assert.equal(sample.versionPedagogica,undefined);
 const material=HEVA.material(sample);
 const blocks=HEVA.blocks(material,false);
 const titles=blocks.map(x=>x.title).join('\n');
 for(const required of ['Ejemplo guiado','Práctica con apoyo','Ahora tú','Cierre y reflexión','Vocabulario']){
   assert.ok(titles.includes(required),'No se preservó '+required);
 }
 assert.equal(blocks.filter(x=>x.title.startsWith('Vocabulario')).length,sample.glosario.length);
 assert.ok(blocks.some(x=>x.text.includes(sample.ejemploGuiado.situacion)));
 assert.ok(blocks.some(x=>x.text.includes(sample.actividadAutonoma.consigna)));
});

test('pauta docente se incorpora solo en exportación docente de guía LAB',()=>{
 const material=HEVA.material(sample);
 const student=HEVA.blocks(material,false).map(x=>x.title+' '+x.text).join('\n');
 const teacher=HEVA.blocks(material,true).map(x=>x.title+' '+x.text).join('\n');
 assert.ok(!student.includes('PAUTA DOCENTE · USO EXCLUSIVO'));
 assert.ok(!student.includes('Clave 1'));
 assert.ok(teacher.includes('PAUTA DOCENTE · USO EXCLUSIVO'));
 assert.ok(teacher.includes('Clave 1'));
});

test('material legado sin estructuras pedagógicas completas mantiene su disposición anterior',()=>{
 const legacy=HEVA.material({titulo:'Prueba antigua',tipoMaterial:'EVALUACION',
  objetivoAprendizaje:'OA EPJA de demostración',introduccionLectura:'Lectura breve',
  preguntasAlternativas:[],casosEstudio:[],preguntasDesarrollo:[]});
 const titles=HEVA.blocks(legacy,false).map(x=>x.title);
 assert.ok(titles.includes('Lectura'));
 assert.ok(!titles.includes('Explicación y lectura'));
});
