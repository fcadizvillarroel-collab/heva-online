'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const view=require('../experimental/material-view.js');
const sample=require('../experimental/ejemplo-globalizacion.json');
const clone=x=>JSON.parse(JSON.stringify(x));

test('guía de globalización mantiene recuentos exactos y pauta independiente',()=>{
 const result=view.audit(sample,'GUIA',{alternativas:6,desarrollo:2,casos:2});
 assert.deepEqual(result.issues,[]);
 assert.ok(view.html(sample,'GUIA','student').includes('Globalización'));
 assert.ok(!view.html(sample,'GUIA','student').includes('Clave:'));
});

test('detecta cantidades faltantes y preguntas con letras incorrectas',()=>{
 const m=clone(sample);
 m.preguntasAlternativas=m.preguntasAlternativas.slice(0,5);
 m.preguntasAlternativas[0].alternativas[0].letra='B';
 m.preguntasAlternativas[0].alternativas[1].texto=' ';
 m.preguntasAlternativas[0].claveCorrecta='Z';
 const errors=view.audit(m,'EVALUACION',{alternativas:6,desarrollo:2,casos:2}).issues.join(' | ');
 assert.match(errors,/Cantidad de alternativas/);
 assert.match(errors,/letras deben ser A, B, C y D/);
 assert.match(errors,/alternativas vacías/);
 assert.match(errors,/clave docente válida/);
});

test('rechaza distractores idénticos y enunciados repetidos incluso entre formatos',()=>{
 const m=clone(sample);
 m.preguntasAlternativas[0].alternativas[1].texto=m.preguntasAlternativas[0].alternativas[0].texto;
 m.preguntasDesarrollo[0].enunciado=m.preguntasAlternativas[0].enunciado;
 const errors=view.audit(m,'GUIA').issues.join('; ');
 assert.match(errors,/alternativas repetidas/);
 assert.match(errors,/pregunta repetida/);
});

test('rechaza casos sin contexto, preguntas o criterio de desarrollo',()=>{
 const m=clone(sample);
 m.casosEstudio[0].contextoReal='Una persona';
 m.casosEstudio[0].preguntaReflexion='';
 m.preguntasDesarrollo[0].criterioEvaluacion='';
 const errors=view.audit(m,'GUIA').issues.join('; ');
 assert.match(errors,/situación suficientemente desarrollada/);
 assert.match(errors,/enunciado demasiado breve/);
 assert.match(errors,/criterio de evaluación comprensible/);
});

test('una tabla documental se imprime y no filtra campos de solución',()=>{
 const m={titulo:'Tabla comparativa EPJA',asignatura:'Estudios Sociales',
  objetivoAprendizaje:'Comparar evidencias',
  diapositivas:Array.from({length:5},(_,i)=>({
   titulo:'Comparación '+(i+1),contenido:{
    texto:'Analiza la información de la tabla',
    tabla:{encabezados:['Dimensión','Dato'],filas:[['Económica','Intercambio <global>'],['Cultural','Difusión de costumbres']]},
    respuestaDocente:'PRIVADO',notasDocente:'RESERVADO'
   },notasDocente:'NOTA_DE_PAUTA'
  }))
 };
 const student=view.html(m,'PRESENTACION','student');
 const teacher=view.html(m,'PRESENTACION','teacher');
 assert.ok(student.includes('<table>'));
 assert.ok(student.includes('&lt;global&gt;'));
 assert.ok(!student.includes('PRIVADO'));
 assert.ok(!student.includes('RESERVADO'));
 assert.ok(!student.includes('NOTA_DE_PAUTA'));
 assert.ok(teacher.includes('NOTA_DE_PAUTA'));
 assert.match(student,/class="heva-slide"/);
 assert.match(student,/class="student presentation"/);
 assert.equal(view.audit(m,'PRESENTACION').ok,true);
});

test('información de notas sin contenido estudiantil no aprueba diapositiva',()=>{
 const m={titulo:'Presentación',objetivoAprendizaje:'OA EPJA',
   diapositivas:Array.from({length:5},()=>({
     titulo:'Tema',contenido:{notasDocente:'Hay instrucciones internas',claveCorrecta:'A'}
   }))};
 assert.match(view.audit(m,'PRESENTACION').issues.join('; '),/contenido visible/);
});

test('pauta advierte concentración excesiva de claves, sin afirmar error de contenidos',()=>{
 const m=clone(sample);
 m.preguntasAlternativas=[...m.preguntasAlternativas,
  ...m.preguntasAlternativas.map((q,i)=>({...q,enunciado:q.enunciado+' Escenario '+i}))]
   .map(q=>({...q,claveCorrecta:'A'}));
 const report=view.audit(m,'GUIA');
 assert.ok(report.warnings.some(x=>x.includes('distribución de claves')));
});
