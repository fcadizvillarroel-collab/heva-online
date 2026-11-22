'use strict';
// Inspección visual REAL en Chromium del HTML de HEVA LAB.
// Se usan materiales sintéticos; no se simula una generación con IA.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');

(async()=>{
 const browser=await chromium.launch({headless:true});
 const out=process.env.HEVA_RESULT_QA_DIR||path.join(os.tmpdir(),'heva-lab-visual');
 await fs.mkdir(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:880},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:8765/experimental/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.HEVALabMaterialView&&window.HEVAStrategyLab,{timeout:15000});
  const sample=await page.evaluate(async()=>{
   const response=await fetch('./ejemplo-globalizacion.json');
   if(!response.ok)throw Error('No se recuperó el ejemplo');
   const material=await response.json();
   const report=window.HEVALabMaterialView.audit(material,'GUIA',{alternativas:6,desarrollo:2,casos:2});
   if(!report.ok)throw Error('Guía modelo no aprobó auditoría estructural: '+report.issues.join('; '));
   return{student:window.HEVALabMaterialView.html(material,'GUIA','student'),
      teacher:window.HEVALabMaterialView.html(material,'GUIA','teacher')};
  });
  await page.setContent(sample.student,{waitUntil:'load'});
  assert.equal(await page.locator('header h1').count(),1);
  assert.equal(await page.locator('.options').count(),6);
  const studentText=await page.locator('body').innerText();
  assert.ok(!studentText.includes('Clave:'),'La hoja de estudiante mostró pautas');
  assert.ok(!studentText.includes('Criterio:'),'La hoja de estudiante mostró criterios privados');
  await page.screenshot({path:path.join(out,'lab-globalizacion-estudiante.png'),fullPage:true});
  await page.setContent(sample.teacher,{waitUntil:'load'});
  assert.ok((await page.locator('body').innerText()).includes('Clave:'));
  await page.screenshot({path:path.join(out,'lab-globalizacion-docente.png'),fullPage:true});

  const presentation=await page.evaluate(()=>{
    const slides=Array.from({length:5},(_,i)=>({
      titulo:'Actividad '+(i+1)+' · Dimensiones de la globalización',
      contenido:{texto:'Compara dos situaciones económicas o culturales. Identifica las consecuencias y justifica con la información de la tabla.',
      tabla:{encabezados:['Dimensión','Situación','Consecuencia'],filas:[
       ['Económica','Venta de productos regionales en otros países','Más mercados y variación de precios'],
       ['Cultural','Intercambio de música y relatos','Difusión y transformación de costumbres']
      ]},notasDocente:'NO MOSTRAR LA PAUTA EN LA DIAPOSITIVA'},
      notasDocente:'Docente: contraste ejemplos y pida explicación argumentada.'
    }));
    return window.HEVALabMaterialView.html({
      titulo:'Globalización · comparar consecuencias',asignatura:'Estudios Sociales',
      objetivoAprendizaje:'OA EPJA demostrativo para inspección visual (no certificado)',
      diapositivas:slides},'PRESENTACION','student');
  });
  await page.setContent(presentation,{waitUntil:'load'});
  assert.equal(await page.locator('.heva-slide').count(),5);
  assert.equal(await page.locator('table').count(),5);
  assert.equal(await page.locator('table tr').count(),15);
  assert.ok(!(await page.locator('body').innerText()).includes('NO MOSTRAR LA PAUTA'));
  assert.ok(!(await page.locator('body').innerText()).includes('Docente: contraste'));
  await page.screenshot({path:path.join(out,'lab-diapositivas-tablas-escritorio.png'),fullPage:true});
  const printable=await page.evaluate(()=>({
   slides:[...document.querySelectorAll('.heva-slide')].map(x=>({
      width:x.getBoundingClientRect().width,
      height:x.getBoundingClientRect().height,
      title:x.querySelector('h3')?.textContent,
      table:x.querySelector('table')!==null
   })),
   maxWidth:document.documentElement.scrollWidth
  }));
  assert.ok(printable.slides.every(x=>x.height>=300&&x.table&&x.title));
  await page.setViewportSize({width:375,height:812});
  await page.screenshot({path:path.join(out,'lab-diapositivas-tablas-movil.png'),fullPage:true});
  const mobile=await page.evaluate(()=>({
   bodyWidth:document.body.clientWidth,
   documentWidth:document.documentElement.scrollWidth,
   viewport:window.innerWidth,
   scrollPanels:[...document.querySelectorAll('.table-scroll')].length
  }));
  // Las tablas largas se desplazan dentro de cada diapositiva, no sobre toda la página.
  assert.ok(mobile.documentWidth<=mobile.viewport+2,
   'Desbordamiento horizontal de página en móvil: '+JSON.stringify(mobile));
  assert.equal(mobile.scrollPanels,5);
  console.log('HEVA LAB Chromium: guía estudiante/docente, 5 diapositivas, tablas seguras, móvil sin desbordamiento, capturas guardadas.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
