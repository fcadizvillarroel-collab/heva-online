const test=require('node:test'),assert=require('node:assert/strict'),M=require('../heva-moodle.js');
const valid={enunciado:'Si 2 < 3 & 4 > 3, responde.',alternativas:['Una','Dos','Tres','Cuatro'],claveCorrecta:'B',puntajeDocente:3};
test('Moodle export escapes text and preserves four alternative positions, key and weight',()=>{
 const record=M.exportQuiz({tipoMaterial:'EVALUACION',titulo:'Razón "A&B"',preguntasAlternativas:[valid]});
 assert.equal(record.exported,1);
 assert.deepEqual(record.omitted,[]);
 assert.match(record.xml,/<quiz>\s+<question type="multichoice">/);
 assert.match(record.xml,/2 &lt; 3 &amp; 4 &gt; 3/);
 assert.match(record.xml,/Razón &quot;A&amp;B&quot;/);
 assert.match(record.xml,/<defaultgrade>3<\/defaultgrade>/);
 assert.match(record.xml,/<answer fraction="100" format="plain_text"><text>Dos<\/text>/);
 assert.equal((record.xml.match(/<answer fraction=/g)||[]).length,4);
});
test('Moodle export reports unsupported and invalid items without assigning them a grade',()=>{
 const only=M.exportQuiz({tipoMaterial:'EVALUACION',titulo:'Caso',preguntasAlternativas:[{...valid,claveCorrecta:'X'}],verdaderoFalso:[{enunciado:'Se exige justificar',respuesta:true}]});
 assert.equal(only.xml,'');
 assert.equal(only.exported,0);
 assert.match(only.omitted.join(' '),/Alternativa 1.*Verdadero o falso 1/);
 assert.throws(()=>M.exportQuiz({tipoMaterial:'GUIA'}),/evaluación HEVA/);
});
