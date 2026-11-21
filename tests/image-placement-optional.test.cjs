const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const mock={HEVASlideDesign:{image:x=>x?.data?x:null}};
const plugin={exports:{}};
new Function('module','globalThis','require',fs.readFileSync(path.join(__dirname,'../heva-guide-visuals.js'),'utf8'))(plugin,mock,()=>mock.HEVASlideDesign);
const V=plugin.exports;
const blocks=[{path:'titulo',title:'Título'},{path:'activacion',title:'Antes de comenzar'},{path:'introduccionLectura',title:'Explicación y lectura'},{path:'actividadesGuiadas.0.consigna',title:'Práctica'},{path:'cierreReflexivo',title:'Cierre y reflexión'}];
test('El docente elige cuatro posiciones diferentes para la imagen',()=>{
 assert.deepEqual(['inicio','explicacion','actividad','final'].map(p=>V.imageTarget(blocks,blocks.length,p)),[1,2,3,4]);
});
test('Una elección inválida usa ubicación segura',()=>assert.equal(V.placement({ubicacionImagenHEVA:'unknown'}),'explicacion'));
test('Sin imagen, no se insertan espacios ni recursos ficticios',()=>{
 const list=V.attach({tipoMaterial:'GUIA',ubicacionImagenHEVA:'actividad'},blocks,blocks.length);
 assert.ok(list.every(b=>!b.image));
});
test('Imagen opcional se incorpora sólo en el bloque elegido',()=>{
 const img={data:'data:image/png;base64,AABB',width:32,height:32};
 const list=V.attach({tipoMaterial:'GUIA',imagenGuiaHEVA:img,ubicacionImagenHEVA:'actividad'},blocks,blocks.length);
 assert.equal(list.filter(b=>b.image).length,1);
 assert.equal(list.findIndex(b=>b.image),3);
});
test('La imagen decorativa de portada está apagada por defecto',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../heva-office.js'),'utf8');
 assert.match(source,/material\.imagenPortadaHEVA===true/);
});
