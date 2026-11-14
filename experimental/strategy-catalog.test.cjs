const assert=require('node:assert/strict');
const X=require('./strategy-catalog.cjs');
assert(X.strategies.length>=20);
for(const [a,info] of Object.entries(X.areas)){
 const opts=X.available(a);assert(opts.length>=2,a);
 for(const s of opts)for(const material of X.materials){
  const p={area:a,asignatura:info.label,strategy:s.id,material,objective:'Analizar y aplicar contenidos del objetivo seleccionado',topic:'Situación delimitada'};
  const plan=X.plan(p);assert(plan.ok,a+' '+s.id+' '+material);assert(plan.requirements.some(x=>x.includes(s.required)));
  assert(!X.auditBlocks([{kind:s.kind,content:'corto',instructions:''}],p).ok);
  const good=[{kind:s.kind,title:'Situación nueva',content:'Contexto completo y relevante para el objetivo curricular. Se presentan antecedentes, actores, datos y perspectivas necesarias para realizar una interpretación razonada.',instructions:'Analiza la información, explica tu decisión y justifica con evidencias suficientes.',evidence:'Conclusión fundamentada'}];
  assert(X.auditBlocks(good,p).ok,a+' '+s.id+' '+material);
 }
}
assert(!X.plan({area:'matematica',strategy:'TIEMPO',material:'GUIA',objective:'Un objetivo suficientemente largo',topic:'tema'}).ok);
console.log('Catálogo experimental: '+Object.keys(X.areas).length+' áreas, '+X.strategies.length+' estrategias y '+X.materials.length+' formatos verificados.');
