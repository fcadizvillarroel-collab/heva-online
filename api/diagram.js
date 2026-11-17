// Compatibilidad con pestañas antiguas: la función fue retirada y no consume IA.
module.exports=async(req,res)=>{
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Utiliza POST.'});
 return res.status(410).json({exito:false,codigo:'FEATURE_REMOVED',error:'Los organizadores visuales con IA fueron retirados de HEVA. Actualiza la página para usar el diseño integrado de las presentaciones.'});
};
