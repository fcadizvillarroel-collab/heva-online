const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const HEVA=require('../heva-core.js');
const Templates=require('../heva-templates.js');
const SlideDesign=require('../heva-slide-design.js');
const rows=JSON.parse(read('catalogo-publicado.json'));

test('Catálogo original EPJA mantiene exactamente 407 registros',()=>assert.equal(rows.length,407));
test('Alias de Convivencia y TIC no altera objetivos EPJA',()=>{
 const convivencia=HEVA.catalog(rows,{marco:'DECRETO_257_2009',nivel:'II_MEDIO_TP',asignatura:'Convivencia Social y Ciudadanía'});
 const tic=HEVA.catalog(rows,{marco:'DECRETO_257_2009',nivel:'I_MEDIO_TP',asignatura:'Tecnologías de la Información (TIC)'});
 assert.equal(convivencia.length,9);
 assert.equal(tic.length,4);
 assert.ok(convivencia.every(o=>/Convivencia Social/i.test(o.asignatura)));
});
test('Catálogo principal nunca usa objetivos TP regulares como OA EPJA',()=>{
 const ui=read('heva-ui.js');
 assert.ok(ui.includes('catalogo-publicado.json'));
 assert.ok(ui.includes('localStorage.getItem(key)'));
 assert.doesNotMatch(ui,/objetivosConstruccionesMetalicas/);
 assert.ok(ui.includes('catálogo local EPJA'));
});
test('Tres estilos nuevos aportan variaciones y diseños compuestos',()=>{
 const root={HEVATemplates:Templates,HEVASlideDesign:SlideDesign,HEVAVisualAssets:{},HEVAContextAssets:{}};
 new Function('globalThis','HEVA',read('heva-office.js'))(root,HEVA);
 const slides=[
 {titulo:'Características principales',funcion:'explicación',contenido:['Destinatario y contexto: cómo cambia el trato.','Mensaje y propósito: expresar la idea.','Registro y adecuación: escoger recursos lingüísticos.'],notasDocente:'Mostrar ejemplos.'},
 {titulo:'Formal versus informal',funcion:'explicación',contenido:['Formal: Solicito su atención.','Informal: Hola, ¿cómo estás?'],notasDocente:'Comparar.'}
 ];
 const themes=['azul','gemini_calido','editorial_calido'].map(id=>Templates.layout({plantillaVisual:id}).theme);
 assert.equal(new Set(themes.map(x=>x.main)).size,3);
 for(const style of ['azul','gemini_calido','editorial_calido']){
  const p=root.HEVAOffice.preview({tipoMaterial:'PRESENTACION',titulo:'Registro formal e informal',asignatura:'Lenguaje y Comunicación',nivel:'III Nivel Básico',plantillaVisual:style,diapositivas:slides});
  assert.ok(p.visualSummary.composedPages>=2);
  assert.ok(p.visualSummary.cardPages>=1);
 }
});
test('Diagramas contextuales no mezclan asignaturas',()=>{
 assert.equal(SlideDesign.diagramPlan({title:'Registro oral',text:'Formal o informal'},'Lenguaje y Comunicación','Comunicación oral').title,'Elegir el registro adecuado');
 assert.equal(SlideDesign.diagramPlan({title:'Resolver una ecuación',text:'2x+4=12'},'Matemática','Ecuaciones lineales').title,'Resolver ecuaciones');
 const d=SlideDesign.diagramPlan({title:'Seguridad',text:'EPP'},'Construcciones Metálicas','Soldadura');
 assert.equal(d.title,'Procedimiento técnico seguro');
});
test('CORS común no emite credenciales junto con wildcard',()=>{
 assert.doesNotMatch(read('api/_cors.cjs'),/Access-Control-Allow-Credentials/);
 for(const p of ['api/generate.js','api/recover.js','api/review.js','api/sources.js','api/status.js','api/studio.js','api/curriculum/admin.js'])assert.match(read(p),/applyCors/);
});
test('Gemini envía su clave solo por cabecera',()=>{
 assert.match(read('api/_providers.cjs'),/x-goog-api-key/);
 assert.doesNotMatch(read('api/_providers.cjs'),/:generateContent\?key=/);
});
test('Word conserva OOXML válido y el panel histórico no inserta contenido sin escapar',()=>{
 assert.match(read('heva-office.js'),/lineRule:'auto'/);
 assert.doesNotMatch(read('heva-guide-visuals.js'),/shading:\{fill/);
 assert.match(read('index.html'),/hevaHtmlSeguro/);
});
test('La fuente curricular técnica sigue siendo EPJA',()=>{
 const code=read('lib/tp-metal-international.cjs');
 assert.match(code,/prioridadCurricular:'EPJA_CHILE'/);
 assert.doesNotMatch(code,/oaReferenciales:/);
});
