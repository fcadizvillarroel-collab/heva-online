const test=require('node:test'),assert=require('node:assert/strict'),N=require('../lib/news-repair.cjs'),P=require('../heva-pedagogy.js');
const plan={tipoMaterial:'GUIA',noticiaDidacticaModo:'SOLICITADA',objetivoAprendizaje:'Interpretar información de fuentes',asignatura:'Lenguaje',temaEspecifico:'Noticias'};
const base={titulo:'Guía',introduccionLectura:'Lectura',actividadesGuiadas:[{consigna:'Analiza los datos'}],noticiaDidactica:{titulo:'Titular',entrada:'Entrada',cuerpo:'Muy breve',relacionTema:'Tema'}};
const validate=v=>P.validate(v,plan).filter(N.isNewsIssue);
test('repairs news only, keeps other content',async()=>{const issues=validate(base);assert.ok(issues.length);const r=await N.repair(base,plan,issues,validate,async prompt=>{assert.match(prompt,/120–180 palabras/);return{noticiaDidactica:{...base.noticiaDidactica,cuerpo:'Una situación ficticia con datos pertinentes. '.repeat(20)}}});assert.equal(r.changed,true);assert.deepEqual(r.issues,[]);assert.equal(r.base.actividadesGuiadas,base.actividadesGuiadas);assert.equal(r.base.introduccionLectura,base.introduccionLectura);assert.equal(base.noticiaDidactica.cuerpo,'Muy breve');});
test('invalid patch cannot bypass validator',async()=>{const r=await N.repair(base,plan,validate(base),validate,async()=>({noticiaDidactica:{titulo:'Incompleta'}}));assert.equal(r.changed,false);assert.equal(r.base,base);});
test('no news mode removes unexpected optional resource without AI',async()=>{const p={...plan,noticiaDidacticaModo:'NO'},v=m=>P.validate(m,p).filter(N.isNewsIssue);const r=await N.repair(base,p,v(base),v,async()=>{throw Error('not needed')});assert.equal(r.changed,true);assert.equal(r.base.noticiaDidactica,null);});

test('repairs a 276-word guide without replacing activities, news or traces',async()=>{
 const original={...base,introduccionLectura:'Concepto '.repeat(276).trim(),trazabilidadEstrategia:[{referencia:'GUIADA-1'}]};
 const validateGuide=value=>{
  const issues=P.validate(value,plan);
  return [...issues,...issues.filter(N.isReadingIssue).map(issue=>'estructura: '+issue)];
 };
 const problems=validateGuide(original);
 assert.ok(problems.some(issue=>N.isReadingIssue(issue)&&issue.includes('276')));
 const result=await N.repairReading(original,plan,problems,validateGuide,async prompt=>{
  assert.match(prompt,/300 palabras/);
  assert.match(prompt,/Analiza los datos/);
  return {introduccionLectura:original.introduccionLectura+' '+Array(24).fill('Explicación').join(' '),actividadesGuiadas:[],noticiaDidactica:null};
 });
 assert.equal(result.changed,true);
 assert.deepEqual(result.issues,problems.filter(issue=>!N.isReadingIssue(issue)));
 assert.equal(result.base.introduccionLectura.split(/\s+/).length,300);
 for(const key of ['actividadesGuiadas','noticiaDidactica','trazabilidadEstrategia'])assert.equal(result.base[key],original[key]);
});

test('accessible reading repair applies its own minimum and keeps rejected drafts intact',async()=>{
 const accessible={...plan,tipoMaterial:'ACCESIBLE'};
 const validateGuide=value=>P.validate(value,accessible);
 const problems=validateGuide(base);
 const result=await N.repairReading(base,accessible,problems,validateGuide,async prompt=>{
  assert.match(prompt,/200 palabras/);
  return {introduccionLectura:'Explicación '.repeat(199)};
 });
 assert.equal(result.changed,false);
 assert.equal(result.base,base);
 assert.equal(result.issues,problems);
});
