#!/usr/bin/env node
'use strict';
// Single bounded real production request using a public EPJA curricular objective.
// Does not print generated material, credentials, students, or any source documents.
const fs=require('node:fs'),path=require('node:path');
const url='https://heva-online.vercel.app/api/generate';
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../catalogo-publicado.json'),'utf8'));
const oa=catalog.find(o=>o.clave_interna==='D257|MED|Consumo y Calidad de Vida|Núnico|6');
if(!oa)throw Error('The existing Supabase-backed OA snapshot does not contain the safe public test objective.');
const body={
 modoHerramienta:'GENERADOR_ESTANDAR',asignatura:oa.asignatura,nivel:'I NIVEL MEDIO',
 marcoCurricular:'Decreto Supremo N° 257/2009 EPJA',objetivoAprendizaje:oa.texto_literal,
 temaEspecifico:'Comparación de costos y decisiones informadas de consumo',
 tipoMaterial:'GUIA',cantAlternativas:1,cantDesarrollo:1,cantCasos:1,
 instruccionesDocente:'Prueba técnica con una situación ficticia de consumo; no hay estudiantes ni datos personales. Incluye un ejemplo trabajado, explicaciones claras y solo los ítems solicitados.',
 incluirTicketSalida:true,modoReferencia:'NINGUNA',
};
const out=path.join(__dirname,'../out/live-ai-production-smoke.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
const report={fecha:new Date().toISOString(),endpoint:url,tipo:'GUIA',oaClave:oa.clave_interna,
 resultado:'NO_EJECUTADO',http:null,codigoServidor:null,proveedor:null,modelo:null,alternativas:null,desarrollo:null,casos:null,
 detalle:'Verificación en producción. El informe no acredita revisión docente.'};
(async()=>{
 try{
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body),signal:AbortSignal.timeout(76000)});
  report.http=response.status;
  let data;try{data=await response.json()}catch{data={}};
  report.codigoServidor=typeof data.codigo==='string'?data.codigo.slice(0,64):null;
  if(response.status===200&&data.exito===true&&data.material){
   const m=data.material;
   report.proveedor=m.autoriaIA?.proveedor||null;
   report.modelo=m.autoriaIA?.modelo||null;
   report.alternativas=m.preguntasAlternativas?.length??null;
   report.desarrollo=m.preguntasDesarrollo?.length??null;
   report.casos=m.casosEstudio?.length??null;
   const uniqueAlternatives=(m.preguntasAlternativas||[]).every(q=>{
     const options=q.alternativas||[];return options.length===4 &&
       new Set(options.map(a=>String(a.texto||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim())).size===4;
   });
   if(m.versionPedagogica===3&&report.alternativas===1&&report.desarrollo===1&&report.casos===1&&uniqueAlternatives){
    report.resultado='GENERACION_REAL_VALIDADA_ESTRUCTURALMENTE';
    report.detalle='Generación real aceptada, trazas y conteos básicos comprobados. Revisión humana pendiente.';
    if(process.env.HEVA_LIVE_KEEP_SAMPLE==='true'){
     fs.writeFileSync(path.join(path.dirname(out),'live-ai-production-material.json'),JSON.stringify(m,null,2)+'\n',{mode:0o600});
    }
   }
   else {report.resultado='RESPUESTA_INCOMPLETA';report.detalle='HTTP 200 pero estructura, conteos o distractores no cumplen los requisitos del encargo.';}
  }else{
   report.resultado=({401:'ACCESO_DOCENTE_REQUERIDO',403:'ACCESO_DENEGADO',413:'SOLICITUD_DEMASIADO_GRANDE',422:'MATERIAL_INVALIDO',429:'CUOTA_IA_AGOTADA',502:'IA_RESPUESTA_INVALIDA',503:'PROVEEDORES_NO_DISPONIBLES'})[response.status]||'ERROR_GENERACION';
   report.detalle='Código de servidor: '+String(data.codigo||response.status)+'. Una prueba fallida no autoriza declarar generación real validada.';
  }
 }catch(error){
  report.resultado=error?.name==='TimeoutError'?'TIEMPO_AGOTADO':'ERROR_DE_CONEXION';
  report.detalle='No se pudo completar una generación real controlada.';
 }
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n','utf8');
 console.log(JSON.stringify(report));
 if(process.env.GITHUB_STEP_SUMMARY){
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### Generación real HEVA (una solicitud)\n\n- Estado: **'+report.resultado+'**\n- HTTP: '+report.http+'\n- OA: '+report.oaClave+'\n- Proveedor: '+(report.proveedor||'no confirmado')+'\n- Revisión docente: pendiente\n');
 }
 if(report.resultado!=='GENERACION_REAL_VALIDADA_ESTRUCTURALMENTE')process.exitCode=1;
})();
