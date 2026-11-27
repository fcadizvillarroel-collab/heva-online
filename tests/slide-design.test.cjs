const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),D=require('../heva-slide-design.js');
const sample={data:'data:image/png;base64,iVBORw0KGgo=',width:400,height:500,alt:'Descripción',generated:true};
const section=(title,text,role='explicación')=>({title,text,role});
function office(){const c={HEVA:require('../heva-core.js'),HEVAPedagogy:require('../heva-pedagogy.js'),HEVATemplates:require('../heva-templates.js'),HEVASlideDesign:D,HEVAGuideVisuals:require('../heva-guide-visuals.js'),document:{createElement:()=>({getContext:()=>null})}};vm.createContext(c);for(const name of ['heva-visual-assets.js','heva-context-assets.js','heva-office.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+name),'utf8'),c);return c.HEVAOffice;}
test('images require embedded supported data, dimensions and bounded size',()=>{assert.ok(D.image(sample));for(const image of [{...sample,data:'https://example.com/image.jpg'},{...sample,data:'data:image/svg+xml;base64,AAAA'},{...sample,width:Infinity},{...sample,height:0},{...sample,data:'data:image/jpeg;base64,'+'A'.repeat(1800001)}])assert.equal(D.image(image),null);});
test('automatic photos require both a matching topic and slide and occur once',()=>{const m={tipoMaterial:'PRESENTACION',titulo:'Globalización'},s=[section('Objetivo','Aprender'),section('Economía','Los productos circulan entre países'),section('Intercambio','Otros productos circulan')],before=JSON.stringify(s),out=D.decorate(m,s,{intercambio:sample});assert.ok(!out[0].image);assert.ok(out[1].image);assert.ok(!out[2].image);assert.equal(JSON.stringify(s),before);assert.ok(!D.decorate({...m,titulo:'Geometría'},s,{intercambio:sample}).some(x=>x.image));});
test('evaluations and high contrast do not acquire illustrative photos',()=>{const s=[section('Objetivo','Algo'),section('Economía','Los productos circulan')];for(const m of [{tipoMaterial:'EVALUACION',titulo:'Globalización'},{tipoMaterial:'PRESENTACION',titulo:'Globalización',accesibilidadVisual:{contraste:true}}])assert.ok(!D.decorate(m,s,{intercambio:sample}).some(x=>x.image));});
test('teacher image wins and explicit hide survives without altering content',()=>{const own={...sample,alt:'Mi fuente',generated:false},s=[section('Objetivo','Algo'),{...section('Economía','Productos'),image:own},{...section('Intercambio','Productos'),hideImage:true}],m={tipoMaterial:'PRESENTACION',titulo:'Globalización'},out=D.decorate(m,s,{intercambio:sample});assert.equal(out[1].image.alt,'Mi fuente');assert.equal(out[2].image,null);});
test('contain preserves image proportions and stays inside allotted box',()=>{const b={x:8.45,y:1.75,w:4.03,h:4.82};for(const [width,height]of [[1600,900],[400,500],[900,1600]]){const r=D.contain({width,height},b);assert.ok(Math.abs(r.w/r.h-width/height)<.0001);assert.ok(r.x>=b.x&&r.y>=b.y&&r.x+r.w<=b.x+b.w+.001&&r.y+r.h<=b.y+b.h+.001);}});
test('slide function determines an activity even when its title omits the word',()=>{assert.equal(D.role(section('Una decisión','Datos','aplicación')),'activity');const v=office().preview({tipoMaterial:'PRESENTACION',titulo:'Ejemplo',diapositivas:[{titulo:'Una decisión',funcion:'aplicación',contenido:['Lee los datos del caso.','¿Qué decisión tomarías y por qué?'],notasDocente:'CLAVE RESERVADA'}]});const p=v.pages[1];assert.ok(['8B2635','975C3D'].includes(p.background.color),'La actividad debe diferenciarse visualmente con contraste suficiente');assert.ok(p.elements.some(x=>x.fontSize===30&&x.bold&&x.text.includes('¿Qué')));assert.ok(!p.elements.some(x=>x.text?.includes('CLAVE RESERVADA')));});
test('illustrated slide retains all text and caption, never repeats its photo on continuations',()=>{const O=office(),phrase='Los productos se trasladan entre países y conectan decisiones de personas y empresas.',m={tipoMaterial:'PRESENTACION',titulo:'Globalización',diapositivas:[{titulo:'Objetivo',contenido:['Analizar conexiones']},{titulo:'Intercambio de productos',funcion:'explicación',contenido:[Array(25).fill(phrase).join(' ')],notasDocente:'SOLUCIÓN RESERVADA'}]},before=JSON.stringify(m),v=O.preview(m),elements=v.pages.flatMap(p=>p.elements),text=elements.filter(x=>x.kind==='text').map(x=>x.text).join(' ');assert.equal(JSON.stringify(m),before);assert.equal(elements.filter(x=>x.kind==='image').length,1,'Sin consentimiento, la portada decorativa no se inserta');assert.equal(v.pages[0].elements.filter(x=>x.kind==='image').length,0);assert.equal(text.split(phrase).length-1,25);assert.match(text,/IMAGEN ILUSTRATIVA GENERADA/);assert.ok(!text.includes('SOLUCIÓN RESERVADA'));assert.ok(elements.every(x=>x.x>=0&&x.y>=0&&x.x+x.w<=13.34&&x.y+x.h<=7.51));});

test('guided example shows its complete phases in an editable sequence',()=>{const lines=['Identifica dos plazos de entrega.','Compara los plazos con el día de entrega.','Fundamenta la decisión con los datos.'],v=office().preview({titulo:'Ejemplo',tipoMaterial:'PRESENTACION',diapositivas:[{titulo:'Decisión fundamentada',funcion:'modelamiento',contenido:lines}]}),text=v.pages[1].elements.filter(x=>x.kind==='text');for(const line of lines)assert.ok(text.some(x=>x.text===line));assert.deepEqual(Array.from(text.filter(x=>x.fontSize===38),x=>x.text),['1','2','3']);});
test('bar chart accepts only explicit comparable rows with matching units',()=>{const c=D.dataChart(['Proveedor cercano: 2 días','Proveedor distante: 12 días']);assert.deepEqual(c.values,[2,12]);assert.equal(c.unit,'días');assert.deepEqual(D.dataChart(['A: 2,5 kg','B: 3 kg']).values,[2.5,3]);for(const rows of [['A: 2','B: 12'],['A: 2 días','B: 12 personas'],['A: -2 días','B: 12 días'],['A: 1.000 pesos','B: 12 pesos'],['A: 2 días','A: 12 días'],['Una oración 2 días','Otra oración 12 días']])assert.equal(D.dataChart(rows),null);});
test('native chart preview preserves source labels, values and complete visible data',()=>{const O=office(),lines=['Proveedor cercano: 2 días','Proveedor distante: 12 días'],v=O.preview({titulo:'Comparación',tipoMaterial:'PRESENTACION',diapositivas:[{titulo:'Plazos de entrega',contenido:lines}]}),p=v.pages[1],chart=p.elements.find(x=>x.kind==='chart');assert.ok(chart);assert.deepEqual(Array.from(chart.data[0].values),[2,12]);assert.equal(chart.barDir,'bar');assert.equal(chart.valAxisMinVal,0);for(const line of lines)assert.ok(p.elements.some(x=>x.text?.includes(line)));});
test('local images are excluded from AI requests and restored only on unique matching slide titles',()=>{const m={titulo:'Material',diapositivas:[{titulo:'Uno',contenido:['Texto'],imagenHEVA:sample,ocultarImagenHEVA:false},{titulo:'Dos',contenido:['Más texto'],ocultarImagenHEVA:true}]},before=JSON.stringify(m),clean=D.forAI(m);assert.ok(!JSON.stringify(clean).includes('data:image'));assert.ok(!('ocultarImagenHEVA' in clean.diapositivas[1]));assert.equal(JSON.stringify(m),before);const fixed=D.restoreImages(m,{diapositivas:[{titulo:'Uno',contenido:['Corregido']},{titulo:'Nuevo',contenido:['Distinto']},{titulo:'Dos'}]});assert.equal(fixed.diapositivas[0].imagenHEVA.data,sample.data);assert.ok(!fixed.diapositivas[1].imagenHEVA);assert.equal(fixed.diapositivas[2].ocultarImagenHEVA,true);assert.equal(fixed.diapositivas[0].contenido[0],'Corregido');});

test('comparison of alternatives is a visual comparison, not a multiple-choice question',()=>{const O=office();assert.equal(O.classifySlide('Comparación de alternativas',[],0),'compare');assert.equal(O.classifySlide('Selección múltiple 1',[],0),'question');const lines=['Proveedor cercano: entrega en dos días.','Proveedor distante: entrega en doce días.'],p=O.preview({titulo:'Opciones',tipoMaterial:'PRESENTACION',diapositivas:[{titulo:'Comparación de alternativas',contenido:lines}]}).pages[1];assert.equal(p.elements.filter(x=>x.kind==='shape'&&x.shape==='roundRect').length,2);for(const line of lines)assert.ok(p.elements.some(x=>x.text===line));});

test('converting an evaluation to PPT does not add a chart to its stimuli',()=>{const v=office().preview({tipoMaterial:'EVALUACION',titulo:'Prueba',diapositivas:[{titulo:'Datos',contenido:['Grupo A: 8 personas','Grupo B: 12 personas']}],preguntasAlternativas:[],preguntasDesarrollo:[],casosEstudio:[]});assert.ok(!v.pages.flatMap(p=>p.elements).some(x=>x.kind==='chart'));});
test('all generic interiors are composed even without role metadata or topic photos',()=>{const m={titulo:'Material anterior',tipoMaterial:'PRESENTACION',asignatura:'Inglés',diapositivas:Array.from({length:16},(_,i)=>({titulo:'Contenido '+(i+1),contenido:i%3===0?['Una explicación completa para el bloque '+(i+1)+'.']:i%3===1?['Una primera información concreta para leer.','Otra información concreta que completa el contenido.']:['Identifica la información entregada.','Relaciona los datos que corresponden.','Fundamenta la respuesta con la información disponible.']}))},before=JSON.stringify(m),v=office().preview(m);assert.equal(v.pages.length,17);for(const p of v.pages.slice(1)){assert.ok(p.elements.some(x=>x.kind==='shape'&&x.shape==='roundRect'),'Cada interior tiene composición propia');assert.ok(!p.elements.some(x=>x.kind==='image'),'No depende de imágenes temáticas');assert.ok(p.elements.every(x=>x.x>=0&&x.y>=0&&x.x+x.w<=13.34&&x.y+x.h<=7.51));}assert.equal(JSON.stringify(m),before);const all=v.pages.flatMap(p=>p.elements.filter(x=>x.kind==='text').map(x=>x.text)).join('\n');for(const d of m.diapositivas)for(const line of d.contenido)assert.ok(all.includes(line));});
test('guide converted to PPT receives the new interior compositions too',()=>{const m={tipoMaterial:'GUIA',titulo:'Guía anterior',introduccionLectura:'Una lectura de apoyo suficientemente clara para realizar la tarea.',preguntasAlternativas:[],preguntasDesarrollo:[],casosEstudio:[],diapositivas:[],listaCotejoTP:[],objetivoAprendizaje:'Comunicar una explicación.'},v=office().preview(m);assert.ok(v.pages.length>1);for(const p of v.pages.slice(1))assert.ok(p.elements.some(x=>x.kind==='shape'&&x.shape==='roundRect'));assert.ok(v.pages.flatMap(p=>p.elements).some(x=>x.text?.includes(m.introduccionLectura)));});
test('dense generic pages retain every phrase in framed readable continuations',()=>{const sentence='La información permite justificar una decisión con datos explícitos.',O=office(),v=O.preview({tipoMaterial:'PRESENTACION',titulo:'Lectura extensa',diapositivas:[{titulo:'Contenido',contenido:[sentence.repeat(40)]}]}),text=v.pages.flatMap(p=>p.elements.filter(x=>x.kind==='text').map(x=>x.text)).join(' ');const body=v.pages.slice(1).flatMap(p=>p.elements.filter(x=>x.kind==='text'&&x.y>=2.2&&x.y<6.6).map(x=>x.text)).join(' ');assert.equal(body.replace(/\s/g,''),sentence.repeat(40).replace(/\s/g,''));assert.ok(v.pages.length>3);for(const p of v.pages.slice(1))assert.ok(p.elements.some(x=>x.kind==='shape'&&x.shape==='roundRect'));assert.ok(v.pages.flatMap(p=>p.elements).filter(x=>x.kind==='text'&&x.text.includes('información')).every(x=>x.fontSize>=26));});

test('pagination preserves decimal numbers and punctuation without spaces',()=>{const O=office(),source=('El valor simulado es 1.000,50 pesos.Consulta el dato antes de comparar. ').repeat(30),parts=O.paginatePresentation({title:'Información',text:source});assert.equal(parts.flat().join(' ').replace(/\s/g,''),source.replace(/\s/g,''));assert.equal(parts.flat().join(' ').split('1.000,50').length-1,30);});
test('explicit relations use source labels without inferring links between ordinary paragraphs',()=>{assert.ok(D.relation(['Causa: Se retrasa el despacho.','Consecuencia: Los materiales llegan después.']));assert.ok(D.relation(['Paso 1: Lee los datos.','Paso 2: Compara los plazos.']));assert.equal(D.relation(['Paso 2: Compara.','Paso 1: Lee.']),null);assert.equal(D.relation(['Una frase general.','Otra frase general.']),null);const lines=['Problema: Faltan materiales para completar el pedido.','Solución: Se propone coordinar una entrega más temprana.'],v=office().preview({tipoMaterial:'PRESENTACION',titulo:'Situación simulada',diapositivas:[{titulo:'Una propuesta',contenido:lines}]}),p=v.pages[1];assert.equal(v.visualSummary.diagrams,1);assert.ok(p.elements.some(x=>x.shape==='downArrow'));for(const line of lines)assert.ok(p.elements.some(x=>x.text===line));});
test('guide export can use the topic illustration and preview reports interior images separately',()=>{const O=office(),v=O.preview({tipoMaterial:'GUIA',titulo:'Globalización',introduccionLectura:'Los productos circulan entre países y conectan decisiones económicas.',preguntasAlternativas:[],preguntasDesarrollo:[],casosEstudio:[],diapositivas:[],listaCotejoTP:[]});assert.equal(v.visualSummary.interiorImages,1);const neutral=O.preview({tipoMaterial:'PRESENTACION',titulo:'Geometría',diapositivas:[{titulo:'Contenido',contenido:['Describe una figura.']}]});assert.equal(neutral.visualSummary.interiorImages,0);assert.equal(neutral.visualSummary.diagrams,0);assert.equal(neutral.visualSummary.charts,0);assert.equal(neutral.visualSummary.composedPages,1);});
test('an interior can retain its illustration together with an explicit diagram',()=>{const v=office().preview({tipoMaterial:'PRESENTACION',titulo:'Globalización · situación simulada',diapositivas:[{titulo:'Inicio',contenido:['Observa una situación ficticia.']},{titulo:'Una cadena de efectos · ejemplo simulado',contenido:['Causa: Se retrasa la entrega de productos.','Consecuencia: El taller debe reorganizar el trabajo.']}]});assert.equal(v.visualSummary.interiorImages,1);assert.equal(v.visualSummary.diagrams,1);const p=v.pages[2];assert.ok(p.elements.some(x=>x.kind==='image'));assert.ok(p.elements.some(x=>x.shape==='downArrow'));assert.ok(p.elements.every(x=>x.x>=0&&x.y>=0&&x.x+x.w<=13.34&&x.y+x.h<=7.51));});

test('guide image is not silently discarded when the reading also becomes a chart',()=>{const m={tipoMaterial:'GUIA',titulo:'Datos',introduccionLectura:'Grupo A: 8 personas\nGrupo B: 12 personas',imagenGuiaHEVA:sample,preguntasAlternativas:[],preguntasDesarrollo:[],casosEstudio:[],diapositivas:[],listaCotejoTP:[]},v=office().preview(m);assert.equal(v.visualSummary.interiorImages,1);assert.equal(v.visualSummary.charts,1);});

test('visual choices default on, validate booleans and preserve explicit opt-outs',()=>{assert.deepEqual(D.options({}),{imagenes:true,diagramas:true,graficos:true,recuadros:true});assert.equal(D.options({planGeneracion:{recursosVisualesHEVA:{imagenes:false}}}).imagenes,false);assert.ok(D.validateOptions({graficos:false}));for(const bad of [[],null,{imagenes:'false'},{otro:true}])assert.equal(D.validateOptions(bad),false);});
test('plain presentation keeps source data but suppresses photos charts diagrams and frames',()=>{const prefs={imagenes:false,diagramas:false,graficos:false,recuadros:false},m={tipoMaterial:'PRESENTACION',titulo:'Globalización',recursosVisualesHEVA:prefs,diapositivas:[{titulo:'Datos',contenido:['Grupo A: 8 personas','Grupo B: 12 personas']},{titulo:'Relación',contenido:['Causa: Se retrasa la entrega de productos.','Consecuencia: Se reorganiza el trabajo.']}]},v=office().preview(m),elements=v.pages.flatMap(p=>p.elements);assert.equal(elements.filter(x=>x.kind==='image').length,0);assert.equal(v.visualSummary.charts,0);assert.equal(v.visualSummary.diagrams,0);assert.equal(elements.filter(x=>x.shape==='roundRect').length,0);const text=elements.map(x=>x.text||'').join(' ');for(const s of m.diapositivas.flatMap(x=>x.contenido))assert.ok(text.includes(s));});
test('review keeps local visual preferences without sending them to the AI',()=>{const m={objetivoAprendizaje:'OA literal',recursosVisualesHEVA:{imagenes:false,graficos:false}};assert.ok(!D.forAI(m).recursosVisualesHEVA);assert.equal(D.restoreImages(m,{objetivoAprendizaje:'OA literal'}).recursosVisualesHEVA.imagenes,false);});


test('EPJA subjects attach contextual images only to matching explanatory slides',()=>{
 const cases=[['Guerra Fría','Cronología del conflicto','linea_tiempo'],['Ocupación de la Araucanía','Mapa del territorio','territorio'],['Ecuaciones lineales','Despeje de la incógnita','ecuaciones'],['Comprensión lectora','Idea principal del texto','lenguaje'],['English vocabulary','Conversation practice','ingles'],['Ciencias naturales: ecosistema','Ciclo de energía','ciencias'],['Seguridad laboral en soldadura','Equipos de protección','seguridad']];
 for(const [titulo,slide,key] of cases){
  const m={tipoMaterial:'PRESENTACION',titulo},sections=[section('Objetivo','Aprender'),section(slide,'Explicación del tema')];
  const matched=D.decorate(m,sections,{[key]:sample});
  assert.ok(matched[1].image,'Missing '+key);
  assert.ok(!matched[0].image);
  assert.ok(!D.decorate({...m,recursosVisualesHEVA:{imagenes:false}},sections,{[key]:sample}).some(x=>x.image));
 }
});


test('guided examples and comparisons can use a matching contextual image',()=>{
 const m={tipoMaterial:'PRESENTACION',titulo:'Globalización'},sections=[section('Objetivo','Comprender'),section('Comparación del intercambio','Producto y proveedor','explicación'),section('Ejemplo de comercio','Intercambio de productos','modelamiento')];
 const a=D.decorate(m,sections,{intercambio:sample});assert.ok(a[1].image);assert.ok(!a[2].image,'Do not repeat the same illustration');
 const b=D.decorate(m,[sections[0],sections[2]],{intercambio:sample});assert.ok(b[1].image);
});


test('Lenguaje obtiene un organizador visual local cuando no hay imagen de catálogo',()=>{
 const old=global.document;
 const ctx={fillRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},moveTo(){},lineTo(){}};
 global.document={createElement:()=>({width:0,height:0,getContext:()=>ctx,toDataURL:()=>sample.data})};
 try{
  const material={tipoMaterial:'GUIA',asignatura:'Lenguaje y Comunicación',temaEspecifico:'Comprensión lectora de noticias',recursosVisualesHEVA:{imagenes:true,diagramas:true}};
  const slides=[section('Objetivo','Comprender textos','objetivo'),section('Lectura de noticias','Identificar idea principal y evidencias')];
  const result=D.decorate(material,slides,{});
  assert.equal(result[1].image?.generated,true);
  assert.match(result[1].image?.alt||'',/(TEXTO|AFIRMACIÓN|MENSAJE)/);
  assert.equal(D.decorate({...material,recursosVisualesHEVA:{imagenes:false,diagramas:true}},slides,{})[1].image,null);
 }finally{global.document=old;}
});


test('infografías temáticas se generan en todas las asignaturas con opción de desactivarlas',()=>{
 const old=global.document;const ctx={fillRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},moveTo(){},lineTo(){}};
 global.document={createElement:()=>({getContext:()=>ctx,toDataURL:()=>sample.data})};
 try{
  const cases=[['Matemática','Ecuaciones lineales','PLANTEAR'],['Ciencias Naturales','Ecosistemas','INTERACCIONES'],['Historia','Guerra Fría','ANTECEDENTES'],['Inglés','Vocabulary','SITUATION'],['Construcciones Metálicas','Soldadura y EPP','PREPARAR'],['Convivencia Social','Resolución de conflictos','PERSONAS'],['Lenguaje y Comunicación','Registros de habla','REGISTRO']];
  for(const [asignatura,temaEspecifico,label] of cases){
   const material={tipoMaterial:'PRESENTACION',asignatura,temaEspecifico,recursosVisualesHEVA:{imagenes:true,diagramas:true}};
   const sections=[section('Objetivo','Aprender','objetivo'),section('Explicación de conceptos','Conceptos y procedimientos fundamentales')];
   const result=D.decorate(material,sections,{});
   assert.match(result[1].image?.alt||'',new RegExp(label),asignatura);
   assert.equal(D.decorate({...material,recursosVisualesHEVA:{imagenes:false,diagramas:true}},sections,{})[1].image,null);
  }
 }finally{global.document=old;}
});

test('auditoría de exportación cuenta gráficos realmente renderizados, no solo imágenes asignadas',()=>{
 const presentation={tipoMaterial:'PRESENTACION',titulo:'Comparación de datos',asignatura:'Estudios Sociales',objetivoAprendizaje:'Analizar datos geográficos',diapositivas:Array.from({length:10},(_,i)=>({titulo:'Plazos '+(i+1),funcion:'explicación',contenido:['Proveedor cercano: 2 días','Proveedor distante: 12 días'],notasDocente:'Comparar ambas cifras'}))};
 const officeApi=office(),rendered=officeApi.preview(presentation),report=officeApi.auditExport(presentation);
 assert.ok(rendered.visualSummary.charts>=10);
 assert.ok(!report.issues.some(x=>x.code==='COBERTURA_VISUAL_BAJA'));
});

test('cronología usa fechas escritas por el docente sin inventar fechas nuevas',()=>{
 const m={tipoMaterial:'PRESENTACION',titulo:'Cronología',asignatura:'Estudios Sociales',recursosVisualesHEVA:{imagenes:false,diagramas:true},diapositivas:[{titulo:'Línea de tiempo del proceso',funcion:'explicación',contenido:['1914: Comienza la Primera Guerra Mundial.','1918: Termina la Primera Guerra Mundial.'],notasDocente:'Contextualizar las fechas'}]};
 const page=office().preview(m).pages[1];
 const texts=page.elements.filter(e=>e.kind==='text').map(e=>e.text);
 assert.ok(texts.includes('1914'));
 assert.ok(texts.includes('1918'));
 assert.ok(texts.includes('1914: Comienza la Primera Guerra Mundial.'));
 assert.equal(page.visualKind,'diagram');
});

test('comparaciones disciplinares se basan en dos afirmaciones concretas, no en etiquetas genéricas',()=>{
 const pairs=[['Causa: La falta de materias primas reduce la producción.','Consecuencia: El taller retrasa la entrega.'],['Problema: Dos trabajadores discrepan sobre el turno.','Solución: Acuerdan un horario en mediación.'],['Riesgo: Cortar metal sin protección ocular.','Prevención: Utilizar protección facial apropiada.']];
 for(const lines of pairs){const parsed=D.comparisonPairs(lines);assert.equal(parsed.length,2);assert.ok(parsed[0].text.length>12);}
 for(const lines of [['Causa: A','Causa: B'],['Problema: El mismo texto','Solución: El mismo texto'],['Título sin datos','Conclusión sin datos']])assert.equal(D.comparisonPairs(lines),null);
});
test('PPT usa los riesgos y prevenciones originales en dos paneles editables',()=>{
 const lines=['Riesgo: La proyección de partículas puede alcanzar los ojos.','Prevención: Utilizar protección ocular apropiada para cortar metal.'];
 const view=office().preview({tipoMaterial:'PRESENTACION',titulo:'Causa y consecuencia',recursosVisualesHEVA:{imagenes:false,diagramas:true,recuadros:true,graficos:false},diapositivas:[{titulo:'Relación entre causas y consecuencias',contenido:lines}]});
 const page=view.pages[1];
 assert.equal(page.visualKind,'diagram');
 assert.ok(page.elements.some(e=>e.kind==='text'&&e.text==='RIESGO'));
 assert.ok(page.elements.some(e=>e.kind==='text'&&e.text==='PREVENCIÓN'));
 for(const line of lines)assert.ok(page.elements.some(e=>e.kind==='text'&&e.text===line.split(': ')[1]));
});

test('cronología de seis hitos usa dos filas de tarjetas editables, fechas originales y tipografía legible',()=>{
 const lines=[
  '1810: Comienza el proceso de independencia.',
  '1818: Se proclama la independencia.',
  '1833: Se promulga una nueva Constitución.',
  '1861: Comienza la República Liberal.',
  '1879: Inicia la Guerra del Pacífico.',
  '1884: Chile y Bolivia acuerdan una tregua.'
 ];
 const pages=office().preview({tipoMaterial:'PRESENTACION',titulo:'Historia de Chile',recursosVisualesHEVA:{imagenes:false,diagramas:true,graficos:false,recuadros:true},diapositivas:[{titulo:'Cronología de hitos',funcion:'explicación',contenido:lines}]}).pages;
 const page=pages[1];assert.equal(page.visualKind,'diagram');
 const text=page.elements.filter(e=>e.kind==='text');
 for(const line of lines){const [year,...parts]=line.split(': ');assert.ok(text.some(e=>e.text===year));assert.ok(text.some(e=>e.text===parts.join(': ')),line);}
 const years=text.filter(e=>/^(1810|1818|1833|1861|1879|1884)$/.test(e.text));
 assert.equal(years.length,6);
 assert.ok(years.every(e=>e.fontSize>=20));
 assert.ok(page.elements.every(e=>e.x>=0&&e.y>=0&&e.x+e.w<=13.34&&e.y+e.h<=7.51));
});
test('una cronología sin fechas explícitas no inventa años',()=>{
 const lines=['Primera etapa: los trabajadores conocen el problema.','Segunda etapa: acuerdan posibles soluciones.','Tercera etapa: comprueban los resultados.','Cuarta etapa: registran el acuerdo.','Quinta etapa: evalúan el cumplimiento.'];
 const pages=office().preview({tipoMaterial:'PRESENTACION',titulo:'Trabajo en equipo',recursosVisualesHEVA:{imagenes:false},diapositivas:[{titulo:'Cronología del proceso',contenido:lines}]}).pages.slice(1);
 assert.ok(!pages.flatMap(page=>page.elements).some(e=>e.kind==='text'&&/^\d{3,4}$/.test(e.text||'')));
 const all=pages.flatMap(page=>page.elements.map(e=>String(e.text||''))).join(' ');
 for(const line of lines)assert.ok(all.includes(line));
});

test('New disciplines do not inherit unrelated social or scientific illustrations',()=>{
 assert.equal(D.diagramPlan({title:'Reconstruir un argumento'},'Filosofía','Premisas y conclusión').title,'Examinar un argumento');
 assert.equal(D.visualFamily('Educación Física y Salud'),'movimiento');
 assert.equal(D.visualFamily('Artes Visuales'),'artes');
 assert.equal(D.visualFamily('Educación Ciudadana'),'ciudadana');
});
