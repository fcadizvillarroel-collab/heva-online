const test=require('node:test'),assert=require('node:assert/strict'),G=require('../heva-guide-visuals.js'),D=require('../heva-slide-design.js');
const picture={data:'data:image/png;base64,iVBORw0KGgo=',width:400,height:500,alt:'Foto docente',generated:false};
const blocks=[{title:'Título',text:'Curso',path:'titulo'},{title:'Lectura',text:'Los productos conectan decisiones económicas.',path:'introduccionLectura'},{title:'Datos',text:'Grupo A: 8 personas\nGrupo B: 12 personas',path:'activacion'},{title:'Ejemplo',text:'Problema: Falta información.\nSolución: Se propone consultar los datos.',path:'ejemploGuiado.situacion'}];
test('guide visuals select real embedded image, chart and explicit diagram without changing blocks',()=>{const m={tipoMaterial:'GUIA',titulo:'Globalización'},before=JSON.stringify(blocks),p=G.plan(m,blocks,{intercambio:{...picture,generated:true}});assert.ok(p[1].guideVisual.image);assert.deepEqual(p[2].guideVisual.chart.values,[8,12]);assert.ok(p[3].guideVisual.diagram);assert.equal(p[3].guideVisual.box,true);assert.equal(JSON.stringify(blocks),before);});
test('evaluation and teacher-only blocks receive no automatic guide visuals',()=>{assert.ok(G.plan({tipoMaterial:'EVALUACION'},blocks).every(x=>!x.guideVisual));const p=G.plan({tipoMaterial:'GUIA',titulo:'Globalización'},blocks,{intercambio:picture},1);assert.ok(p.slice(1).every(x=>!x.guideVisual));});
test('teacher guide image attaches after reading and opt-out suppresses photos',()=>{const m={tipoMaterial:'GUIA',titulo:'Globalización',imagenGuiaHEVA:picture},p=G.plan(m,blocks,{intercambio:picture});assert.equal(p[1].guideVisual.image.alt,'Foto docente');assert.ok(!G.plan({...m,ocultarImagenGuiaHEVA:true},blocks,{intercambio:picture}).some(x=>x.guideVisual?.image));assert.ok(G.attach(m,blocks.filter(x=>x.path!=='introduccionLectura')).at(-1).image);});
test('guide images stay out of IA requests and survive correction with the same OA',()=>{const m={tipoMaterial:'GUIA',objetivoAprendizaje:'OA literal',imagenGuiaHEVA:picture,ocultarImagenGuiaHEVA:false};assert.ok(!JSON.stringify(D.forAI(m)).includes('data:image'));const next=D.restoreImages(m,{tipoMaterial:'GUIA',objetivoAprendizaje:'OA literal'});assert.equal(next.imagenGuiaHEVA.data,picture.data);assert.ok(!D.restoreImages(m,{objetivoAprendizaje:'Otro OA'}).imagenGuiaHEVA);});

test('legacy reading without a path receives the teacher image after the reading',()=>{const old=[{title:'Título',text:'Curso'},{title:'Lectura',text:'Información'},{title:'Otra sección',text:'Actividad'}],a=G.attach({tipoMaterial:'GUIA',imagenGuiaHEVA:picture},old);assert.ok(a[1].image);assert.ok(!a[2].image);});

test('plain guide retains every block and disables each optional resource',()=>{const before=JSON.stringify(blocks),m={tipoMaterial:'GUIA',titulo:'Globalización',recursosVisualesHEVA:{imagenes:false,diagramas:false,graficos:false,recuadros:false}},out=G.plan(m,blocks,{intercambio:picture});for(const b of out){assert.ok(!b.guideVisual?.image);assert.ok(!b.guideVisual?.chart);assert.ok(!b.guideVisual?.diagram);assert.ok(!b.guideVisual?.box);}assert.equal(JSON.stringify(blocks),before);assert.deepEqual(out.map(x=>x.text),blocks.map(x=>x.text));});


test('guide visuals may appear in matching explanatory sections, not only the reading',()=>{
 const m={tipoMaterial:'GUIA',titulo:'Globalización'},blocks=[{title:'Título',text:'Globalización',path:'titulo'},{title:'Lectura',text:'Ideas iniciales',path:'introduccionLectura'},{title:'Intercambio de productos',text:'Comercio y proveedores',path:'desarrollo'}];
 const p=G.plan(m,blocks,{intercambio:{...picture,generated:true}});
 assert.ok(p[2].guideVisual.image,'Contextual image should reach explanatory section');
 assert.ok(!p[0].guideVisual.image);
 assert.ok(!G.plan({...m,recursosVisualesHEVA:{imagenes:false}},blocks,{intercambio:picture}).some(b=>b.guideVisual?.image));
});

test('Word guide keeps two oral registers in an editable table when enabled',()=>{
 const input=[{title:'Objetivo',text:'Expresarse con claridad',path:'titulo'},{title:'Comparemos mensajes',text:'Formal: Buenos días, ¿podría informarme del horario?\nInformal: Hola, ¿a qué hora es?',path:'introduccionLectura'}];
 const material={tipoMaterial:'GUIA',asignatura:'Lenguaje',temaEspecifico:'Registro formal e informal'};
 const planned=G.plan(material,input);
 assert.equal(planned[1].guideVisual.comparison.length,2);
 assert.match(planned[1].guideVisual.comparison[0].text,/Buenos días/);
 assert.match(planned[1].guideVisual.comparison[1].text,/Hola/);
 assert.ok(!G.plan({...material,recursosVisualesHEVA:{recuadros:false}},input)[1].guideVisual.comparison);
 assert.deepEqual(input[1].text,'Formal: Buenos días, ¿podría informarme del horario?\nInformal: Hola, ¿a qué hora es?');
});

test('Word muestra cronología con fechas originales sin inventar ni perder textos',()=>{
 const rows=[{title:'Objetivo',text:'Ubicar acontecimientos',path:'titulo'},{title:'Cronología del proceso',text:'1914: Comienza la guerra.\n1918: Termina la guerra.',path:'introduccionLectura'}];
 const m={tipoMaterial:'GUIA',asignatura:'Estudios Sociales',recursosVisualesHEVA:{imagenes:false,diagramas:true}};
 const out=G.plan(m,rows);
 assert.equal(out[1].guideVisual.timeline.length,2);
 assert.equal(out[1].guideVisual.timeline[0].fecha,'1914');
 assert.equal(out[1].guideVisual.timeline[1].hecho,'Termina la guerra.');
 const plain=G.plan({...m,recursosVisualesHEVA:{imagenes:false,diagramas:false}},rows);
 assert.equal(plain[1].guideVisual.timeline,null);
 assert.ok(!G.plan(m,[{title:'Texto',text:'Primero se analiza.\nLuego se compara.'}])[0].guideVisual.timeline);
});

test('un bloque cronológico no duplica tabla, diagrama ni gráfico',()=>{
 const m={tipoMaterial:'GUIA',recursosVisualesHEVA:{imagenes:false,diagramas:true,graficos:true,recuadros:true}};
 const input=[{title:'Cronología',path:'introduccionLectura',text:'1914: Comienza la guerra.\n1918: Termina la guerra.'}];
 const v=G.plan(m,input)[0].guideVisual;
 assert.equal(v.timeline.length,2);
 assert.equal(v.diagram,null);
 assert.equal(v.chart,null);
});
test('comparaciones de habla impiden representaciones redundantes',()=>{
 const m={tipoMaterial:'GUIA',recursosVisualesHEVA:{imagenes:false,diagramas:true,graficos:true,recuadros:true}};
 const input=[{title:'Mensajes',text:'Formal: Buenos días.\nInformal: Hola.',path:'introduccionLectura'}];
 const v=G.plan(m,input)[0].guideVisual;
 assert.equal(v.comparison.length,2);
 assert.equal(v.diagram,null);assert.equal(v.chart,null);
});

test('guías de Ciencias y TP muestran comparaciones semánticas como tabla editable',()=>{
 const input=[{title:'Prevención de riesgos',path:'introduccionLectura',text:'Riesgo: Proyección de partículas al cortar metales.\nPrevención: Utilizar protección ocular y resguardos apropiados.'}];
 const m={tipoMaterial:'GUIA',asignatura:'Construcciones Metálicas',recursosVisualesHEVA:{recuadros:true,imagenes:false,diagramas:true,graficos:true}};
 const v=G.plan(m,input)[0].guideVisual;
 assert.deepEqual(v.comparison.map(x=>x.label),['Riesgo','Prevención']);
 assert.equal(v.diagram,null);assert.equal(v.chart,null);
 assert.equal(G.plan({...m,recursosVisualesHEVA:{recuadros:false,imagenes:false,diagramas:false,graficos:false}},input)[0].guideVisual.comparison,null);
});
