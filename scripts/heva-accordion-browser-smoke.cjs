'use strict';
// HEVA piloto: comprobar cuatro acordeones sin modificar el generador ni consumir IA.
const {chromium}=require('playwright'), assert=require('node:assert/strict');
const fs=require('node:fs/promises'), path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const out=process.env.HEVA_ACCORDIONS_QA_DIR||'/tmp/heva-acordeones-qa';
 await fs.mkdir(out,{recursive:true});
 try{
  for(const width of [1365,768,390,320]){
   const page=await browser.newPage({viewport:{width,height:850}});
   const errors=[];let calls=0;
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(r.url().includes('/api/generate'))calls++});
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>document.documentElement.dataset.hevaTestAccordions==='ready',{timeout:20000});
   await page.waitForTimeout(350);
   const status=await page.evaluate(()=>{
    const stages=[1,2,3,4].map(n=>{
      const el=document.getElementById('heva-stage-'+n);
      const summary=el.querySelector(':scope > summary');
      const rect=summary.getBoundingClientRect();
      return {n,tag:el.tagName,open:el.open,
        label:summary.querySelector('.heva-inline-stage-label')?.textContent,
        help:summary.querySelector('.heva-inline-stage-hint')?.textContent,
        left:rect.left,right:rect.right,body:!!el.querySelector(':scope > .heva-test-accordion-body')};
    });
    const oa=document.getElementById('select-oa').closest('div.border-t');
    const topic=document.getElementById('tema-especifico').closest('div');
    const strategy=document.getElementById('heva-unified-pedagogy');
    const advanced=document.getElementById('heva-ajustes-adicionales');
    const before=(a,b)=>!!(a&&b&&a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);
    return {
      stages,scrollWidth:document.documentElement.scrollWidth,
      location:{
       step1:document.getElementById('heva-stage-1').contains(document.getElementById('tipo-material')),
       step2:document.getElementById('heva-stage-2').contains(document.getElementById('select-oa')),
       step3:document.getElementById('heva-stage-3').contains(document.getElementById('btn-generar')),
       step4:document.getElementById('heva-stage-4').contains(document.getElementById('barra-calidad'))
      },
      order:{oaTopic:before(oa,topic),topicStrategy:before(topic,strategy),strategyAdvanced:before(strategy,advanced)},
      goalCount:document.querySelectorAll('#select-oa').length,
      topicCount:document.querySelectorAll('#tema-especifico').length,
      strategyCount:document.querySelectorAll('#estrategia-didactica').length,
      generateCount:document.querySelectorAll('#btn-generar').length,
      secondaryStrip:document.querySelectorAll('.heva-steps').length,
      insidePanel:[1,2,3,4].every(n=>document.getElementById('panel-crear').contains(document.getElementById('heva-stage-'+n))),
      previewVisible:document.getElementById('heva-empty-preview').checkVisibility({checkVisibilityCSS:true}),
      exportsVisible:document.getElementById('barra-calidad').checkVisibility({checkVisibilityCSS:true})
    };
   });
   assert.deepEqual(status.stages.map(s=>s.tag),['DETAILS','DETAILS','DETAILS','DETAILS']);
   assert.deepEqual(status.stages.map(s=>s.label),['Tipo y nivel','Objetivo, tema y estrategia','Generar y revisar','Guardar o exportar']);
   assert.ok(status.stages.every(s=>s.help.length>=45),'Cada paso necesita explicación breve');
   assert.deepEqual(status.stages.map(s=>s.open),[true,false,false,true],
     'Paso 1 y visor abiertos; pasos 2 y 3 compactos y desplegables');
   assert.ok(status.stages.every(s=>s.left>=-2&&s.right<=width+2),'Resumen de etapa fuera de la pantalla');
   assert.ok(Object.values(status.location).every(Boolean),'Los controles deben estar en su paso');
   assert.ok(Object.values(status.order).every(Boolean),'Paso 2 debe seguir OA → tema → estrategia → ajustes');
   assert.equal(status.goalCount,1);assert.equal(status.topicCount,1);assert.equal(status.strategyCount,1);
   assert.equal(status.generateCount,1);assert.equal(status.secondaryStrip,0);
   assert.equal(status.exportsVisible,false,'No mostrar botones de descarga sin material');
   assert.equal(status.previewVisible,true,'Mostrar orientación inicial');
   assert.ok(status.scrollWidth<=width+2,'Desbordamiento horizontal general');
   await page.screenshot({path:path.join(out,'heva-acordeones-'+width+'-inicio-compacto.png'),fullPage:width===1365||width===390});
   await page.locator('#heva-stage-2 > summary').click();
   assert.equal(await page.locator('#heva-stage-2').evaluate(el=>el.open),true,'Paso 2 debe desplegarse');
   await page.screenshot({path:path.join(out,'heva-acordeones-'+width+'-paso2-abierto.png'),fullPage:width===1365||width===390});
   await page.locator('#heva-stage-2 > summary').click();
   assert.equal(await page.locator('#heva-stage-2').evaluate(el=>el.open),false,'Paso 2 debe plegarse');
   assert.equal(await page.locator('#heva-stage-2 > summary').isVisible(),true,'Resumen de paso 2 debe seguir visible');
   await page.screenshot({path:path.join(out,'heva-acordeones-'+width+'-plegados.png')});
   await page.locator('#heva-stage-2 > summary').click();
   assert.equal(await page.locator('#heva-stage-2').evaluate(el=>el.open),true,'Paso 2 debe abrirse de nuevo');
   const topic=page.locator('#tema-especifico');
   await topic.fill('Globalización y empleo local');
   await page.locator('#heva-stage-2 > summary').click();
   await page.locator('#heva-stage-2 > summary').click();
   assert.equal(await topic.inputValue(),'Globalización y empleo local','No perder la selección al plegar');
   // Los recursos LAB continúan dentro del paso 2, sin crear una segunda app.
   await page.locator('#heva-ajustes-adicionales > summary').click();
   await page.locator('#integrated-lab > summary').click();
   assert.ok(await page.locator('#lab-preview-plan').isVisible(),'LAB sigue accesible dentro del paso 2');
   await page.locator('.heva-lab-close').click();
   await page.locator('#heva-stage-1 > summary').click();
   await page.locator('.heva-start').click();
   assert.equal(await page.locator('#heva-stage-1').evaluate(el=>el.open),true,'Comenzar a crear debe abrir el paso 1');
   // Solo se simula la disponibilidad para probar el área de resultado.
   await page.evaluate(()=>{
     materialActual={titulo:'Material ficticio del test',tipoMaterial:'GUIA'};
     const article=document.getElementById('hoja-material');
     article.append(document.createElement('span'));
   });
   await page.waitForFunction(()=>document.querySelector('#heva-stage-4 .heva-inline-stage-hint')?.textContent.includes('Material disponible'),{timeout:10000});
   assert.equal(await page.locator('#heva-stage-4').evaluate(el=>el.open),true);
   assert.equal(await page.locator('#barra-calidad').isVisible(),true,'Los botones aparecen con material');
   assert.equal(calls,0,'No se deben consultar proveedores IA durante el piloto');
   assert.deepEqual(errors,[],'Sin errores Javascript');
   console.log('HEVA_ACCORDEON_OK '+JSON.stringify({width,order:status.order,stages:status.stages.map(s=>s.label),generatedCalls:calls}));
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
