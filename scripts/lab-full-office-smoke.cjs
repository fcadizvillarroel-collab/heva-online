'use strict';
// Exportación real de un PPTX con 16 diapositivas diferenciadas y una guía Word.
// El contenido es didáctico/sintético. No proviene de Gemini ni demuestra revisión curricular.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {execFileSync}=require('node:child_process');

const sections=[
 ['Propósito de la sesión','Reconocer las dimensiones de la globalización y explicar oportunidades y desafíos en la vida adulta.'],
 ['Idea central','La globalización incrementa conexiones entre personas y territorios mediante intercambios económicos, culturales y tecnológicos.'],
 ['Intercambio económico','Un producto regional puede venderse en otros países, pero deben examinarse costos de envío, calidad y condiciones comerciales.'],
 ['Dimensión cultural','La circulación de música, relatos y alimentos puede ampliar conocimientos y transformar hábitos locales.'],
 ['Dimensión tecnológica','Las comunicaciones permiten coordinar actividades a distancia, pero el acceso digital sigue siendo desigual.'],
 ['Efectos ambientales','El transporte y los residuos de envases producen impactos que conviene comparar con los posibles beneficios de cada actividad.'],
 ['Caso de una cooperativa','Una cooperativa local considera vender fuera de la región. Debe evaluar ingresos previstos, costos de embalaje y continuidad de suministro.'],
 ['Modelamiento de decisiones','Paso 1: identifique oportunidad. Paso 2: describa un riesgo. Paso 3: solicite información y justifique la decisión.'],
 ['Comparación fundamentada','Situación A: venta a comercio local. Situación B: convenio con distribuidor externo. Compare costos, compradores y riesgos.'],
 ['Vida laboral','Un empleo vinculado a cadenas de suministro exige distinguir habilidades transferibles y medidas de seguridad pertinentes.'],
 ['Economía familiar','La variación del precio de un producto importado invita a comparar alternativas de compra y anticipar gastos.'],
 ['Sociedad y cultura','La llegada de nuevos contenidos culturales ofrece oportunidades de intercambio; también plantea decisiones sobre patrimonio local.'],
 ['Datos de ejemplo','Serie SIMULADA: pedidos atendidos de 10 en 2024, 12 en 2025 y 15 en 2026. Calcule el cambio, sin atribuirlo a estadísticas oficiales.'],
 ['Desafío con información','Explique qué dato falta para decidir si la cooperativa puede aumentar producción sin comprometer sus recursos.'],
 ['Aplicación autónoma','Escriba una recomendación para una organización local con una oportunidad, un riesgo y dos argumentos basados en el caso.'],
 ['Cierre y autoevaluación','Distinga una consecuencia económica y una ambiental. Señale qué evidencia ayudaría a confirmar su explicación.']
];
const material={
 titulo:'Globalización y vida adulta · muestra técnica HEVA',tipoMaterial:'PRESENTACION',
 asignatura:'Estudios Sociales',nivel:'II Nivel Medio',versionPedagogica:3,
 objetivoAprendizaje:'Objetivo demostrativo, sujeto a revisión docente; no sustituye el OA oficial EPJA.',
 temaEspecifico:'Dimensiones y efectos de la globalización',
 plantillaVisual:'editorial_calido',
 recursosVisualesHEVA:{imagenes:false,diagramas:true,graficos:true,recuadros:true},
 diapositivas:sections.map(([titulo,contenido],i)=>({
   titulo,funcion:i===0?'objetivo':i===7?'modelamiento':i>=13&&i<=14?'aplicación':i===15?'cierre':'explicación',
   contenido:[contenido,'Pregunta de análisis: ¿Qué información permite justificar una explicación vinculada al ejemplo?'],
   notasDocente:'Ejemplo sintético para revisar la presentación. No atribuir a una fuente oficial; comprobar pertinencia con los OA EPJA.'
 }))
};
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({acceptDownloads:true,viewport:{width:1366,height:900}});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.HEVAOffice&&window.PptxGenJS&&window.docx,{timeout:30000});
  const preview=await page.evaluate(m=>window.HEVAOffice.preview(m,false),material);
  assert.ok(preview.pages.length>=17,'La portada y las 16 diapositivas deben estar presentes');
  assert.ok(preview.visualSummary.composedPages>=4,'No hay suficientes páginas con composición visual');
  const output=process.env.HEVA_RESULT_QA_DIR||path.join(os.tmpdir(),'heva-lab-visual');
  await fs.mkdir(output,{recursive:true});
  const pending=page.waitForEvent('download',{timeout:75000});
  await page.evaluate(m=>window.HEVAOffice.powerpoint(m,false),material);
  const download=await pending;
  assert.match(download.suggestedFilename(),/\.pptx$/i);
  const pptPath=path.join(output,'heva-globalizacion-presentacion-demostrativa.pptx');
  await download.saveAs(pptPath);
  const buffer=await fs.readFile(pptPath);
  assert.equal(buffer.subarray(0,4).toString('hex'),'504b0304');
  const entries=execFileSync('unzip',['-Z','-1',pptPath],{encoding:'utf-8'});
  const slides=[...entries.matchAll(/^ppt\/slides\/slide\d+\.xml$/gm)].map(x=>x[0]);
  assert.ok(slides.length>=17,'PPTX exportado con menos diapositivas de las diseñadas: '+slides.length);
  for(const slide of slides){
    const xml=execFileSync('unzip',['-p',pptPath,slide],{encoding:'utf-8'});
    const raw=[...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m=>m[1]).join(' ');
    assert.ok(raw.length>=20,'Diapositiva casi vacía: '+slide);
    assert.ok(!/undefined|lorem ipsum|por definir/i.test(raw),'Texto de relleno en '+slide);
  }
  const nums=preview.visualSummary;
  console.log('PowerPoint sintético exportado:',JSON.stringify({slides:slides.length,charts:nums.charts,
   diagrams:nums.diagrams,composedPages:nums.composedPages,bytes:buffer.length}));
  const guide=await page.evaluate(async()=>{const r=await fetch('/experimental/ejemplo-globalizacion.json');if(!r.ok)throw Error('Falta la guía modelo');return r.json()});
  const wordPending=page.waitForEvent('download',{timeout:60000});
  await page.evaluate(m=>window.HEVAOffice.word({...m,tipoMaterial:'GUIA'},false),guide);
  const docxDownload=await wordPending;
  assert.match(docxDownload.suggestedFilename(),/\.docx$/i);
  const wordPath=path.join(output,'heva-globalizacion-guia-demostrativa.docx');
  await docxDownload.saveAs(wordPath);
  const docBytes=await fs.readFile(wordPath);
  assert.equal(docBytes.subarray(0,4).toString('hex'),'504b0304');
  const docXml=execFileSync('unzip',['-p',wordPath,'word/document.xml'],{encoding:'utf-8'});
  assert.ok(docXml.includes('Globalizaci'),'La guía Word no contiene el título esperado');
  for(const section of ['Ejemplo guiado','Práctica con apoyo','Ahora tú','Cierre y reflexión','Vocabulario']){
    assert.ok(docXml.includes(section),'Word perdió sección pedagógica: '+section);
  }
  assert.ok(!docXml.includes('PAUTA DOCENTE · USO EXCLUSIVO'),'Word de estudiante expone pautas reservadas');
  console.log('Word modelo completo:',docBytes.length,'bytes; glosario, práctica, modelamiento y cierre conservados.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
