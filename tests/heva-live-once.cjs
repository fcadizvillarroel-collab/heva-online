'use strict';
// Ensayo puntual para la instancia PUBLICADA. No importa OA, no escribe Supabase
// y usa una única solicitud de material solo si al menos un proveedor responde.
const fs=require('node:fs');
const base='https://heva-online.vercel.app';
const report={fecha:new Date().toISOString(),sitio:base,conclusion:'no_comprobado',pruebas:[]};
function write(){fs.mkdirSync('qa-live',{recursive:true});fs.writeFileSync('qa-live/resultado.json',JSON.stringify(report,null,2));}
async function request(url,opts={},max=12000){
 const r=await fetch(url,{...opts,redirect:'follow',signal:AbortSignal.timeout(max),headers:{Accept:'application/json',...(opts.headers||{})}});
 const text=await r.text();let data=null;try{data=JSON.parse(text)}catch{}
 return{status:r.status,contentType:r.headers.get('content-type')||'',data,fragmentoError:data?undefined:text.slice(0,110)};
}
(async()=>{
 try{
  const status=await request(base+'/api/status',{},15000);
  const providers=status.data?.proveedores||{};
  const known={statusHTTP:status.status,gemini:providers.gemini||null,groq:providers.groq||null};
  report.pruebas.push({nombre:'conectividad_proveedores',...known});
  console.log('DIAGNOSTICO:',JSON.stringify(known));
  const active=[providers.gemini,providers.groq].some(p=>p?.conectividad==='correcta');
  if(status.status!==200||!active){
   report.conclusion='bloqueo_proveedor_o_acceso';
   report.motivo=status.data?.error||status.fragmentoError||'No hay proveedor con conectividad confirmada';
   write();process.exitCode=2;return;
  }
  const payload={modoHerramienta:'GENERADOR_ESTANDAR',tipoMaterial:'GUIA',
   asignatura:'Estudios Sociales',nivel:'II Nivel Medio',marcoCurricular:'Decreto Supremo N° 257/2009 EPJA',
   objetivoAprendizaje:'Comprender diferentes ámbitos en los que se expresa el fenómeno de la globalización a nivel nacional y a escala planetaria distinguiendo efectos positivos y negativos en la realidad vivida.',
   temaEspecifico:'Globalización y decisiones cotidianas',
   estrategiaDidactica:'Análisis de contenido disciplinar formativo',
   instruccionesDocente:'Ensayo técnico de una guía corta de EPJA con un ejemplo completo sobre compras o trabajo, una actividad diferente y lenguaje adulto. No atribuir datos a fuentes reales inexistentes.',
   modoReferencia:'NINGUNA',cantAlternativas:0,cantDesarrollo:0,cantCasos:0,incluirTicketSalida:false};
  const result=await request(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)},85000);
  const data=result.data||{};
  const material=data.material||data.borrador||null;
  report.pruebas.push({nombre:'generacion_real',statusHTTP:result.status,exito:data.exito===true,codigo:data.codigo||null,
   error:data.error||null,detalle:String(data.detalle||'').slice(0,900),
   cantidadAlternativas:material?.preguntasAlternativas?.length??null,
   versionPedagogica:material?.versionPedagogica??null,
   titulo:material?.titulo||null,autorIA:material?.autoriaIA?.proveedor||null,
   tieneObjetivo:!!material?.objetivoAprendizaje,tieneEjemplo:!!material?.ejemploGuiado,
   fuenteNoVerificada:Boolean(material?.incidenciasDocumentales?.length)});
  if(material){
    // Única fuente: respuesta real del servidor. Se conserva para revisión posterior,
    // sin datos de docentes o estudiantes ni credenciales.
    fs.mkdirSync('qa-live',{recursive:true});
    fs.writeFileSync('qa-live/material-recibido.json',JSON.stringify(material,null,2));
  }
  report.conclusion=data.exito===true&&result.status===200?'generacion_real_confirmada':'generacion_real_fallida';
  if(result.status===200)console.log('GENERACION:',JSON.stringify({status:result.status,titulo:material?.titulo,autor:material?.autoriaIA?.proveedor,completa:data.exito===true}));
  else console.log('GENERACION_NO_VALIDADA:',JSON.stringify({status:result.status,codigo:data.codigo,error:data.error,detalle:String(data.detalle||'').slice(0,350)}));
  write();if(report.conclusion!=='generacion_real_confirmada')process.exitCode=2;
 }catch(e){
  report.conclusion='error_de_transporte';report.motivo=String(e.message).slice(0,250);
  console.log('ERROR_TRANSPORTE',String(e.name)+': '+String(e.message).slice(0,180));
  write();process.exitCode=2;
 }
})();
