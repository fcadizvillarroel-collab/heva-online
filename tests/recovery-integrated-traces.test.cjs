'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../lib/recovery.cjs');
const D=require('../experimental/strategy-delivery.js');
const plan={
 tipoMaterial:'GUIA',asignatura:'Matemática',nivel:'I Nivel Medio',
 objetivoAprendizaje:'Resolver problemas contextualizados de proporcionalidad.',
 temaEspecifico:'Cálculos de materiales de construcción',
 estrategiaDidactica:'PROBLEMAS',cantAlternativas:4,cantDesarrollo:0,cantCasos:0,
 modoReferencia:'NINGUNA',
 planIntegrado:{slots:[
  {id:'problemas-1',strategy:'problemas',alternativas:2,desarrollo:0,lecturas:0},
  {id:'problemas-2',strategy:'problemas',alternativas:2,desarrollo:0,lecturas:0}
 ]}
};
function original(){
 return {preguntasAlternativas:Array.from({length:4},(_,i)=>({
  numero:i+1,enunciado:'Problema '+(i+1)+': se necesitan '+(i+3)+' piezas. ¿Cuántas piezas se requieren en total?',
  alternativas:['A','B','C','D'].map((letra,n)=>({letra,texto:String(n+i+4)})),claveCorrecta:'A',
  justificacion:'El valor correcto se obtiene al comprobar las cantidades.'})),
 trazabilidadEstrategia:Array.from({length:4},(_,i)=>({
  referencia:'ALT-'+(i+1),habilidad:'Resolver problemas',evidencia:'Selecciona una respuesta calculada',
  criterio:'Comprobar resultado',estrategiasIntegradas:[]}))
 };
}
test('contrato distribuye exactamente problemas-1 y problemas-2',()=>{
 const requirements=D.requirements(plan);
 assert.deepEqual(requirements.map(x=>[x.id,x.refs]),[['problemas-1',['ALT-1','ALT-2']],['problemas-2',['ALT-3','ALT-4']]]);
});
test('la reparación cita los IDs exactos y prohíbe regenerar preguntas',()=>{
 const prompt=R.traceRepairPrompt(plan,original(),R.batches(plan)[0]);
 assert.match(prompt,/problemas-1/);assert.match(prompt,/problemas-2/);
 assert.match(prompt,/ALT-1/);assert.match(prompt,/ALT-4/);
 assert.match(prompt,/NO las reescribas|Prohibido reescribir/);
});
test('reparación fuera de orden asocia los vínculos por referencia sin alterar las preguntas',()=>{
 const batch=R.batches(plan)[0],draft=original();
 const reversed=[4,3,2,1].map(n=>({
  referencia:'ALT-'+n,habilidad:'Resolver problemas matemáticos con datos proporcionados',
  evidencia:'Calcula la cantidad solicitada en la pregunta '+n,
  criterio:'Procedimiento y solución correcta',
  estrategiasIntegradas:[n<=2?'problemas-1':'problemas-2']
 }));
 const next=R.mergeTraceRepair(draft,{trazabilidadEstrategia:reversed},plan,batch);
 assert.deepEqual(next.preguntasAlternativas,draft.preguntasAlternativas);
 assert.deepEqual(next.trazabilidadEstrategia.map(x=>x.estrategiasIntegradas),[
  ['problemas-1'],['problemas-1'],['problemas-2'],['problemas-2']
 ]);
 assert.equal(R.partIssues(next,plan,batch).filter(x=>x.startsWith('Falta vínculo')).length,0);
});
test('no inventa vínculos cuando un revisor omite el ID obligatorio',()=>{
 const draft=original(),batch=R.batches(plan)[0];
 const response={trazabilidadEstrategia:[{referencia:'ALT-1',habilidad:'Aplicar',
 evidencia:'Resuelve la pregunta uno',criterio:'Revisar cálculo',estrategiasIntegradas:[]}]};
 const next=R.mergeTraceRepair(draft,response,plan,batch);
 assert.deepEqual(next.preguntasAlternativas,draft.preguntasAlternativas);
 assert.deepEqual(next.trazabilidadEstrategia[0],draft.trazabilidadEstrategia[0]);
 assert.ok(R.partIssues(next,plan,batch).some(x=>/Falta vínculo de problemas-1 en ALT-1/.test(x)));
});
