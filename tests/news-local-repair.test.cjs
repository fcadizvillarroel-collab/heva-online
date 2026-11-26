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

test('repara solo el ejercicio de la placa que omite el ancho y el criterio de área',async()=>{
 const p={...plan,asignatura:'Construcciones Metálicas',objetivoAprendizaje:'Interpretar croquis acotados'};
 const original={...base,actividadAutonoma:{consigna:'Analice el croquis de una placa rectangular de largo 600 mm y espesor 10 mm. Indique si cumple el requisito de superficie.',productoEsperado:'Conclusión argumentada'},trazabilidadEstrategia:[{referencia:'AUTONOMA'}]};
 const validate=m=>P.activityIssues(m,p);
 const issues=validate(original);
 assert.deepEqual(issues,['Actividad no autosuficiente AUTONOMA: falta ancho, criterio numérico de superficie.']);
 const result=await N.repairActivity(original,p,issues,validate,async request=>{
  assert.match(request,/Interpretar croquis acotados/);
  return {actividad:{consigna:'En un croquis simulado se indica placa rectangular de 600 × 300 mm. Decide si cumple el mínimo de 1700 cm² de superficie.',productoEsperado:'Conclusión argumentada'},introduccionLectura:'Cambio indebido'};
 });
 assert.equal(result.changed,true);
 assert.deepEqual(result.issues,[]);
 assert.equal(result.base.introduccionLectura,original.introduccionLectura);
 assert.equal(result.base.trazabilidadEstrategia,original.trazabilidadEstrategia);
 assert.equal(result.base.actividadesGuiadas,original.actividadesGuiadas);
 assert.equal(result.base.noticiaDidactica,original.noticiaDidactica);
});

test('una simulación con datos sustituye la observación directa de la vela y conserva el resto',async()=>{
 const p={...plan,asignatura:'Ciencias Naturales'};
 const original={...base,ejemploGuiado:{situacion:'Observación de una vela encendida',pasos:[{accion:'Observar la llama',explicacion:'Describir cambios'}],conclusion:'Explicar el cambio'}};
 const validate=m=>P.activityIssues(m,p);
 const issues=validate(original);
 assert.match(issues[0],/EJEMPLO/);
 const rejected=await N.repairActivity(original,p,issues,validate,async()=>({actividad:original.ejemploGuiado}));
 assert.equal(rejected.changed,false);
 const result=await N.repairActivity(original,p,issues,validate,async()=>({actividad:{
  situacion:'Registro simulado. Observación 1: al minuto uno la cera está sólida. Observación 2: al minuto dos se observa un pequeño charco.',
  pasos:[{accion:'Compara ambas observaciones',explicacion:'Usa solamente el registro impreso'}],conclusion:'La cera cambió de estado.'
 }}));
 assert.equal(result.changed,true);
 assert.equal(result.base.actividadesGuiadas,original.actividadesGuiadas);
});


test('rechaza una tabla ausente en Ciencias y un separador de miles ambiguo en el croquis',()=>{
 const metal={...plan,asignatura:'Construcciones Metálicas'};
 const task={actividadAutonoma:{consigna:'Placa rectangular de 600 × 300 mm. Decide si cumple la superficie mínima de 180,000 mm².'}};
 assert.match(P.activityIssues(task,metal)[0],/ambigua/);
 task.actividadAutonoma.consigna=task.actividadAutonoma.consigna.replace('180,000','180000');
 assert.deepEqual(P.activityIssues(task,metal),[]);
 const science={...plan,asignatura:'Ciencias Naturales'};
 assert.match(P.activityIssues({ejemploGuiado:{situacion:'Registro impreso de la observación de hojas de plantas con lupa.'}},science)[0],/transcribe/);
});
