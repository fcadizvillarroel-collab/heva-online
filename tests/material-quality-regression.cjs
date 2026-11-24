const test=require('node:test');const assert=require('node:assert/strict');
const compact=require('../lib/compact-generator-prompt.cjs');
const planning=require('../heva-planning.js');
const visuals=require('../heva-guide-visuals.js');
test('compact fallback retains teaching, assessment and accessibility guidance',()=>{
 const p={tipoMaterial:'GUIA',objetivoAprendizaje:'Interpretar información de situaciones cotidianas',temaEspecifico:'Lectura de avisos',cantAlternativas:2,cantDesarrollo:1,cantCasos:1};
 const result=compact.build(p,{schema:()=>({titulo:'ejemplo'}),strategy:()=>({id:'guiada'})});
 assert.match(result,/distractores basados en errores conceptuales/);assert.match(result,/contraejemplos/);assert.match(result,/verbaliza los datos/);
});
test('planning asks for usable resources and observable evidence',()=>{
 const result=planning.prompt({tipoMaterial:'PLANIFICACION',planificacionClase:{duracion:90}});
 assert.match(result,/contenido mínimo utilizable/);assert.match(result,/criterio observable por momento/);assert.match(result,/alternativa sin internet/);
});
test('custom image does not suppress other eligible visual blocks',()=>{
 const img={data:'data:image/png;base64,AAAA',width:100,height:100};
 const blocks=[{path:'introduccionLectura',title:'Lectura'},{path:'contenido',title:'Concepto'}];
 const result=visuals.attach({tipoMaterial:'GUIA',imagenGuiaHEVA:img},blocks);
 assert.ok(result[0].image);assert.equal(result[1].hideImage,false);
 const hidden=visuals.attach({tipoMaterial:'GUIA',imagenGuiaHEVA:img,ocultarImagenGuiaHEVA:true},blocks);
 assert.ok(hidden.every(b=>b.hideImage));
});