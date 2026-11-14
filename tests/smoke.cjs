'use strict';
/* HEVA regression checks: no external API calls, no secrets. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>{
 const rel=path.relative(root,path.join(dir,x.name));
 if(x.isDirectory())return ['node_modules','.git','.vercel'].includes(x.name)?[]:walk(path.join(dir,x.name));
 return x.isFile()&&/\.(js|cjs)$/.test(x.name)?[rel]:[];
});
let checked=0;
for(const file of walk(root)){const source=fs.readFileSync(path.join(root,file),'utf8');new vm.Script(source,{filename:file});checked++;}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const studio=fs.readFileSync(path.join(root,'heva-studio-ui.js'),'utf8');
assert(!studio.includes('Taller de materiales · editar, adaptar y comparar'),'Legacy duplicate panel must be removed');
assert(!studio.includes('id="studio-material-theme"'),'Visual template selector should not be duplicated');
assert(studio.includes('function mountHistoryCompare()'),'Version comparison should live with history');
assert(studio.includes('function backupDocuments()'),'Reference backups must remain available');
assert(!html.includes('Material de ejemplo opcional'),'The duplicate reference section must not return');
assert(!html.includes('id="modo-referencia"'),'Reference controls must have one owner');
for(const id of ['modo-referencia','texto-referencia','studio-reference-slot','studio-theme','studio-doc-list']){
 assert(studio.includes('id="'+id+'"'),'Missing reference control: '+id);
}
assert(html.includes('heva-studio-ui.js'),'Studio UI must be loaded');
assert(html.includes('heva-recovery-ui.js'),'Recovery must be loaded');
assert(html.includes('heva-ai-diagrams.js'),'Diagrams must be loaded');
const design=require('../heva-design.js');
const pedagogy=require('../heva-pedagogy.js');
const studioModule=require('../heva-studio.js');
assert.equal(typeof design.validate,'function');
assert.equal(typeof pedagogy.prompt,'function');
assert.equal(typeof studioModule.validateExtras,'function');
assert.deepEqual(studioModule.validateExtras({documentosBase:[],plantillaVisual:'calida'}),[]);
assert(studioModule.validateExtras({plantillaVisual:'invalid'}).length>0);
const core=require('../heva-core.js');
const choice=core.material({preguntasAlternativas:[{enunciado:'¿Cuál?',alternativas:{A:'Uno',B:'Dos',C:'Tres',D:'Cuatro'},respuestaCorrecta:'opción C'}]});
assert.deepEqual(choice.preguntasAlternativas[0].alternativas.map(a=>a.letra),['A','B','C','D']);
assert.equal(choice.preguntasAlternativas[0].claveCorrecta,'C');
assert(!core.validate(choice,{cantAlternativas:1}).some(x=>x.includes('clave inválidas')));
const aliases=core.material({preguntasAlternativas:[{enunciado:'¿Cuál?',opciones:['A) Uno','B) Dos','C) Tres','D) Cuatro'],correctAnswer:'Letra D'}]});
assert.deepEqual(aliases.preguntasAlternativas[0].alternativas.map(x=>x.texto),['Uno','Dos','Tres','Cuatro']);
assert.equal(aliases.preguntasAlternativas[0].claveCorrecta,'D');
assert(!core.validate(aliases,{cantAlternativas:1}).some(x=>x.includes('clave inválidas')));
const bad=core.material({preguntasAlternativas:[{enunciado:'¿Cuál?',alternativas:['Uno','Dos','Tres','Cuatro']}]});
assert(core.validate(bad,{cantAlternativas:1}).some(x=>x.includes('clave inválidas')),'Never guess a missing answer key');
const ordered=pedagogy.blocks({tipoMaterial:'GUIA',titulo:'Guía',objetivoAprendizaje:'Comprender',introduccionLectura:'Lectura',glosario:[{termino:'Concepto',definicion:'Definición'}],cierreReflexivo:'Reflexión',ticketSalida:{pregunta:'Salida'}},false);
const glossaryIndex=ordered.findIndex(x=>x.title.startsWith('Vocabulario'));
assert(glossaryIndex>ordered.findIndex(x=>x.title==='Ticket de salida'),'Vocabulary should follow the learning sequence');
const teacherOrdered=pedagogy.blocks({tipoMaterial:'GUIA',titulo:'Guía',objetivoAprendizaje:'Comprender',glosario:[{termino:'Concepto',definicion:'Definición'}]},true);
assert(teacherOrdered.findIndex(x=>x.title.startsWith('Vocabulario'))<teacherOrdered.findIndex(x=>x.title.startsWith('PAUTA DOCENTE')),'Vocabulary should precede teacher-only key');
const recovery=require('../lib/recovery.cjs');
const p={asignatura:'Estudios Sociales',nivel:'III NIVEL BÁSICO',marcoCurricular:'Decreto Supremo N° 257/2009 EPJA',objetivoAprendizaje:'Explicar procesos históricos',temaEspecifico:'Guerra Fría',tipoMaterial:'GUIA',estrategiaDidactica:'Análisis de contenido disciplinar formativo',modoReferencia:'NINGUNA',cantAlternativas:4,cantDesarrollo:2,cantCasos:1};
assert.equal(recovery.planOf(p).objetivoAprendizaje,p.objetivoAprendizaje);
assert(recovery.batches(p).length>0);
assert.throws(()=>recovery.planOf({...p,objetivoAprendizaje:''}));
assert.throws(()=>recovery.planOf({...p,documentosBase:Array.from({length:5},(_,i)=>({id:String(i),titulo:'Fuente',texto:'Contenido'}))}));
assert.throws(()=>recovery.planOf({...p,disenoPedagogico:{objetivoAprendizaje:'Otro OA'}}));
// Matriz: 6 estrategias × 6 materiales × perfiles de asignaturas EPJA.
const didactics=require('../heva-didactics.js');
const subjects=['Lenguaje y Comunicación','Matemática','Estudios Sociales','Ciencias Naturales','Inglés','Convivencia Social','Inserción Laboral','Construcciones Metálicas','Tecnología','Educación Financiera','Emprendimiento','Formación en Oficios'];
const materials=['GUIA','EVALUACION','PRESENTACION','PLANIFICACION','TALLER','ACCESIBLE'];
for(const subject of subjects)for(const material of materials)for(const strategy of pedagogy.strategies){
 const plan={...p,asignatura:subject,tipoMaterial:material,estrategiaDidactica:strategy.id};
 const instructions=design.strategyExecution(plan);
 assert(instructions.includes(strategy.name),'Strategy absent from instructions: '+strategy.id);
 assert(instructions.includes(didactics.profile(subject).name),'Subject absent from strategy instructions: '+subject);
 assert(design.prompt(plan).includes('EJECUCIÓN OBLIGATORIA'),'Strategy must be included in the AI prompt');
}
const caseBatch={tipo:'casos',inicio:0,cantidad:1,field:'casosEstudio'};
const normalizedCase=recovery.normalizePart({casos:[{titulo:'Decisión laboral',contexto:'Dos opciones de empleo',pregunta:'¿Cuál elegirías y por qué?',habilidad:'Comparar',criterio:'Justifica con datos'}],trazabilidadEstrategia:[{referencia:'CASO-1',habilidad:'Comparar',evidencia:'Decisión',criterio:'Justificación'}]},caseBatch);
assert.equal(normalizedCase.casosEstudio.length,1);
assert.equal(normalizedCase.casosEstudio[0].contextoReal,'Dos opciones de empleo');
assert.equal(recovery.partIssues(normalizedCase,{...p,cantCasos:1,cantAlternativas:0,cantDesarrollo:0,estrategiaDidactica:'CASOS'},caseBatch).length,0);
const providerSource=fs.readFileSync(path.join(root,'api/_providers.cjs'),'utf8');
const recoverySource=fs.readFileSync(path.join(root,'api/recover.js'),'utf8');
assert(!providerSource.includes("e?.code?.startsWith("),'Provider must guard non-string error codes');
assert(!recoverySource.includes("e.code?.startsWith("),'Recovery must guard non-string error codes');
const review=require('../heva-quality.cjs');
assert.equal(typeof review.readReview,'function');
assert.equal(typeof review.fingerprint,'function');
for(const endpoint of ['api/generate.js','api/recover.js','api/review.js','api/diagram.js']){
 const code=fs.readFileSync(path.join(root,endpoint),'utf8');
 assert(code.includes('require('),'Endpoint missing dependencies: '+endpoint);
}

console.log('HEVA smoke checks passed; '+checked+' JavaScript files parsed.');
