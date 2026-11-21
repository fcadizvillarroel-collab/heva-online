// CORS común. No confundir la restricción de origen con autenticación.
function applyCors(req,res,{methods='POST,OPTIONS',headers='Content-Type'}={}){
 const raw=String(process.env.HEVA_ALLOWED_ORIGINS||'').trim();
 if(raw){
  const clean=s=>String(s||'').trim().replace(/\/+$/,'');
  const allowed=raw.split(',').map(clean).filter(Boolean);
  const origin=clean(req?.headers?.origin);
  res.setHeader('Vary','Origin');
  if(origin&&allowed.includes(origin))res.setHeader('Access-Control-Allow-Origin',origin);
 }else res.setHeader('Access-Control-Allow-Origin','*');
 res.setHeader('Access-Control-Allow-Methods',methods);
 res.setHeader('Access-Control-Allow-Headers',headers);
}
module.exports={applyCors};
