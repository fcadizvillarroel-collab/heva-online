'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const os=require('node:os');
const {promisify}=require('node:util');
const {execFile}=require('node:child_process');
const run=promisify(execFile);
const ROOT=path.resolve(__dirname,'..');
const MIMES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8'};
function chrome(){
  for(const executable of ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser']){
    if(fs.existsSync(executable))return executable;
  }
  throw new Error('No hay Chrome/Chromium disponible; prueba visual no realizada.');
}
function server(){
  return http.createServer((req,res)=>{
    let pathname;
    try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return res.writeHead(400).end();}
    if(pathname==='/experimental/'||pathname==='/experimental')pathname='/experimental/index.html';
    const full=path.resolve(ROOT,'.'+pathname);
    if(full!==ROOT&&!full.startsWith(ROOT+path.sep))return res.writeHead(403).end();
    fs.readFile(full,(err,data)=>{
      if(err)return res.writeHead(404).end('Not found');
      res.setHeader('Content-Type',MIMES[path.extname(full)]||'application/octet-stream');
      res.writeHead(200).end(data);
    });
  });
}
test('Chrome carga estrategias y catálogo EPJA sin error de JavaScript',async()=>{
  const binary=chrome(),srv=server();
  await new Promise((resolve,reject)=>{srv.once('error',reject);srv.listen(0,'127.0.0.1',resolve)});
  const url='http://127.0.0.1:'+srv.address().port+'/experimental/';
  const outputDir=process.env.HEVA_QA_ARTIFACT_DIR||path.join(os.tmpdir(),'heva-lab-visual');
  fs.mkdirSync(outputDir,{recursive:true});
  try{
    const base=['--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--hide-scrollbars','--virtual-time-budget=4000','--window-size=1280,1000'];
    const {stdout}=await run(binary,[...base,'--dump-dom',url],{timeout:30000,maxBuffer:12*1024*1024});
    assert.match(stdout,/id="oa-select"/,'Falta el selector de OA');
    assert.match(stdout,/OA publicados disponibles/,'No se cargó el catálogo EPJA');
    assert.match(stdout,/<option value="(?:B24|D257)\|/,'No se encontraron opciones reales del catálogo');
    assert.doesNotMatch(stdout,/No se pudo consultar el catálogo:/,'La interfaz no pudo cargar el currículo');
    const shot=path.join(outputDir,'heva-lab-1280.png');
    await run(binary,[...base,'--screenshot='+shot,url],{timeout:30000,maxBuffer:3*1024*1024});
    const png=fs.readFileSync(shot);
    assert.ok(png.byteLength>10000,'Captura vacía o no generada');
    assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a','Captura PNG inválida');
    console.log('Captura visual:',shot,'bytes:',png.length);
  }finally{
    await new Promise(resolve=>srv.close(resolve));
  }
},{timeout:85000});
