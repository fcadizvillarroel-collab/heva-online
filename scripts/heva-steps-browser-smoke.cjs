'use strict';
/* Inspección DOM real de las cuatro etapas visibles. No usa IA ni datos docentes. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const dir=process.env.HEVA_STEPS_QA_DIR||'/tmp/heva-steps-qa';
 await fs.mkdir(dir,{recursive:true});
 try{
  for(const width of [1365,768,390,320]){
   const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
   let calls=0;page.on('request',r=>{if(r.url().includes('/api/generate'))calls++});
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>document.getElementById('heva-stage-4')&&document.getElementById('heva-ajustes-adicionales'),{timeout:16000});
   const state=async()=>page.evaluate(()=>{
    const stages=[1,2,3,4].map(n=>{
     const el=document.getElementById('heva-stage-'+n);
     const r=el.getBoundingClientRect();
     return {number:n,label:el.querySelector('.heva-inline-stage-label')?.textContent,
       hidden:el.hidden,display:getComputedStyle(el).display,
       hint:el.querySelector('.heva-inline-stage-hint')?.textContent||'',
       left:r.left,right:r.right,width:r.width,top:r.top,
       next:el.nextElementSibling?.id||el.nextElementSibling?.querySelector?.('select,input,textarea')?.id||''};
    });
    const type=document.getElementById('tipo-material');
    const oa=document.getElementById('select-oa');
    const submit=document.getElementById('btn-generar');
    const bar=document.getElementById('barra-calidad');
    const s1=document.getElementById('heva-stage-1');
    const s2=document.getElementById('heva-stage-2');
    const s3=document.getElementById('heva-stage-3');
    const s4=document.getElementById('heva-stage-4');
    return {
      stages,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,
      duplicates:[...document.querySelectorAll('[id^="heva-stage-"]')].length,
      matches:{
        first:s1?.contains(type),
        second:s2?.contains(oa),
        third:s3?.contains(submit),
        fifth:s3?.nextElementSibling===document.getElementById('heva-result-edit')&&!s3.contains(document.getElementById('heva-result-edit')),
        fourth:s4?.contains(document.getElementById('heva-empty-preview'))&&s4?.contains(bar)
      },
      subNumbers:[...document.querySelectorAll('#heva-ajustes-adicionales summary')]
        .filter(x=>/^\s*[1-4]\./.test(x.textContent)).map(x=>x.textContent.trim())
    };
   });
   const before=await state();
   assert.equal(await page.locator('.heva-steps').count(),0,'No conservar una segunda franja duplicada de pasos');
   assert.equal(before.duplicates,4,'No debe haber números repetidos');
   assert.deepEqual(before.stages.map(s=>s.label),[
     'Tipo y nivel','Objetivo, tema y estrategia','Generar y revisar','Guardar o exportar'
   ]);
   assert.ok(Object.values(before.matches).every(Boolean),'Los números deben acompañar a sus campos reales: '+JSON.stringify(before.matches));
   assert.equal(await page.locator('#heva-result-edit').isVisible(),false,'Paso 5 no disponible antes de generar');
   assert.equal(before.stages[3].hidden,false,'Paso 4 debe estar visible aun antes de generar');
   assert.match(before.stages[3].hint,/Disponible después de generar/,'Avisar que la exportación requiere material');
   assert.equal(await page.locator('#barra-calidad').isVisible(),false,'Los botones permanecen ocultos sin material');
   assert.deepEqual(before.subNumbers,[],'No confundir pasos principales con números de opciones');
   assert.ok(before.scrollWidth<=width+2,'Desbordamiento horizontal con etapas');
   for(const s of before.stages){
     assert.equal(s.hidden,false);
     assert.ok(s.left>=-2&&s.right<=width+2,'Etapa '+s.number+' fuera de pantalla');
   }
   await page.screenshot({path:path.join(dir,'pasos-'+width+'-antes.png'),fullPage:width===390||width===1365});
   // Emular solo que se recibió contenido para verificar la transición visual.
   await page.evaluate(()=>{
     materialActual={titulo:'Caso de prueba local',tipoMaterial:'GUIA'};
     const mark=document.createElement('span');
     mark.hidden=true;mark.textContent='control de visibilidad';
     document.getElementById('hoja-material').append(mark);
   });
   await page.waitForFunction(()=>{
      const h=document.getElementById('heva-stage-4'),bar=document.getElementById('barra-calidad');
      return h&&!h.hidden&&bar&&getComputedStyle(bar).display!=='none';
   },{timeout:12000});
   const after=await state();
   assert.equal(after.stages[3].hidden,false,'Paso 4 sigue visible tras recibir material');
   assert.match(after.stages[3].hint,/Material disponible/,'Indicar disponibilidad al generar material');
   assert.equal(after.duplicates,4,'Etapas originales conservadas después de generar');
   assert.ok(after.matches.fifth&&after.matches.third,'Paso 5 independiente y generación dentro del paso 3');
   assert.equal(await page.locator('#heva-result-edit').isVisible(),true,'Paso 5 disponible tras generar');
   await page.locator('#heva-result-edit > summary').click();
   assert.equal(await page.locator('#heva-result-edit #heva-review-existing').isVisible(),true,'Revisión disponible en el paso 5');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Sin desbordamiento con paso 5 abierto');
   assert.ok(after.scrollWidth<=width+2,'Desbordamiento horizontal después de generar');
   assert.equal(calls,0,'Prueba no debe consumir IA');
   await page.screenshot({path:path.join(dir,'pasos-'+width+'-resultado.png')});
   console.log('HEVA PASOS',JSON.stringify({width,labels:before.stages.map(x=>x.label),beforeVisible:before.stages.filter(x=>!x.hidden).length,afterVisible:after.stages.filter(x=>!x.hidden).length,overflow:after.scrollWidth-width}));
   await page.close();
  }
  console.log('APROBADO: cuatro pasos visibles desde el inicio en escritorio, tableta y móvil.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
