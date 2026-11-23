'use strict';
// La interfaz principal permite configurar, simular y ver un modelo de HEVA LAB
// sin abandonar / ni consumir llamadas de Gemini/Groq.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  let generationCalls=0;
  page.on('request',r=>{if(r.url().includes('/api/generate'))generationCalls++});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.HEVAStrategyLab&&window.HEVAIntegration&&
    window.HEVALabMaterialView&&window.hevaExperimentalPlan),{timeout:30000});
  assert.equal(await page.locator('a[href="/experimental/"]').count(),0,
    'HEVA principal no debe ofrecer una segunda aplicación de LAB');
  assert.equal(await page.locator('#heva-abrir-estrategias').count(),0,
    'El botón duplicado del encabezado debe desaparecer');
  await page.locator('#heva-ajustes-adicionales > summary').click();
  await page.locator('#integrated-lab > summary').click();
  assert.equal(await page.locator('#integrated-lab').evaluate(el=>el.open),true,
    'El mismo formulario debe abrir la configuración de estrategias');
  assert.equal(await page.locator('#heva-ajustes-adicionales').evaluate(el=>el.open),true,
    'La sección de ajustes debe permanecer abierta');
  assert.equal(await page.locator('#lab-preview-model').isVisible(),true,
    'La guía modelo debe quedar visible al abrir las estrategias');
  const strategyEvidence=page.locator('#heva-strategy-evidence');
  assert.equal(await strategyEvidence.count(),1,'Debe existir solo una explicación desplegable de la estrategia');
  assert.equal(await strategyEvidence.evaluate(el=>el.open),false,'La explicación larga debe estar plegada');
  const hierarchy=await page.evaluate(()=>({
    topic:document.querySelector('#tema-especifico').closest('div')?.getBoundingClientRect().top,
    strategy:document.querySelector('#heva-unified-pedagogy')?.getBoundingClientRect().top
  }));
  assert.ok(hierarchy.topic<hierarchy.strategy,'El tema debe preceder a la estrategia');
  await page.locator('#lab-preview-model').click();
  const frame=page.frameLocator('#lab-preview-result iframe');
  await frame.locator('body').waitFor({timeout:12000});
  const model=await frame.locator('body').innerText();
  assert.ok(model.includes('Globalización'),'No se presenta la guía modelo');
  assert.ok(!model.includes('Clave:'),'Se filtró una clave docente al ejemplo estudiante');
  assert.equal(await page.locator('#lab-preview-result iframe').getAttribute('sandbox'),'',
    'El ejemplo insertado debe aislarse de scripts y del documento principal');
  // Configurar un plan usando un OA oficial existente; no se genera contenido.
  await page.evaluate(async()=>{
   const catalog=await (await fetch('/catalogo-publicado.json')).json();
   const oa=catalog.find(x=>x.estado==='APROBADO'&&x.referencia_comprobada&&x.texto_literal);
   if(!oa)throw Error('No hay OA EPJA publicado');
   document.querySelector('#texto-oa').value=oa.texto_literal;
   document.querySelector('#tema-especifico').value='Globalización y vida adulta';
   document.querySelector('#tipo-material').value='GUIA';
   document.querySelector('#tipo-material').dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.locator('#lab-enabled').check();
  const first=page.locator('#lab-strategies details[open] input[data-strategy]:not([disabled])').first();
  await first.check();
  await page.locator('#lab-preview-plan').click();
  const text=await page.locator('#lab-preview-result').innerText();
  assert.ok(text.includes('Diseño de actividades · vista previa sin IA'),text.slice(0,400));
  assert.equal(await page.locator('#lab-preview-result ol li').count(),1);
  assert.equal(generationCalls,0,'La simulación sin IA no debe llamar al generador');
  assert.ok(await page.locator('#btn-generar').count(),'El botón real de generar debe seguir disponible');
  console.log('HEVA principal+LAB integrado: ruta única, panel, guía modelo segura, plan OA EPJA sin IA y botón generar.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
