const test=require('node:test'),assert=require('node:assert/strict'),S=require('../heva-studio.js'),T=require('../heva-templates.js');
function sample(){return{materialId:'original',version:2,titulo:'Porcentajes',objetivoAprendizaje:'OA literal',tipoMaterial:'EVALUACION',asignatura:'Matemática',introduccionLectura:'Información neutral',preguntasAlternativas:[{numero:1,enunciado:'Uno',claveCorrecta:'A'},{numero:2,enunciado:'Dos',claveCorrecta:'B'}],trazabilidadEstrategia:[{referencia:'ALT-1',habilidad:'calcular',evidencia:'resultado',criterio:'correcto'}],revisionIA:{estado:'revisado'},respaldoDocumental:[{seccion:'ALT-1'},{seccion:'ALT-2'}],planGeneracion:{cantAlternativas:2,cantDesarrollo:0,cantCasos:0,adecuacionesPIE:[]}}}
test('Editar una sección no modifica OA, otras preguntas ni original; invalida revisión y cita afectada',()=>{const m=sample(),copy=structuredClone(m),n=S.patch(m,'ALT-1',{contenido:{numero:99,enunciado:'Mejorado',claveCorrecta:'D'},trazabilidad:{habilidad:'calcular',evidencia:'valor',criterio:'exacto'}});assert.deepEqual(m,copy);assert.equal(n.objetivoAprendizaje,m.objetivoAprendizaje);assert.deepEqual(n.preguntasAlternativas[1],m.preguntasAlternativas[1]);assert.equal(n.preguntasAlternativas[0].numero,1);assert.equal(n.revisionIA,undefined);assert.deepEqual(n.historialRevisionIA,[m.revisionIA]);assert.deepEqual(n.respaldoDocumental,[{seccion:'ALT-2'}]);assert.deepEqual(S.changes(m,n),['ALT-1'])});
test('Secciones cerradas y trazabilidad obligatoria',()=>{assert.throws(()=>S.patch(sample(),'__proto__',{contenido:{}}));assert.throws(()=>S.patch(sample(),'ALT-1',{contenido:{}}));assert.throws(()=>S.patch(sample(),'lectura',{contenido:{}}))});
test('Adaptación de prueba conserva tipo, OA y cantidades; relación con versión exacta',()=>{const m=sample(),p=S.adaptationPlan(m,'ACCESIBLE');assert.equal(p.tipoMaterial,'EVALUACION');assert.equal(p.objetivoAprendizaje,m.objetivoAprendizaje);assert.equal(p.cantAlternativas,2);assert.equal(p.derivacion.origenVersion,2);assert.equal(p.derivacion.origenId,'original');assert.equal(p.disenoPedagogico,null);const n=S.link({titulo:'Nueva prueba'},p);assert.equal(n.familiaMaterialId,'original');assert.equal(T.layout(n).wordSize,32)});
test('Referencias docentes explícitas, acotadas y nunca declaradas oficiales',()=>{const p={documentosBase:[{id:'x',titulo:'Mi texto',texto:'Un texto de ejemplo. '.repeat(500)}]};assert.deepEqual(S.validateExtras(p),[]);const prompt=S.documentsPrompt(p,500);assert.match(prompt,/docente_no_verificado/);assert.match(prompt,/Selección parcial/);assert.ok(prompt.length<1600);assert.ok(S.validateExtras({documentosBase:Array(5).fill(p.documentosBase[0])}).length);assert.ok(S.validateExtras({documentosBase:[{...p.documentosBase[0],texto:'a'.repeat(20001)}]}).length)});
test('Plantillas y tamaños accesibles válidos sin recursos externos',()=>{for(const id of Object.keys(T.themes)){const x=T.layout({plantillaVisual:id});assert.match(x.theme.main,/^[A-F0-9]{6}$/);assert.equal(x.wordSize,26)}assert.equal(T.layout({tipoMaterial:'ACCESIBLE'}).slideSize,26)});

test('abreviar no puede borrar la pregunta y dejar solo datos',()=>{const m=sample();m.preguntasAlternativas[0].enunciado='Un producto cuesta 100. ¿Cuál es el descuento?';assert.throws(()=>S.patch(m,'ALT-1',{contenido:{enunciado:'Un producto cuesta 100.',claveCorrecta:'A'}}),/eliminó la pregunta/)});
test('exportadores propagan plantilla y tamaño accesible a sus bibliotecas',async()=>{const vm=require('node:vm'),fs=require('node:fs');let wordOptions,slides=[];class Paragraph{constructor(x){this.x=x}}class TextRun{constructor(x){this.x=x}}class Doc{constructor(x){wordOptions=x}}class Deck{constructor(){this.ShapeType={rect:'rect',line:'line',roundRect:'roundRect'}}addSlide(){const s={texts:[],addShape(){},addText(text,options){this.texts.push({text,options})}};slides.push(s);return s}async writeFile(){}}const ctx={HEVATemplates:T,HEVA:{material:x=>x,blocks:()=>[{title:'Prueba',text:'Contenido de comprobación'}]},docx:{Document:Doc,Paragraph,TextRun,HeadingLevel:{TITLE:1,HEADING_1:2},Packer:{toBlob:async()=>new Blob(['doc'])}},PptxGenJS:Deck,Blob,setTimeout:()=>{},URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},document:{createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../heva-office.js'),'utf8'),ctx);const m={titulo:'Prueba',tipoMaterial:'ACCESIBLE',plantillaVisual:'contraste'};await ctx.HEVAOffice.word(m);await ctx.HEVAOffice.powerpoint(m);assert.equal(wordOptions.sections[0].children[2].x.children[0].x.size,32);assert.equal(slides[0].background.color,'FFFFFF');assert.ok(slides.slice(1).some(s=>s.texts.some(t=>t.text==='Contenido de comprobación'&&t.options.fontSize>=26)))});

test('la edición individual de pareados y comprensión conserva identificadores, claves y puntaje docente',()=>{
 const m=sample();
 m.terminosPareados={terminos:[{id:'1',texto:'Oferta',puntajeDocente:2}],opciones:[{id:'A',texto:'Opciones disponibles'}],clave:[{terminoId:'1',opcionId:'A'}]};
 m.comprensionLectora={texto:'Texto completo.',preguntas:[{numero:1,enunciado:'Describe la situación.',puntajeDocente:1}]};
 const paired=S.patch(m,'PAR-1',{contenido:{id:'9',texto:'Oferta de trabajo'}});
 const reading=S.patch(m,'LECT-1',{contenido:{numero:4,enunciado:'Compara las condiciones.',puntajeDocente:3}});
 assert.deepEqual(paired.terminosPareados.terminos,[{id:'1',texto:'Oferta de trabajo',puntajeDocente:2}]);
 assert.deepEqual(paired.terminosPareados.clave,m.terminosPareados.clave);
 assert.deepEqual(reading.comprensionLectora.preguntas,[{numero:1,enunciado:'Compara las condiciones.',puntajeDocente:1}]);
 assert.deepEqual(S.changes(m,paired),['PAR-1']);
 assert.deepEqual(S.changes(m,reading),['LECT-1']);
});

test('la mejora integral mantiene ponderaciones personalizadas y rechaza cambios en los recuentos anidados',()=>{
 const m=sample();
 for(const q of m.preguntasAlternativas)q.alternativas=['A','B','C','D'].map(letra=>({letra,texto:letra}));
 m.terminosPareados={terminos:[{id:'1',texto:'Oferta',puntajeDocente:2}],opciones:[{id:'A',texto:'Propuesta'}],clave:[{terminoId:'1',opcionId:'A',justificacion:'Es una propuesta.'}]};
 m.comprensionLectora={texto:'Texto completo.',preguntas:[{numero:1,enunciado:'Describe la situación.'}]};
 const proposal=S.improvementData(m);
 proposal.terminosPareados.terminos[0]={id:'99',texto:'Oferta de trabajo'};
 proposal.terminosPareados.opciones[0].id='B';
 proposal.terminosPareados.clave[0].terminoId='99';
 proposal.comprensionLectora.preguntas[0]={numero:2,enunciado:'Compara las condiciones.',puntajeDocente:1};
 const next=S.improve(m,{contenido:proposal},'EVALUACION');
 assert.deepEqual(next.terminosPareados.terminos,[{id:'1',texto:'Oferta de trabajo',puntajeDocente:2}]);
 assert.deepEqual(next.terminosPareados.opciones,m.terminosPareados.opciones);
 assert.deepEqual(next.terminosPareados.clave,m.terminosPareados.clave);
 assert.deepEqual(next.comprensionLectora.preguntas,[{numero:1,enunciado:'Compara las condiciones.'}]);
 assert.throws(()=>S.improve(m,{contenido:{comprensionLectora:{...m.comprensionLectora,preguntas:[]}}},'EVALUACION'),/cantidad/);
});

test('Recuperación pide una actividad autónoma que evidencie el desempeño del OA',()=>{
 const m=sample();
 const p=S.adaptationPlan(m,'RECUPERACION');
 assert.equal(p.objetivoAprendizaje,m.objetivoAprendizaje);
 assert.equal(p.derivacion.origenId,m.materialId);
 assert.match(p.instruccionesDocente,/textos o datos completos/);
 assert.match(p.instruccionesDocente,/criterio de autoevaluación observable/);
 assert.match(p.instruccionesDocente,/producto esperado deben practicar y mostrar ese desempeño/);
});

test('Recuperación de lectura en voz alta modela el desempeño sin copiar ejercicios del original',()=>{
 const m={...sample(),tipoMaterial:'GUIA',objetivoAprendizaje:'Leer en voz alta textos variados.',estrategiaDidactica:'Análisis de fuentes y evidencias'};
 const p=S.adaptationPlan(m,'RECUPERACION');
 assert.equal(p.estrategiaDidactica,'Ejemplo guiado y aplicación progresiva');
 assert.equal(p.modoReferencia,'NINGUNA');
 assert.equal(p.textoReferencia,'');
 assert.equal(p.derivacion.origenId,m.materialId);
 assert.match(p.instruccionesDocente,/practicar y releer en voz alta/);
});
