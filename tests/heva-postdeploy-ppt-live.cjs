'use strict';
// Ensayo del flujo REAL que ejecuta index.html: /api/recover por bloques.
// Una sola ejecución, sin secretos, sin cambios en OA ni Supabase.
const fs=require('node:fs');
const base='https://heva-online.vercel.app';
const report={fecha:new Date().toISOString(),sitio:base,flujo:'PRESENTACION por api/recover',conclusion:'no_comprobado',pruebas:[]};
const save=()=>{fs.mkdirSync('qa-live',{recursive:true});fs.writeFileSync('qa-live/resultado.json',JSON.stringify(report,null,2));};
const plan={modoHerramienta:'GENERADOR_ESTANDAR',tipoMaterial:'PRESENTACION',asignatura:'Estudios Sociales',nivel:'II Nivel Medio',
 marcoCurricular:'Decreto Supremo N° 257/2009 EPJA',
 objetivoAprendizaje:'Comprender diferentes ámbitos en los que se expresa el fenómeno de la globalización a nivel nacional y a escala planetaria distinguiendo efectos positivos y negativos en la realidad vivida.',
 temaEspecifico:'Globalización: economía, cultura y decisiones cotidianas',
 estrategiaDidactica:'Análisis de contenido disciplinar formativo',
 instruccionesDocente:'Presentación pedagógica para personas adultas con explicaciones claras, ejemplos de la vida laboral y preguntas diferentes. No atribuir datos inventados a estudios ni omitir el texto de lectura.',modoReferencia:'NINGUNA',
 cantAlternativas:0,cantDesarrollo:0,cantCasos:0,incluirTicketSalida:false};
async function request(path,body=null,ms=60000){
 const opt={method:body?'POST':'GET',headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},signal:AbortSignal.timeout(ms)};
 if(body)opt.body=JSON.stringify(body);
 const resp=await fetch(base+path,opt);const text=await resp.text();
 let data=null;try{data=JSON.parse(text)}catch{}
 return{status:resp.status,data,raw:text.slice(0,180)};
}
function log(phase,status,info={}){const row={fase:phase,statusHTTP:status,...info};report.pruebas.push(row);console.log('RECOVERY_STEP '+JSON.stringify(row));save();}
(async()=>{
 try{
  const diag=await request('/api/status',null,16000);
  const providers=diag.data?.proveedores||{};
  log('status',diag.status,{gemini:providers.gemini?.conectividad||null,groq:providers.groq?.conectividad||null});
  if(diag.status!==200||![providers.gemini,providers.groq].some(p=>p?.conectividad==='correcta')){report.conclusion='conectividad_ia_no_disponible';save();process.exitCode=2;return;}
  const init=await request('/api/recover',{plan,fase:'base'},68000);
  let d=init.data||{};log('base',init.status,{codigo:d.codigo||null,error:d.error||null,detalle:String(d.detalle||'').slice(0,500),autor:d.autor?.proveedor||null,bloques:d.bloques?.length??null});
  if(init.status!==200||!d.parte||!Array.isArray(d.bloques)){report.conclusion='fallo_base';save();process.exitCode=2;return;}
  const basePart=d.parte,autor=d.autor,bloques=d.bloques,parts=[];
  fs.writeFileSync('qa-live/checkpoint-base.json',JSON.stringify({plan,base:basePart,autor,bloques,parts},null,2));
  for(let i=0;i<bloques.length;i++){
   const b=bloques[i];
   const response=await request('/api/recover',{plan,fase:'items',base:basePart,autor,parts,batch:b},68000);
   d=response.data||{};
   const count=Array.isArray(d.parte?.diapositivas)?d.parte.diapositivas.length:null;
   log('items_'+(i+1),response.status,{codigo:d.codigo||null,error:d.error||null,detalle:String(d.detalle||'').slice(0,500),tipo:b.tipo,inicio:b.inicio,esperadas:b.cantidad,obtenidas:count,proveedor:d.autor?.proveedor||null});
   if(response.status!==200||!d.parte){report.conclusion='fallo_bloque_'+(i+1);save();process.exitCode=2;return;}
   parts[i]=d.parte;
   fs.writeFileSync('qa-live/checkpoint-parcial.json',JSON.stringify({plan,base:basePart,autor,bloques,parts},null,2));
  }
  const fin=await request('/api/recover',{plan,fase:'finalizar',base:basePart,parts,autor},68000);
  d=fin.data||{};
  log('finalizar',fin.status,{codigo:d.codigo||null,error:d.error||null,detalle:String(d.detalle||'').slice(0,550),reparacion:!!d.reparacion,
   titulo:d.material?.titulo||null,diapositivas:d.material?.diapositivas?.length||null,exito:d.exito===true,autor:d.material?.autoriaIA?.proveedor||null});
  if(d.material)fs.writeFileSync('qa-live/presentacion-real.json',JSON.stringify(d.material,null,2));
  report.conclusion=fin.status===200&&d.exito===true?'presentacion_real_completa':'no_finalizada';
  save();if(report.conclusion!=='presentacion_real_completa')process.exitCode=2;
 }catch(e){log('error_transporte',0,{name:e.name,detalle:String(e.message||e).slice(0,220)});report.conclusion='error_transporte';save();process.exitCode=2;}
})();
