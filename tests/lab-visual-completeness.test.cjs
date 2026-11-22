'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const view=require('../experimental/material-view.js');
const base={titulo:'Material EPJA de muestra',objetivoAprendizaje:'OA EPJA de prueba',
  activacion:'Experiencias adultas relacionadas con el tema',
  introduccionLectura:'Explicación completa con datos y ejemplos para el grupo.'};

test('la vista estudiante presenta contenido estructurado sin filtrar claves ni notas',()=>{
  const slides=Array.from({length:5},(_,i)=>({
    titulo:'Diapositiva '+(i+1),
    contenido:{texto:'Explicación disciplinar '+(i+1),puntos:['Dato visible '+(i+1)],
      notasDocente:'CLAVE_DOCENTE_NO_PUBLICAR',claveCorrecta:'RESPUESTA_RESERVADA',
      solucion:'SOLUCION_RESERVADA'},
    notasDocente:'NOTA_SOLO_DOCENTE'
  }));
  const material={...base,diapositivas:slides};
  const student=view.html(material,'PRESENTACION','student');
  assert.match(student,/Explicación disciplinar 1/);
  assert.match(student,/Dato visible 5/);
  for(const secret of ['CLAVE_DOCENTE_NO_PUBLICAR','RESPUESTA_RESERVADA','SOLUCION_RESERVADA','NOTA_SOLO_DOCENTE'])
    assert.ok(!student.includes(secret),'Se expuso: '+secret);
  assert.equal(view.audit(material,'PRESENTACION').ok,true);
  assert.match(view.html(material,'PRESENTACION','teacher'),/NOTA_SOLO_DOCENTE/);
});

test('la salida HTML escapa etiquetas dentro de diapositivas estructuradas',()=>{
 const material={...base,diapositivas:Array.from({length:5},()=>({
   titulo:'Visualización',contenido:{texto:'<img src=x onerror=alert(1)>'}
 }))};
 const html=view.html(material,'PRESENTACION','student');
 assert.ok(html.includes('&lt;img'));
 assert.ok(!html.includes('<img src='));
});

test('diapositivas con objetos sin contenido estudiantil no pasan auditoría',()=>{
 const material={...base,diapositivas:Array.from({length:5},(_,i)=>({
   titulo:'Diapositiva '+i,contenido:{notasDocente:'Solo indicaciones privadas'}
 }))};
 const audit=view.audit(material,'PRESENTACION');
 assert.equal(audit.ok,false);
 assert.match(audit.issues.join('; '),/contenido visible/);
});

test('evaluación vacía y planificación sin secuencia fallan aunque tengan explicación',()=>{
 assert.equal(view.audit({...base},'EVALUACION').ok,false);
 assert.match(view.audit({...base},'EVALUACION').issues.join(' '),/no contiene preguntas ni casos/);
 assert.equal(view.audit({...base},'PLANIFICACION').ok,false);
 const plan={...base,planClase:[
   {momento:'Inicio',minutos:10},{momento:'Desarrollo',minutos:65},{momento:'Cierre',minutos:15}
 ]};
 assert.equal(view.audit(plan,'PLANIFICACION').ok,false);
 assert.match(view.audit(plan,'PLANIFICACION').issues.join(' '),/faltan acciones/);
});
