'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:860}});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(document.getElementById('heva-result-edit')&&document.getElementById('heva-result-review')),{timeout:30000});
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
   return edit?.previousElementSibling===article&&review?.previousElementSibling===edit
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
  assert.equal(result.reviewHidden,false);
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
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1});
