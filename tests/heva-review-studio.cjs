'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'heva-review-studio.js'),'utf8');
const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
function fixture(fails=false){
 const nodes=new Map();
 class Node {
  constructor(id=''){this.id=id;this.className='';this.hidden=false;this.disabled=false;this.textContent='';this.children=[];this.classList={add(){},remove(){}};if(id)nodes.set(id,this)}
  set innerHTML(value){const re=/id="([^"]+)"/g;let m;while((m=re.exec(value)))if(!nodes.has(m[1]))new Node(m[1])}
  appendChild(el){this.children.push(el);if(el.id)nodes.set(el.id,el);return el}
  append(...items){for(const item of items)this.appendChild(item)}
  insertBefore(el,before){this.appendChild(el);}
  replaceChildren(...items){this.children=items}
  insertAdjacentElement(_,el){this.appendChild(el)}
  addEventListener(){}
  setAttribute(){}
  querySelector(){return nodes.get('toolbar')}
 }
 for(const id of ['head','main','nav','toolbar','btn-generar','barra-calidad','heva-result-edit'])new Node(id);
 const document={head:nodes.get('head'),readyState:'complete',getElementById:id=>nodes.get(id)||null,createElement:()=>new Node(),querySelector:q=>q==='main'?nodes.get('main'):q.startsWith('nav')?nodes.get('nav'):null};
 const orig={titulo:'Guía EPJA',tipoMaterial:'GUIA',versionPedagogica:3,asignatura:'Estudios Sociales',nivel:'III NB',objetivoAprendizaje:'Analizar fuentes',autoriaIA:{proveedor:'groq'},introduccionLectura:'Texto original',preguntasAlternativas:[],preguntasDesarrollo:[],casosEstudio:[],planGeneracion:{tipoMaterial:'GUIA',asignatura:'Estudios Sociales',nivel:'III NB',objetivoAprendizaje:'Analizar fuentes'}};
 let active=orig;const calls=[];
 const window={cambiarHerramienta(){},HEVAReviewBridge:{getMaterial:()=>active,applyMaterial:m=>{active=m}},generarMaterialReal:async()=>{active={...orig,titulo:'Nuevo material'}}};
 const localStorage={values:new Map(),getItem(k){return this.values.get(k)||null},setItem(k,v){this.values.set(k,v)}};
 const fetch=async(path,opt)=>{const body=JSON.parse(opt.body);calls.push({path,action:body.accion});const failed=fails;
  const payload=failed?{error:'Segundo proveedor no disponible'}:body.accion==='corregir'?{exito:true,material:{...orig,introduccionLectura:'Texto corregido'}}:{exito:true,revision:{estado:'con_observaciones',proveedor:'gemini',hallazgos:calls.length===1?[{tipo:'error_comprobado',descripcion:'Contraste fallido'}]:[],criterios:[]}};
  return {ok:!failed,status:failed?503:200,json:async()=>payload};
 };
 vm.runInNewContext(code,{document,window,localStorage,fetch,AbortController,Blob,URL,setTimeout,console});
 return {window,orig,calls,getActive:()=>active};
}
test('HEVA Review conserva la fuente única y no reimplementa el catálogo curricular',()=>{
 assert.match(page,/heva-review-studio\.js\?v=/);
 assert.match(page,/window\.HEVAReviewBridge/);
 assert.doesNotMatch(code,/catalogo-publicado\.json|SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY/);
 assert.doesNotMatch(code,/fetch\(['"]\/api\/generate/);
});
test('ciclo revisar-corregir-verificar conserva el original y requiere aplicar explícitamente',async()=>{
 const f=fixture();
 await f.window.HEVAReviewStudio.reviewExisting();
 const j=f.window.HEVAReviewStudio.getJob();
 assert.deepEqual(f.calls.map(x=>x.action),['revisar','corregir','revisar']);
 assert.equal(j.phase,'verificado');
 assert.equal(j.original.introduccionLectura,'Texto original');
 assert.equal(j.corrected.introduccionLectura,'Texto corregido');
 assert.equal(f.getActive().introduccionLectura,'Texto original');
});
test('con fallo de proveedor se conserva el material sin inventar correcciones',async()=>{
 const f=fixture(true);
 await f.window.HEVAReviewStudio.reviewExisting();
 const j=f.window.HEVAReviewStudio.getJob();
 assert.equal(j.original.introduccionLectura,'Texto original');
 assert.equal(j.corrected,null);
 assert.match(j.incident,/pendiente/i);
});

test('no existe generación duplicada y se reutiliza la revisión de la misma versión',async()=>{
 const f=fixture();
 assert.equal(f.window.HEVAReviewStudio.generateReview,undefined);
 assert.deepEqual(f.calls,[]);
 await f.window.HEVAReviewStudio.reviewExisting();
 await f.window.HEVAReviewStudio.reviewExisting();
 assert.deepEqual(f.calls.map(x=>x.action),['revisar','corregir','revisar']);
});
