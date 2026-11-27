'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function fixture(theme='calida',large=false,visuals=true){
 const g={HEVA:{material:m=>m,blocks:()=>[]},HEVATemplates:require('../heva-templates.js'),HEVASlideDesign:require('../heva-slide-design.js')};vm.runInNewContext(read('heva-office.js'),g);
 const m={titulo:'Comprender y aplicar conceptos en el entorno cotidiano y laboral',asignatura:'Estudios Sociales',nivel:'I NM',tipoMaterial:'PRESENTACION',plantillaVisual:theme,accesibilidadVisual:{letraGrande:large},recursosVisualesHEVA:{imagenes:false,diagramas:visuals,graficos:visuals,recuadros:visuals},diapositivas:[{titulo:'Objetivo de aprendizaje',funcion:'objetivo',contenido:['Explicar las relaciones entre las decisiones y sus consecuencias en la comunidad.']},{titulo:'Concepto central',funcion:'explicación',contenido:['Una decisión puede afectar a otras personas y al entorno en que vivimos.']},{titulo:'Ejercicio de aplicación',funcion:'aplicación',contenido:['Lee el caso y analiza las consecuencias de la decisión.','Explica tu respuesta con dos razones.']}]};return{g,m};
}
test('Word distinguishes objectives, examples, activities and reading',()=>{const {g}=fixture();const role=g.HEVAOffice.wordPurpose;assert.equal(role({path:'objetivoAprendizaje'}),'objective');assert.equal(role({path:'ejemploGuiado.pasos.0.accion'}),'example');assert.equal(role({kind:'question'}),'activity');assert.equal(role({path:'introduccionLectura'}),'reading');});
test('PowerPoint purpose and feature layouts preserve text and stay in frame in every theme',()=>{for(const theme of Object.keys(require('../heva-templates.js').themes)){const {g,m}=fixture(theme);const p=g.HEVAOffice.preview(m);assert.ok(p.pages.some(x=>x.visualKind==='purpose'));assert.ok(p.pages.some(x=>x.visualKind==='feature'));const joined=p.pages.flatMap(x=>x.elements.filter(e=>e.kind==='text').map(e=>e.text)).join(' ');for(const d of m.diapositivas)for(const content of d.contenido)assert.ok(joined.includes(content),content);for(const page of p.pages)for(const e of page.elements){assert.ok(e.x>=0&&e.y>=0&&e.x+e.w<=13.334&&e.y+e.h<=7.501,JSON.stringify(e));}}});
test('No decorative concept boxes when disabled, accessible font sizing preserved',()=>{const {g,m}=fixture('contraste',true,false);const p=g.HEVAOffice.preview(m);assert.ok(!p.pages.some(x=>x.visualKind==='purpose'||x.visualKind==='feature'));for(const page of p.pages.slice(1))for(const e of page.elements.filter(e=>e.kind==='text'&&e.fontSize>=17))assert.ok(e.fontSize>=26);});

test('Word uses one native outline level for the document title and another for each section',async()=>{
 const {g}=fixture();
 let config;
 const heading={HEADING_1:'Heading1',HEADING_2:'Heading2'};
 class Document{constructor(value){config=value;}}
 class Paragraph{constructor(value){this.value=value;}}
 class TextRun{constructor(value){this.value=value;}}
 g.docx={Document,Paragraph,TextRun,HeadingLevel:heading,Packer:{toBlob:async()=>({})}};
 g.document={createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}};
 g.URL={createObjectURL:()=>'',revokeObjectURL(){}};
 g.setTimeout=()=>{};
 g.HEVA.blocks=()=>[{title:'Objetivo curricular',text:'Interpretar evidencias.'}];
 await g.HEVAOffice.word({titulo:'Análisis de fuentes',tipoMaterial:'ACCESIBLE',accesibilidadVisual:{letraGrande:true}});
 assert.equal(config.styles.paragraphStyles,undefined,'Los estilos nativos se configuran una sola vez.');
 assert.equal(config.styles.default.heading1.paragraph.outlineLevel,0);
 assert.equal(config.styles.default.heading2.paragraph.outlineLevel,1);
 const outline=config.sections[0].children.filter(p=>p.value.heading).map(p=>[p.value.heading,p.value.text]);
 assert.equal(JSON.stringify(outline),JSON.stringify([[heading.HEADING_1,'Análisis de fuentes'],[heading.HEADING_2,'Objetivo curricular']]));
 assert.ok(config.styles.default.heading1.run.size>config.styles.default.heading2.run.size);
});

test('PowerPoint groups a short workshop action with its own precaution and keeps unrelated steps separate',()=>{
 const {g,m}=fixture();
 m.tipoMaterial='TALLER';
 g.HEVA.blocks=()=>[
  {title:'Procedimiento 1',text:'Dibuje la vista de canto.',path:'procedimientoTaller.0.accion'},
  {title:'Cuidado durante el trabajo',text:'Mantenga legibles las cotas.',path:'procedimientoTaller.0.cuidado'},
  {title:'Procedimiento 2',text:'Compruebe la unidad.',path:'procedimientoTaller.1.accion'}
 ];
 const pages=g.HEVAOffice.presentationPages(m);
 assert.equal(pages.length,2);
 assert.match(pages[0].lines.join(' '),/Dibuje la vista de canto\. Cuidado durante el trabajo: Mantenga legibles las cotas\./);
 assert.match(pages[1].lines.join(' '),/Compruebe la unidad/);
});
