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
    const selectStart=stdout.indexOf('<select id="oa-select"');
    assert.ok(selectStart>=0,'Falta el selector de OA.');
    const choices=stdout.slice(selectStart,stdout.indexOf('</select>',selectStart));
    assert.ok(choices.includes('value="D257|')||choices.includes('value="B24|'),'No existen OA reales en el DOM.');
    const infoStart=stdout.indexOf('<p id="oa-info"');
    assert.ok(infoStart>=0,'Falta el estado curricular.');
    const info=stdout.slice(infoStart,stdout.indexOf('</p>',infoStart));
    assert.ok(info.includes('OA publicados disponibles'),'No se cargó el catálogo curricular.');
    assert.ok(!info.includes('No se pudo consultar el catálogo:'),'Chrome muestra error de carga del currículo.');
    const shot=path.join(outputDir,'heva-lab-1280.png');
    await run(binary,[...base,'--screenshot='+shot,url],{timeout:30000,maxBuffer:3*1024*1024});
    const png=fs.readFileSync(shot);
    assert.ok(png.byteLength>10000,'Captura vacía o no generada');
    assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a','Captura PNG inválida');
    const mobile=path.join(outputDir,'heva-lab-mobile-430.png');
    await run(binary,[...base.filter(x=>!x.startsWith('--window-size=')),'--window-size=430,900','--screenshot='+mobile,url],{timeout:30000,maxBuffer:3*1024*1024});
    const mobilePng=fs.readFileSync(mobile);
    assert.ok(mobilePng.byteLength>9000,'Captura móvil incompleta');
    assert.equal(mobilePng.toString('hex',0,8),'89504e470d0a1a0a');
    console.log('Capturas visuales:',shot,mobile,'bytes:',png.length,mobilePng.length);
  }finally{
    await new Promise(resolve=>srv.close(resolve));
  }
},{timeout:85000});
