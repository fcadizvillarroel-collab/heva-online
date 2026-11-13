const S=require('../lib/document-sources.cjs');
module.exports=async function(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
 if(req.method==='OPTIONS')return res.status(200).end();if(req.method!=='POST')return res.status(405).json({error:'Utilice POST.'});
 const plan=req.body||{};if(['asignatura','marcoCurricular','objetivoAprendizaje','temaEspecifico'].some(k=>typeof plan[k]!=='string'||plan[k].length>3000))return res.status(400).json({error:'Selecciona marco, asignatura, objetivo y tema.'});
 try{return res.status(200).json({exito:true,fuentes:await S.retrieve(plan)})}catch{return res.status(503).json({error:'Consulta documental no disponible. No se declara verificación.'})}
};
