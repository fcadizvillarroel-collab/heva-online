'use strict';
// Cuatro ensayos acotados contra la producción pública existente.
// No contienen claves ni modifican OA; no hacen reintentos automáticos.
const fs=require('node:fs');
const base='https://heva-online.vercel.app';
const report={fecha:new Date().toISOString(),sitio:base,flujo:'EVALUACION, PLANIFICACION, TALLER y ACCESIBLE',pruebas:[],conclusion:'no_comprobado'};
const save=()=>{fs.mkdirSync('qa-live',{recursive:true});fs.writeFileSync('qa-live/resultado.json',JSON.stringify(report,null,2));};
const oa='Comprender diferentes ámbitos en los que se expresa el fenómeno de la globalización a nivel nacional y a escala planetaria distinguiendo efectos positivos y negativos en la realidad vivida.';
const cases=[
 {tipoMaterial:'EVALUACION',cantAlternativas:4,temaEspecifico:'Globalización: efectos económicos y culturales',instruccionesDocente:'Prueba de cuatro alternativas con casos breves diferentes, distractores plausibles y respuestas equilibradas A–D; sin datos falsos atribuidos a noticias reales.'},
 {tipoMaterial:'PLANIFICACION',cantAlternativas:0,temaEspecifico:'Globalización en la vida cotidiana',instruccionesDocente:'Clase EPJA de 90 minutos, con inicio, explicación de contenido, modelado, práctica auténtica y cierre; recursos impresos y sin celulares, con criterios de aprendizaje.'},
 {tipoMaterial:'TALLER',cantAlternativas:0,temaEspecifico:'Globalización y decisiones responsables de consumo',instruccionesDocente:'Taller EPJA con ejemplo demostrativo, tarea breve, procedimiento y pauta de cotejo realista. No requerir internet, teléfonos ni datos falsos.'},
 {tipoMaterial:'ACCESIBLE',cantAlternativas:0,temaEspecifico:'Globalización y decisiones cotidianas accesibles',instruccionesDocente:'Guía de lectura acompañada para personas adultas, letra accesible, vocabulario y ejemplos concretos, apta para evaluación leída sin imágenes obligatorias.'}
];
async function request(path,payload=null,ms=58000){
 const response=await fetch(base+path,{method:payload?'POST':'GET',headers:{Accept:'application/json',...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(ms)});
 let data=null;const text=await response.text();try{data=JSON.parse(text)}catch{};
 return {status:response.status,data,raw:text.slice(0,160)};
}
const row=v=>{report.pruebas.push(v);console.log('MATERIAL_REAL '+JSON.stringify(v));save();};
(async()=>{
 try{
  const status=await request('/api/status',null,12000);
  const pp=status.data?.proveedores||{};
  row({tipo:'STATUS',http:status.status,gemini:pp.gemini?.conectividad||null,groq:pp.groq?.conectividad||null});
  if(status.status!==200||![pp.gemini,pp.groq].some(x=>x?.conectividad==='correcta'))throw Error('Sin conectividad de proveedores confirmada');
  for(const c of cases){
   const payload={modoHerramienta:'GENERADOR_ESTANDAR',asignatura:'Estudios Sociales',nivel:'II Nivel Medio',marcoCurricular:'Decreto Supremo N° 257/2009 EPJA',objetivoAprendizaje:oa,
     temaEspecifico:c.temaEspecifico,estrategiaDidactica:'Análisis de contenido disciplinar formativo',
     instruccionesDocente:c.instruccionesDocente,modoReferencia:'NINGUNA',
     tipoMaterial:c.tipoMaterial,cantAlternativas:c.cantAlternativas,cantDesarrollo:0,cantCasos:0,incluirTicketSalida:false};
   const r=await request('/api/generate',payload,59000);
   const d=r.data||{},m=d.material||null;
   row({tipo:c.tipoMaterial,http:r.status,exito:d.exito===true,codigo:d.codigo||null,
    error:String(d.error||'').slice(0,220),detalle:String(d.detalle||'').slice(0,470),
    proveedor:m?.autoriaIA?.proveedor||null,versionPedagogica:m?.versionPedagogica||null,titulo:m?.titulo||null,
    alternativas:m?.preguntasAlternativas?.length??null,
    claves:m?.preguntasAlternativas?.map(x=>x.claveCorrecta)||null,
    momentos:m?.planClase?.map(x=>({momento:x.momento,minutos:x.minutos}))||null,
    procedimiento:m?.procedimientoTaller?.length||null,accesibilidad:m?.modoRespuesta||null});
   if(m)fs.writeFileSync('qa-live/'+c.tipoMaterial.toLowerCase()+'-material.json',JSON.stringify(m,null,2));
   if(r.status===429||d.codigo==='AI_RATE_LIMIT'){report.conclusion='cuota_agotada_sin_reintentos';break;}
  }
  if(report.conclusion==='no_comprobado')report.conclusion=report.pruebas.slice(1).every(x=>x.http===200&&x.exito)?'todos_generados':'generaciones_parciales';
  save();
  if(report.conclusion!=='todos_generados')process.exitCode=2;
 }catch(e){row({tipo:'ERROR',detalle:String(e.message||e).slice(0,260)});report.conclusion='error_transporte';save();process.exitCode=2;}
})();
