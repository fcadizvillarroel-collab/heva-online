'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../heva-skills.js');
const H=require('../heva-core.js');
const rationale=[
 'La clave B es correcta porque pequeñas empresas compiten con corporaciones. La opción A contradice el texto; C y D son afirmaciones absolutas.',
 'La opción B es correcta porque la cultura local cambia. Las opciones A, C y D no corresponden a la realidad descrita.',
 'La clave B identifica el efecto positivo. Las opciones A, C y D contienen exageraciones y falsedades.',
 'La alternativa A sintetiza adecuadamente la relación. Las opciones B, C y D distorsionan la descripción.'
];
function sample(){
 const keys=['B','B','B','A'];
 return {tipoMaterial:'EVALUACION',preguntasAlternativas:keys.map((claveCorrecta,i)=>({
  enunciado:'Situación '+(i+1)+': explique lo aprendido sin nombrar otras letras.',
  claveCorrecta,justificacion:rationale[i],
  alternativas:'ABCD'.split('').map(letra=>({letra,texto:'Contenido original '+(i+1)+' '+letra}))
 }))};
}
test('equilibra claves reales B,B,B,A sin cambiar la opción correcta o perder fundamentos',()=>{
 const m=sample(),answers=m.preguntasAlternativas.map(q=>q.alternativas.find(o=>o.letra===q.claveCorrecta).texto);
 const report=S.balanceKeys(m,()=>.31);
 assert.equal(report.status,'equilibrado');
 assert.equal(report.changed>0,true);
 assert.deepEqual(Object.values(H.distribution(m).counts).sort((a,b)=>a-b),[1,1,1,1]);
 for(const [i,q] of m.preguntasAlternativas.entries()){
  assert.equal(q.alternativas.find(a=>a.letra===q.claveCorrecta).texto,answers[i]);
  assert.ok(q.justificacion.includes(q.claveCorrecta),q.justificacion);
  assert.ok(q.alternativas.map(a=>a.letra).join('')==='ABCD');
  assert.deepEqual(q.alternativas.map(a=>a.texto).sort(),
   'ABCD'.split('').map(l=>'Contenido original '+(i+1)+' '+l).sort());
 }
});
test('letras de distractores dentro de grupos y claves se remapean una sola vez',()=>{
 const q=sample().preguntasAlternativas[0];
 const m=S.remapJustification(q.justificacion,{A:'B',B:'A',C:'C',D:'D'});
 assert.ok(m.includes('clave A es correcta'));
 assert.ok(m.includes('opción B contradice'));
 assert.ok(m.includes('C y D son'));
});
test('referencias ambiguas o al escenario no permiten cambios peligrosos',()=>{
 assert.equal(S.remapJustification('A través de este procedimiento, B corresponde al resultado.',{A:'B',B:'A'}),null);
 const m=sample();
 m.preguntasAlternativas[0].enunciado='La opción A corresponde al punto de origen y la opción B al destino.';
 const first=JSON.stringify(m.preguntasAlternativas[0]);
 const report=S.balanceKeys(m,()=>.31);
 assert.equal(JSON.stringify(m.preguntasAlternativas[0]),first);
 assert.ok(['equilibrado','requiere_revision'].includes(report.status));
});
