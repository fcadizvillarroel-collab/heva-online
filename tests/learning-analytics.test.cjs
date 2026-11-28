const {test}=require('node:test');
const assert=require('node:assert/strict');
const A=require('../heva-learning-analytics.js');

const material={
 tipoMaterial:'EVALUACION',materialId:'evaluation-1',version:1,objetivoAprendizaje:'Explicar la relación entre fuentes.',
 titulo:'Identidad que no se guarda ni se exporta',
 preguntasAlternativas:[{enunciado:'Una consigna',puntajeDocente:2}],
 comprensionLectora:{texto:'Una lectura',preguntas:[{enunciado:'Interpretar la lectura'}]},
 preguntasDesarrollo:[{enunciado:'Explicar una diferencia'}]
};
const {items,signature}=A.describe(material);
const input=[{count:10,earned:8},{count:0,earned:0},{count:5,earned:11}];

test('calcula logro ponderado por puntos observados sin contar ítems sin aplicaciones',()=>{
 const report=A.summarize(items,input,60);
 assert.equal(report.earned,19);
 assert.equal(report.possible,35);
 assert.equal(report.percent,19/35*100);
 assert.deepEqual(report.rows.map(row=>row.percent),[40,null,11/15*100]);
 assert.deepEqual(report.priority.map(row=>row.label),['Alternativa 1']);
 assert.equal(A.remediation(report,material.objetivoAprendizaje).priorities[0].label,'Alternativa 1');
 assert.equal(A.remediation(A.summarize(items,input,40),material.objetivoAprendizaje),null);
});

test('valida conteos enteros, puntos acumulados, umbral y longitud',()=>{
 assert.throws(()=>A.summarize(items,[{count:10,earned:21},input[1],input[2]]),/Alternativa 1/);
 assert.throws(()=>A.summarize(items,[{count:1.1,earned:1},input[1],input[2]]),/Alternativa 1/);
 assert.throws(()=>A.summarize(items,[{count:0,earned:0.1},input[1],input[2]]),/Alternativa 1/);
 assert.throws(()=>A.summarize(items,[input[0]]),/no corresponden/);
 assert.throws(()=>A.summarize(items,input,101),/umbral/);
 assert.equal(A.describe({tipoMaterial:'GUIA'}),null);
});

test('guarda solo agregados, separa versiones y permite borrar la evaluación elegida',async()=>{
 const memory=new Map();
 const storage={getItem(key){return memory.get(key);},setItem(key,value){memory.set(key,value);}};
 const key=await A.recordKey(signature);
 const edit=await A.recordKey(A.describe({...material,version:2}).signature);
 const editedStimulus=await A.recordKey(A.describe({...material,comprensionLectora:{...material.comprensionLectora,texto:'Texto nuevo'}}).signature);
 assert.notEqual(key,edit);
 assert.notEqual(key,editedStimulus);
 A.save(storage,key,items,input,60);
 const stored=[...memory.values()][0];
 assert.deepEqual(JSON.parse(stored)[key],{threshold:60,rows:input});
 assert.doesNotMatch(stored,/evaluación|evaluation|Identidad|Una consigna|Una lectura|Alternativa/i);
 assert.equal(A.read(storage,key,items).earned,19);
 assert.equal(A.read(storage,edit,items),null);
 A.save(storage,edit,items,input,60);
 A.remove(storage,key);
 assert.equal(A.read(storage,key,items),null);
 assert.equal(A.read(storage,edit,items).earned,19);
});

test('CSV agrega solo etiquetas canónicas, valores numéricos y umbral de refuerzo',()=>{
 const csv=A.csv(A.summarize(items,input,60));
 assert.match(csv,/Alternativa 1,10,2,8,20,40.0,60/);
 assert.match(csv,/Desarrollo 1,0,3,0,0,,60/);
 assert.doesNotMatch(csv,/Identidad|Una consigna|Una lectura|Explicar la relación/);
});

test('compara la última aplicación con la anterior sin perder sus denominadores al corregir',async()=>{
 const storage={value:null,getItem(){return this.value;},setItem(_,value){this.value=value;}};
 const key=await A.recordKey(signature);
 const second=[{count:4,earned:7},{count:2,earned:3},{count:0,earned:0}];
 A.save(storage,key,items,input,60);
 const next=A.save(storage,key,items,second,70,{newApplication:true});
 assert.equal(next.earned,10);
 assert.equal(next.possible,14);
 assert.equal(next.previous.earned,19);
 assert.equal(next.previous.possible,35);
 assert.match(A.csv(next),/Alternativa 1,4,2,7,8,87.5,70,10,8,20,40.0,60/);
 assert.match(A.csv(next),/Total ponderado,,,10,14,71.4,70,,19,35,54.3,60/);
 A.save(storage,key,items,second,65);
 assert.equal(A.read(storage,key,items).previous.threshold,60);
 const third=A.save(storage,key,items,input,60,{newApplication:true});
 assert.equal(third.previous.threshold,65);
 assert.equal(third.previous.possible,14);
});
