/* Solo lectura: cobertura documental de los 407 OA EPJA publicados. */
'use strict';
const Registry=require('../lib/oa-documentary-register.cjs');
module.exports=async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','public, max-age=180, stale-while-revalidate=300');
 if(req.method!=='GET')return res.status(405).json({error:'Solo consulta GET.'});
 const rows=Registry.items();
 const summary=Registry.summary(rows);
 const q=req.query||{};
 if(typeof q.codigo==='string'){
  const found=rows.find(x=>x.oaCodigo===q.codigo);
  return found?res.status(200).json({resumen:summary,registro:found}):res.status(404).json({error:'OA no encontrado en catálogo publicado.'});
 }
 const group=typeof q.grupo==='string'?q.grupo.trim():'';
 const filtered=group?rows.filter(x=>x.grupo===group):rows;
 const page=Math.max(1,Math.min(100,Number.parseInt(q.pagina,10)||1));
 const size=Math.max(1,Math.min(50,Number.parseInt(q.limite,10)||20));
 return res.status(200).json({resumen:summary,totalFiltrados:filtered.length,pagina:page,limite:size,
  registros:filtered.slice((page-1)*size,page*size)});
};
