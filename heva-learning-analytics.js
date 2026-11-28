/* Análisis del grupo: no recibe respuestas individuales, nombres ni identificadores de estudiantes. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./heva-assessment.js'));
 else root.HEVALearningAnalytics=factory(root.HEVAAssessment);
})(globalThis,function(assessment){
 'use strict';
 const storageKey='heva-resultados-agregados-v1';
 const maxGroup=1000;
 const suggestions={
  Alternativa:'Modela cómo contrastar opciones y justificar por qué una satisface el criterio.',
  Desarrollo:'Muestra una respuesta nueva por etapas y contrástala con un criterio observable de la pauta.',
  Caso:'Usa un caso nuevo con todos los datos y pide justificar una decisión con dos evidencias.',
  Lectura:'Segmenta un texto nuevo, localiza evidencia y vincúlala con una inferencia.',
  Relación:'Practica las relaciones con tarjetas impresas y pide explicar el criterio de asociación.',
  Ejercicio:'Resuelve un ejemplo distinto, verbaliza el procedimiento y comprueba el resultado.',
  Identificación:'Presenta ejemplos y contraejemplos y pide justificar qué rasgo permite identificar el concepto.',
  'Verdadero o falso':'Contrasta dos afirmaciones nuevas y pide corregir la falsa con una justificación.'
 };
 function describe(material){
  if(material?.tipoMaterial!=='EVALUACION')return null;
  const items=assessment.items(material);
  if(!items.length)return null;
  return {
   items:items.map(({label,points})=>({label,points})),
   // La huella cambia cuando cambia una consigna, rúbrica, ponderación o el orden.
   signature:JSON.stringify([material.materialId||null,material.version||null,material.objetivoAprendizaje||null,
    material.comprensionLectora?.texto||null,material.terminosPareados?.consigna||null,
    material.terminosPareados?.opciones||null,material.terminosPareados?.clave||null,
    items.map(({label,points,q})=>[label,points,q])])
  };
 }
 async function recordKey(signature){
  const bytes=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(signature));
  return Array.from(new Uint8Array(bytes),value=>value.toString(16).padStart(2,'0')).join('');
 }
 function summarize(items,input,threshold=60){
  if(!Number.isInteger(threshold)||threshold<0||threshold>100)throw Error('El umbral debe ser un entero entre 0 y 100.');
  if(!Array.isArray(input)||input.length!==items.length)throw Error('Los resultados no corresponden a esta versión de la evaluación.');
  const rows=items.map(({label,points},index)=>{
   const {count,earned}=input[index]||{};
   const possible=points*count;
   if(!Number.isInteger(count)||count<0||count>maxGroup||!Number.isFinite(earned)||earned<0||earned>possible){
    throw Error(label+'. Indica de 0 a '+maxGroup+' aplicaciones y un total de 0 a '+(Number.isInteger(count)&&count>=0&&count<=maxGroup?possible:'los puntos máximos')+'.');
   }
   return {label,points,count,earned,possible,percent:possible?earned/possible*100:null};
  });
  const earned=rows.reduce((sum,row)=>sum+row.earned,0);
  const possible=rows.reduce((sum,row)=>sum+row.possible,0);
  const priority=rows.filter(row=>row.percent!==null&&row.percent<threshold).sort((a,b)=>a.percent-b.percent);
  return {rows,threshold,earned,possible,percent:possible?earned/possible*100:null,priority};
 }
 function readData(storage){
  const data=JSON.parse(storage.getItem(storageKey)||'{}');
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('El registro local de resultados no se puede leer.');
  return data;
 }
 const validateKey=key=>/^[0-9a-f]{64}$/.test(key);
 function read(storage,key,items){
  const saved=validateKey(key)?readData(storage)[key]:null;
  if(!saved)return null;
  const report=summarize(items,saved.rows,saved.threshold);
  if(saved.previous)report.previous=summarize(items,saved.previous.rows,saved.previous.threshold);
  return report;
 }
 function save(storage,key,items,input,threshold,{newApplication=false}={}){
  if(!validateKey(key))throw Error('No se pudo identificar esta versión de la evaluación.');
  const report=summarize(items,input,threshold);
  if(!report.possible)throw Error('Registra resultados en al menos un ítem antes de guardar.');
  const data=readData(storage);
  const prior=data[key];
  const previous=newApplication&&prior?{threshold:prior.threshold,rows:prior.rows}:prior?.previous;
  if(previous)report.previous=summarize(items,previous.rows,previous.threshold);
  data[key]={threshold:report.threshold,rows:report.rows.map(({count,earned})=>({count,earned})),...(previous?{previous}:{})};
  storage.setItem(storageKey,JSON.stringify(data));
  return report;
 }
 function remove(storage,key){
  if(!validateKey(key))return;
  const data=readData(storage);
  delete data[key];
  storage.setItem(storageKey,JSON.stringify(data));
 }
 const percentage=value=>value===null?'':(Math.round(value*10)/10).toFixed(1);
 function csv(report){
  const heading='Ítem,Aplicaciones,Puntos por aplicación,Puntos acumulados,Puntos posibles,Logro porcentual,Umbral de refuerzo';
  const lines=report.rows.map(row=>[row.label,row.count,row.points,row.earned,row.possible,percentage(row.percent),report.threshold].join(','));
  const total=['Total ponderado','','',report.earned,report.possible,percentage(report.percent),report.threshold].join(',');
  if(!report.previous)return '\uFEFF'+[heading,...lines,total].join('\r\n')+'\r\n';
  const comparisonHeading=',Aplicaciones anteriores,Puntos acumulados anteriores,Puntos posibles anteriores,Logro porcentual anterior,Umbral anterior';
  const comparison=lines.map((line,index)=>{
   const row=report.previous.rows[index];
   return line+','+[row.count,row.earned,row.possible,percentage(row.percent),report.previous.threshold].join(',');
  });
  const previousTotal=[report.previous.earned,report.previous.possible,percentage(report.previous.percent),report.previous.threshold].join(',');
  return '\uFEFF'+[heading+comparisonHeading,...comparison,total+',,'+previousTotal].join('\r\n')+'\r\n';
 }
 function remediation(report,objective){
  if(!report.priority.length)return null;
  const priorities=report.priority.map(row=>{
   const type=row.label.replace(/ \d+$/,'');
   return {label:row.label,percent:percentage(row.percent),guidance:suggestions[type]};
  });
  return {
   objective:typeof objective==='string'?objective.trim():'',
   priorities,
   activities:[
    'Inicio. Pide recuperar el concepto o procedimiento en una situación breve y registra qué razonamiento necesita apoyo.',
    'Práctica guiada. Desarrolla un ejemplo nuevo para los ítems priorizados; pide que cada persona explique cómo llegó a su respuesta.',
    'Práctica autónoma. Propón otra situación equivalente que se pueda resolver de forma individual y con materiales impresos.',
    'Comprobación. Usa un ejercicio nuevo del mismo objetivo, aplica un criterio de la pauta y compara resultados agregados. Revisa con el grupo si la dificultad persiste.'
   ]
  };
 }
 return {describe,recordKey,summarize,read,save,remove,csv,remediation,percentage,maxGroup};
});
