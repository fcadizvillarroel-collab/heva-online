'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:860}});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(document.getElementById('heva-result-edit')&&document.getElementById('heva-result-review')),{timeout:30000});
  assert.equal(await page.locator('#hoja-material').isVisible(),false,'No mostrar documento ficticio antes de generar');
  assert.equal(await page.locator('#barra-calidad').isVisible(),false,'Ocultar descargas antes de generar');
  assert.equal(await page.locator('#heva-empty-preview').isVisible(),true,'Mostrar mensaje de espera mientras no hay material');
  // Synthetic DOM scenario: no AI call or fabricated claim of material generation.
  await page.evaluate(()=>{
   materialActual={titulo:'Ejemplo de revisión del visor',tipoMaterial:'GUIA'};
   const article=document.getElementById('hoja-material');
   document.getElementById('doc-titulo').textContent='GUÍA DEMOSTRATIVA · REVISIÓN VISUAL';
   let teacher=document.getElementById('heva-teacher-tools');
   if(!teacher){teacher=document.createElement('section');teacher.id='heva-teacher-tools';article.before(teacher);}
   if(!teacher.querySelector('h3')){const h=document.createElement('h3');h.textContent='Revisar y adaptar el material';teacher.append(h);}
   for(const [name,id] of [['Recursos visuales · con o sin','btn-visual-test'],['Imagen de apoyo de la guía','heva-guide-image-action'],['Editar y ordenar bloques','btn-edit-test'],['Comparar versiones','btn-history-test']]){
    if(document.getElementById(id)||[...teacher.querySelectorAll('button')].some(b=>b.textContent===name))continue;
    const btn=document.createElement('button');btn.type='button';btn.textContent=name;btn.id=id;teacher.append(btn);
   }
   let refs=document.getElementById('heva-textbook-references');
   if(!refs){refs=document.createElement('details');refs.id='heva-textbook-references';teacher.append(refs);}
   if(!refs.querySelector('summary')){const summary=document.createElement('summary');summary.textContent='Textos escolares de apoyo · referencias para revisar';refs.append(summary);}
   let audit=document.getElementById('heva-experimental-audit');
   if(!audit){audit=document.createElement('details');audit.id='heva-experimental-audit';article.before(audit);}
   let title=audit.querySelector('summary');
   if(!title){title=document.createElement('summary');audit.append(title);}
   title.textContent='Auditoría experimental: 0 errores estructurales y 2 advertencias';
   let exportControl=document.getElementById('heva-export-control');
   if(!exportControl){exportControl=document.createElement('section');exportControl.id='heva-export-control';exportControl.textContent='Control de calidad antes de exportar';article.before(exportControl);}
  });
  await page.waitForFunction(()=>{
   const article=document.getElementById('hoja-material');
   const edit=document.getElementById('heva-result-edit'),review=document.getElementById('heva-result-review');
   return edit?.previousElementSibling===document.getElementById('heva-stage-3')&&review?.previousElementSibling===article
     &&document.getElementById('heva-teacher-tools')?.parentElement===edit
     &&document.getElementById('heva-experimental-audit')?.parentElement===review
     &&document.getElementById('heva-export-control')?.closest('#revision-contenido')
     &&document.getElementById('heva-textbook-references')?.parentElement===review;
  },{timeout:15000});
  await page.waitForFunction(()=>document.querySelector('#heva-result-review > summary')?.textContent.includes('2 advertencias'),{timeout:10000});
  await page.waitForFunction(()=>[...document.querySelectorAll('#heva-actions-resources button')].some(b=>b.textContent.includes('imágenes, diagramas y gráficos')),{timeout:10000});
  const result=await page.evaluate(()=>{
   const edit=document.getElementById('heva-result-edit'),review=document.getElementById('heva-result-review');
   return{
    editHidden:edit.hidden,reviewHidden:review.hidden,
    reviewTitle:review.querySelector('summary')?.textContent||'',
    visualLabel:[...document.querySelectorAll('#heva-actions-resources button')].find(b=>b.textContent.includes('imágenes, diagramas y gráficos'))?.textContent,
    guideImageLabel:document.getElementById('heva-guide-image-action')?.textContent,
    editButtons:[...document.querySelectorAll('#heva-actions-edit button')].map(x=>x.textContent),
    resourcesButtons:[...document.querySelectorAll('#heva-actions-resources button')].map(x=>x.textContent),
    leadingText:[...document.getElementById('hoja-material').parentElement.childNodes].filter(x=>x.nodeType===Node.TEXT_NODE).map(x=>x.textContent).join('')
   };
  });
  assert.equal(result.editHidden,false);
  assert.equal(await page.locator('#heva-result-edit #panel-review-studio').count(),1,'Una sola ubicación de edición y revisión');
  assert.equal(await page.locator('#tab-review-studio,#heva-review-inline,#heva-review-quick').count(),0,'Sin pestaña ni botones redundantes');
  assert.equal(result.reviewHidden,false);
  assert.equal(await page.locator('#hoja-material').isVisible(),true,'Mostrar documento al disponer de material');
  assert.equal(await page.locator('#barra-calidad').isVisible(),true,'Habilitar zona de exportaciones al disponer de material');
  assert.equal(await page.locator('#heva-empty-preview').isVisible(),false,'Ocultar mensaje de espera cuando existe material');
  assert.match(result.reviewTitle,/2 advertencias/);
  assert.match(result.visualLabel,/imágenes, diagramas y gráficos/);
  assert.match(result.guideImageLabel,/imagen de apoyo/);
  assert.ok(result.editButtons.some(x=>x.includes('Editar')));
  assert.ok(result.resourcesButtons.some(x=>x.includes('imágenes')));
  assert.ok(!result.leadingText.includes('\\n'),'Encontrado salto literal visible');
  const out=process.env.HEVA_RESULT_QA_DIR||path.join(os.tmpdir(),'heva-result-qa');
  await fs.mkdir(out,{recursive:true});
  await page.screenshot({path:path.join(out,'heva-guia-visor-ordenado.png'),fullPage:true});
  console.log('Visor integrado: artículo primero, herramientas debajo, advertencias agrupadas, etiquetas claras.');
  // Reproducir el caso reportado: Firefox/Chrome con una prueba de 6 ALT, 2 DES, 2 CASO pendiente.
  // El checkpoint es sintético y solo se escribe en un contexto aislado de Chromium.
  const recovery=await browser.newPage({viewport:{width:1366,height:768}});
  await recovery.addInitScript(()=>{
   const plan={tipoMaterial:'EVALUACION',cantAlternativas:6,cantDesarrollo:2,cantCasos:2,
    asignatura:'Estudios Sociales',nivel:'I Nivel Medio',marcoCurricular:'Bases Curriculares EPJA 2024',
    objetivoAprendizaje:'Evaluar cambios históricos',temaEspecifico:'Globalización'};
   localStorage.setItem('heva-recuperacion-v2',JSON.stringify({version:2,planKey:JSON.stringify(plan),parts:[]}));
  });
  await recovery.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await recovery.waitForFunction(()=>Boolean(document.querySelector('#heva-resume-recovery .heva-recovery-actions')&&document.querySelector('#heva-stage-1')),{timeout:30000});
  const toggle=recovery.locator('#heva-resume-toggle');
  const actions=recovery.locator('#heva-resume-recovery .heva-recovery-actions');
  assert.equal(await actions.isVisible(),false,'Los controles deben iniciar contraídos');
  await toggle.click();
  assert.equal(await actions.isVisible(),true,'El docente puede desplegar las opciones');
  const layout=await recovery.evaluate(()=>{
   const card=document.getElementById('heva-resume-recovery');
   const action=[...card.querySelectorAll('button')].find(x=>x.textContent.includes('Apartar'));
   const steps=document.querySelector('#heva-stage-1');
   const type=document.getElementById('tipo-material');
   const form=type.closest('div.bg-white');
   const rect=x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   return {actions:card.querySelectorAll('button').length,
    stepsInsideRecovery:card.contains(steps),stepsInsideButton:!!action?.contains(steps),
    stepsInsideForm:form.contains(steps),stepsCount:document.querySelectorAll('details[id^="heva-stage-"]').length,
    cardRect:rect(card),actionRect:rect(action),stepsRect:rect(steps),
    data:localStorage.getItem('heva-recuperacion-v2'),
    buttons:[...card.querySelectorAll('button')].map(x=>x.textContent.trim())};
  });
  assert.equal(layout.actions,3,'La recuperación debe ofrecer continuar, apartar y descartar');
  assert.ok(layout.buttons.some(x=>x.includes('Descartar definitivamente')),'Debe existir descarte explícito');
  assert.equal(layout.stepsInsideRecovery,false,'Los pasos no pueden estar dentro de la recuperación');
  assert.equal(layout.stepsInsideButton,false,'Los pasos no pueden estar dentro del botón Apartar');
  assert.equal(layout.stepsInsideForm,true,'Los pasos deben estar en el formulario del tipo de material');
  assert.equal(layout.stepsCount,4,'Deben existir cuatro etapas en el cuerpo, sin otra lista repetida');
  assert.ok(layout.actionRect.top>=layout.cardRect.top&&layout.actionRect.bottom<=layout.cardRect.bottom+1,'Apartar debe quedar dentro de la tarjeta');
  assert.ok(layout.actionRect.width>=190&&layout.actionRect.height>=44,'Botón Apartar legible y usable');
  assert.ok(layout.stepsRect.top>=layout.cardRect.bottom-1,'El paso 1 no debe superponerse a la recuperación');
  const saved=JSON.parse(layout.data);
  assert.equal(saved.version,2,'Mantener versión del checkpoint');
  assert.equal(saved.parts.length,0,'No agregar ni borrar bloques del avance');
  assert.equal(JSON.parse(saved.planKey).cantAlternativas,6,'Conservar cantidad de alternativas solicitadas');
  assert.equal(JSON.parse(saved.planKey).cantDesarrollo,2,'Conservar desarrollo solicitado');
  assert.equal(JSON.parse(saved.planKey).cantCasos,2,'Conservar casos solicitados');
  await toggle.click();
  assert.equal(await actions.isVisible(),false,'Los controles deben poder ocultarse nuevamente');
  assert.equal(await recovery.evaluate(()=>localStorage.getItem('heva-recuperacion-v2')),layout.data,'Contraer no modifica el avance');
  await recovery.screenshot({path:path.join(out,'heva-prueba-pendiente-sin-superposicion.png'),fullPage:true});
  console.log('Recuperación visual de prueba comprobada: controles separados, pasos en formulario y checkpoint intacto.');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1});
