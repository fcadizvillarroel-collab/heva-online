'use strict';
// Reproducible browser export audit on ACTUAL Gemini responses from HEVA.
// Artifacts are public-pedagogical samples only; no student or API credentials.
// Outputs are technical evidence, not curriculum/visual approval.
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const Skills=require('../heva-skills.js');
const H=require('../heva-core.js');
const root=path.resolve(__dirname,'..');
const input=process.env.HEVA_REAL_QA_SOURCE||path.join(root,'qa-source');
const out=process.env.HEVA_REAL_QA_OUT||path.join(os.tmpdir(),'heva-real-material-audit');
async function read(p){return JSON.parse(await fs.readFile(path.join(input,p),'utf8'))}
function zipList(file){return execFileSync('unzip',['-Z','-1',file],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean)}
function xml(file,entry){return execFileSync('unzip',['-p',file,entry],{encoding:'utf8',maxBuffer:6*1024*1024})}
function strings(txt){return [...txt.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m=>m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')).join(' ')}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const report={fecha:new Date().toISOString(),evidence:'respuestas reales de producción anterior a últimas correcciones',checks:[],notApprovedForTeaching:true};
function check(name,data){report.checks.push({name,...data});console.log('REAL_OFFICE_CHECK '+JSON.stringify({name,...data}));}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 let browser=null;
 try{
  const ppt=await read('ppt/presentacion-real.json');
  const exam=await read('types/evaluacion-material.json');
  const guide=await read('types/accesible-material.json');
  const workshop=await read('types/taller-material.json');
  const plan=await read('types/planificacion-material.json');
  assert.equal(ppt.tipoMaterial,'PRESENTACION');
  assert.equal(ppt.diapositivas.length,16,'PPT de Gemini debe tener 16 diapositivas originales');
  for(const m of [ppt,exam,guide,workshop,plan]){
   assert.equal(m.versionPedagogica,3);
   assert.equal(m.autoriaIA?.proveedor,'gemini');
  }
  check('originales',{presentacion:ppt.diapositivas.length,prueba:exam.preguntasAlternativas?.length,
    planificacion:plan.planClase?.map(p=>p.minutos),taller:workshop.procedimientoTaller?.length,accesible:!!guide.modoRespuesta});
  // Exercise the SAME key rebalancing routine used by HEVA, on the real
  // four-item Gemini test. Never change the true answer or silently invent it.
  const adjusted=JSON.parse(JSON.stringify(exam));
  const originalAnswers=exam.preguntasAlternativas.map(q=>q.alternativas.find(a=>a.letra===q.claveCorrecta)?.texto);
  const balance=Skills.balanceKeys(adjusted,()=>0.37);
  const counts=H.distribution(adjusted);
  const answersPreserved=adjusted.preguntasAlternativas.every((q,i)=>
   q.alternativas.find(a=>a.letra===q.claveCorrecta)?.texto===originalAnswers[i]);
  check('claves_reales',{antes:exam.preguntasAlternativas.map(q=>q.claveCorrecta),despues:adjusted.preguntasAlternativas.map(q=>q.claveCorrecta),
    status:balance.status,changed:balance.changed||0,balanced:counts.balanced,answersPreserved,
    blocked:balance.blockedRefs||[]});
  assert.ok(answersPreserved,'Se perdió el texto de la respuesta correcta');
  // Do not pretend a blocked rationale is solved. Its diagnostic remains.
  if(!counts.balanced)throw Error('El equilibrado A-D con el material REAL sigue pendiente de corrección');

  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1366,height:850},acceptDownloads:true});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>!!window.HEVAOffice&&!!window.PptxGenJS&&!!window.docx&&!!window.HEVAQualityGate,{timeout:45000});
  const preview=await page.evaluate(m=>window.HEVAOffice.preview(m,false),ppt);
  check('previa_ppt',{paginasPreview:preview.pages?.length||null,composicion:preview.visualSummary||null});
  const pending=page.waitForEvent('download',{timeout:90000});
  await page.evaluate(async m=>window.HEVAOffice.powerpoint(m,true),ppt);
  const download=await pending,pptPath=path.join(out,'globalizacion-gemini-real.pptx');
  await download.saveAs(pptPath);
  const pptEntries=zipList(pptPath),slideEntries=pptEntries.filter(x=>/^ppt\/slides\/slide\d+\.xml$/.test(x));
  const slideTexts=slideEntries.map(x=>strings(xml(pptPath,x)));
  assert.ok(slideEntries.length>=ppt.diapositivas.length,'PPTX pierde diapositivas originales');
  assert.ok(slideTexts.every(x=>norm(x).length>22),'PPTX contiene páginas vacías');
  const all=norm(slideTexts.join(' '));
  const titlesPresent=ppt.diapositivas.map(d=>({title:d.titulo,ok:all.includes(norm(d.titulo))}));
  const missingTitles=titlesPresent.filter(x=>!x.ok).map(x=>x.title);
  const notes=pptEntries.filter(x=>/^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(x));
  check('pptx_gemini_real',{slideCount:slideEntries.length,originalSlides:ppt.diapositivas.length,bytes:(await fs.stat(pptPath)).size,
    notesPages:notes.length,missingTitles,zipValid:true});
  if(missingTitles.length)throw Error('El PPTX perdió títulos reales de Gemini: '+missingTitles.join('; '));
  if(!notes.length)throw Error('El PPTX no preservó notas docentes');

  const wordMaterials=[['evaluacion',adjusted],['planificacion',plan],['taller',workshop],['accesible',guide]];
  for(const [name,m] of wordMaterials){
   const waiting=page.waitForEvent('download',{timeout:75000});
   await page.evaluate(async item=>window.HEVAOffice.word(item,false),m);
   const asset=await waiting,filename=path.join(out,name+'-gemini-real-estudiante.docx');
   await asset.saveAs(filename);
   assert.ok(zipList(filename).includes('word/document.xml'));
   const text=xml(filename,'word/document.xml');
   assert.ok(text.includes('Globalizaci')||text.includes('globalizaci'),'Word '+name+' perdió el tema');
   assert.ok(!text.includes('PAUTA DOCENTE · USO EXCLUSIVO'),'Pauta reservada visible en Word estudiante '+name);
   if(name==='evaluacion'){
    const answerText=adjusted.preguntasAlternativas[0].justificacion;
    assert.ok(!text.includes(answerText),'La explicación correcta aparece en la prueba de estudiantes');
    assert.ok(text.includes(adjusted.preguntasAlternativas[0].enunciado.slice(0,23)),'Falta el enunciado real de pregunta');
   }
   check('docx_'+name,{bytes:(await fs.stat(filename)).size,pedagogicalSource:'Gemini original',
    qa:'estructura OOXML y privacidad de pauta'});
  }
  const final={...report,conclusion:'generacion_y_exportaciones_reales_verificadas_tecnicamente',
    advertencia:'No equivale a inspección visual exhaustiva, verificación factual ni aprobación docente'};
  await fs.writeFile(path.join(out,'reporte.json'),JSON.stringify(final,null,2));
 }catch(err){
  report.conclusion='prueba_fallida';report.error=String(err.stack||err).slice(0,2000);
  await fs.writeFile(path.join(out,'reporte.json'),JSON.stringify(report,null,2));
  throw err;
 }finally{if(browser)await browser.close();}
})().catch(err=>{console.error('HEVA_REAL_OFFICE_FAILED',String(err.stack||err).slice(0,2700));process.exitCode=1});
