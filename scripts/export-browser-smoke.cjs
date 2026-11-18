const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({acceptDownloads:true});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.HEVAOffice&&window.docx&&window.PptxGenJS),{timeout:30000});
  const material={versionPedagogica:3,tipoMaterial:'GUIA',titulo:'Globalización y vida cotidiana',asignatura:'Estudios Sociales',nivel:'III Nivel Básico',objetivoAprendizaje:'Analizar efectos de la globalización en la vida cotidiana',temaEspecifico:'Intercambio de productos',introduccionLectura:'La globalización conecta países, personas, productos y decisiones. Los bienes pueden fabricarse en diferentes lugares.',preguntasAlternativas:[],preguntasDesarrollo:[],casosEstudio:[],actividadesGuiadas:[],recursosVisualesHEVA:{imagenes:false,diagramas:true,graficos:true,recuadros:true}};
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'heva-export-'));
  for(const [name,method,signature] of [['word','word','504b0304'],['powerpoint','powerpoint','504b0304']]){
   const pending=page.waitForEvent('download',{timeout:30000});
   await page.evaluate(async({material,method})=>{await window.HEVAOffice[method](material)}, {material,method});
   const download=await pending,filename=download.suggestedFilename();
   assert.match(filename,name==='word'?/\.docx$/:/\.pptx$/);
   const target=path.join(tmp,filename);await download.saveAs(target);
   const bytes=await fs.readFile(target);assert.ok(bytes.length>2500,filename+' unexpectedly small');
   assert.equal(bytes.subarray(0,4).toString('hex'),signature);
   console.log(name+' export OK '+filename+' '+bytes.length+' bytes');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
