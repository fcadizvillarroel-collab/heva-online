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
const recovery=require('../lib/recovery.cjs');
const p={asignatura:'Estudios Sociales',nivel:'III NIVEL BÁSICO',marcoCurricular:'Decreto Supremo N° 257/2009 EPJA',objetivoAprendizaje:'Explicar procesos históricos',temaEspecifico:'Guerra Fría',tipoMaterial:'GUIA',estrategiaDidactica:'Análisis de contenido disciplinar formativo',modoReferencia:'NINGUNA',cantAlternativas:4,cantDesarrollo:2,cantCasos:1};
assert.equal(recovery.planOf(p).objetivoAprendizaje,p.objetivoAprendizaje);
assert(recovery.batches(p).length>0);
assert.throws(()=>recovery.planOf({...p,objetivoAprendizaje:''}));
assert.throws(()=>recovery.planOf({...p,documentosBase:Array.from({length:5},(_,i)=>({id:String(i),titulo:'Fuente',texto:'Contenido'}))}));
assert.throws(()=>recovery.planOf({...p,disenoPedagogico:{objetivoAprendizaje:'Otro OA'}}));
const review=require('../heva-quality.cjs');
assert.equal(typeof review.readReview,'function');
assert.equal(typeof review.fingerprint,'function');
for(const endpoint of ['api/generate.js','api/recover.js','api/review.js','api/diagram.js']){
 const code=fs.readFileSync(path.join(root,endpoint),'utf8');
 assert(code.includes('require('),'Endpoint missing dependencies: '+endpoint);
}

console.log('HEVA smoke checks passed; '+checked+' JavaScript files parsed.');
