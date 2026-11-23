const test=require('node:test'),assert=require('node:assert/strict'),Q=require('../heva-quality-gate.js');
test('detects missing explanation, example, practice and visuals',()=>{
 const result=Q.inspect({material:{tipoMaterial:'GUIA'},sections:[{title:'Globalización',text:'Productos y países conectados.'}]});
 assert.ok(result.issues.some(i=>i.code==='EJEMPLO_AUSENTE'));
 assert.ok(result.issues.some(i=>i.code==='EXPLICACION_PENDIENTE'));
 assert.ok(result.issues.some(i=>i.code==='PRACTICA_AUSENTE'));
 assert.ok(result.issues.some(i=>i.code==='VISUALES_AUSENTES'));
});
test('does not penalize explicit opt-out of images',()=>{
 const result=Q.inspect({material:{tipoMaterial:'GUIA',recursosVisualesHEVA:{imagenes:false}},sections:[{title:'Concepto',text:'La globalización es un proceso. Ejemplo resuelto: un producto. Actividad: analiza el caso.'}]});
 assert.equal(result.issues.some(i=>i.code==='VISUALES_AUSENTES'),false);
});
test('flags unbalanced answer keys and duplicated paragraphs',()=>{
 const repeated='Un caso de la vida cotidiana permite comprender los riesgos y las oportunidades del comercio internacional.';
 const result=Q.inspect({material:{tipoMaterial:'PRUEBA',preguntasAlternativas:Array.from({length:8},()=>({clave:'A'}))},sections:[{text:repeated},{text:repeated}]});
 assert.ok(result.issues.some(i=>i.code==='CLAVES_DESEQUILIBRADAS'));
 assert.ok(result.issues.some(i=>i.code==='SECCIONES_DUPLICADAS'));
});

test('finds repeated question wording even with different answer keys',()=>{
 const questions=[{pregunta:'¿Qué ocurre cuando se interrumpe la llegada de insumos importados?',clave:'A'},{pregunta:'¿Qué ocurre cuando se interrumpe la llegada de insumos importados?',clave:'B'}];
 const result=Q.inspect({material:{tipoMaterial:'EVALUACION',preguntasAlternativas:questions}});
 assert.ok(result.issues.some(i=>i.code==='PREGUNTAS_DUPLICADAS'));
});
test('diagrams enabled without images still require visual evidence',()=>{
 const result=Q.inspect({material:{tipoMaterial:'GUIA',objetivoAprendizaje:'Analizar la globalización',recursosVisualesHEVA:{imagenes:false,diagramas:true,graficos:false}},sections:[{text:'La globalización es un proceso. Ejemplo: comercio. Actividad: analiza.'}]});
 assert.ok(result.issues.some(i=>i.code==='VISUALES_AUSENTES'));
});

test('auditoría reconoce claveCorrecta canónica, no solo claves heredadas',()=>{
 const material={tipoMaterial:'EVALUACION',preguntasAlternativas:Array.from({length:8},(_,i)=>({claveCorrecta:i<7?'A':'B',enunciado:'Pregunta '+(i+1)+': ¿qué corresponde al objetivo?'}))};
 const r=Q.inspect({material});
 assert.ok(r.issues.some(x=>x.code==='CLAVES_DESEQUILIBRADAS'));
});
test('solo texto evita advertencias visuales, pero diagramas activados sí las producen',()=>{
 const sections=[{title:'Lectura',text:'Concepto, ejemplo y actividad contextualizada'}];
 for(const recursos of [{imagenes:false,diagramas:false,graficos:false},{imagenes:false}]){
  const r=Q.inspect({material:{tipoMaterial:'GUIA',recursosVisualesHEVA:recursos},sections});
  assert.ok(!r.issues.some(x=>x.code==='VISUALES_AUSENTES'));
 }
 const r=Q.inspect({material:{tipoMaterial:'GUIA',recursosVisualesHEVA:{imagenes:false,diagramas:true,graficos:false}},sections});
 assert.ok(r.issues.some(x=>x.code==='VISUALES_AUSENTES'));
});
