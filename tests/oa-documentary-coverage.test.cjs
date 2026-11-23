'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Register=require('../lib/oa-documentary-register.cjs');
const Matrix=require('../lib/oa-textbook-matrix.cjs');
const official=require('../catalogo-publicado.json');
const root=path.join(__dirname,'..');
test('inventario contiene exactamente cada OA publicado sin duplicar códigos',()=>{
 const rows=Register.items();
 assert.equal(rows.length,407);
 assert.equal(new Set(rows.map(x=>x.oaCodigo)).size,407);
 assert.deepEqual(new Set(rows.map(x=>x.oaCodigo)),new Set(official.map(x=>x.codigo_oficial)));
 assert.ok(rows.every(x=>x.objetivoCatalogado));
});
test('distingue aprobación curricular de revisión de libros y sus páginas',()=>{
 const rows=Register.items(),sum=Register.summary(rows);
 assert.equal(sum.objetivosTotales,407);
 assert.equal(sum.objetivosCurricularesAprobados,407);
 assert.equal(sum.marcos['Decreto 257'],250);
 assert.equal(sum.marcos['Bases 2024'],157);
 assert.equal(sum.paginasLibroCotejadas,0);
 assert.equal(sum.aprobacionesPedagogicas,0);
 for(const entry of rows){
  assert.equal(entry.estadoLibro,'PENDIENTE_COTEJO_DOCUMENTAL');
  assert.equal(entry.fuenteChileCandidata.paginaPDF,null);
  assert.equal(entry.fuenteChileCandidata.capitulo,null);
  assert.ok(entry.fuenteChileCandidata.url.startsWith('https://'));
  if(entry.fuenteMexicoCandidata){
   assert.equal(entry.fuenteMexicoCandidata.paginaPDF,null);
   assert.equal(entry.fuenteMexicoCandidata.libroId,null);
   assert.equal(entry.fuenteMexicoCandidata.capitulo,null);
  }
  assert.deepEqual(entry.extractosVerificados,[]);
  assert.equal(entry.aprobacionPedagogica,'PENDIENTE');
 }
});
test('coincidencia literal identifica el OA por código sin confundir marcos o asignaturas',()=>{
 const target=official.find(x=>x.marco==='Bases 2024'&&x.asignatura==='Filosofía');
 assert.ok(target);
 const plan={marcoCurricular:'Bases Curriculares EPJA 2024',asignatura:target.asignatura,
  objetivoAprendizaje:target.texto_literal,nivel:target.nivel};
 assert.equal(Register.findByPlan(plan)?.oaCodigo,target.codigo_oficial);
 assert.equal(Register.findByPlan({...plan,marcoCurricular:'Decreto Supremo 257/2009'}),null);
 assert.equal(Register.findByPlan({...plan,asignatura:'Matemática'}),null);
 assert.equal(Register.findByPlan({...plan,objetivoAprendizaje:'Texto cambiado arbitrariamente'}),null);
});
test('matriz del generador conserva código EPJA si el texto es inequívoco; no inventa página de libro',()=>{
 const target=official.find(x=>x.marco==='Bases 2024'&&x.asignatura==='Filosofía');
 const plan={marcoCurricular:'Bases Curriculares EPJA 2024',asignatura:target.asignatura,
  objetivoAprendizaje:target.texto_literal,nivel:target.nivel,temaEspecifico:'Perspectivas filosóficas',usarTextosEscolares:true};
 const matrix=Matrix.build(plan,{enabled:true,items:[]},{documents:[],fragments:[]});
 assert.equal(matrix.oaCatalogo.codigo,target.codigo_oficial);
 assert.equal(matrix.oaCatalogo.estado,'catalogado_sin_validacion_de_libros');
 assert.equal(matrix.oaCatalogo.paginaCurricularDeclarada,target.pagina_oficial);
 assert.equal(matrix.registros.length,0);
 assert.match(Matrix.instruction(matrix),/NO hay páginas|No hay páginas/);
});
function call(query,method='GET'){
 return new Promise((resolve,reject)=>{
  const res={headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;return this},
   status(v){this.statusCode=v;return this},json(data){resolve({status:this.statusCode,data})}};
  Promise.resolve(require('../api/oa-documentary-coverage.js')({method,query},res)).catch(reject);
 });
}
test('API de cobertura devuelve paginación y filtros sin publicar supuestos capítulos',async()=>{
 const first=await call({pagina:'1',limite:'20'}),second=await call({pagina:'2',limite:'20'});
 assert.equal(first.status,200);assert.equal(first.data.resumen.objetivosTotales,407);
 assert.equal(first.data.registros.length,20);
 assert.equal(second.data.registros.length,20);
 assert.notEqual(first.data.registros[0].oaCodigo,second.data.registros[0].oaCodigo);
 const h=await call({grupo:'sociales',pagina:'1',limite:'10'});
 assert.ok(h.data.registros.every(r=>r.grupo==='sociales'));
 const absent=await call({codigo:'NO_EXISTE'});
 assert.equal(absent.status,404);
 const bad=await call({},'POST');
 assert.equal(bad.status,405);
});
test('el CSV exportable tiene 407 OA reales y todos los cotejos de libro pendientes',()=>{
 const csv=fs.readFileSync(path.join(root,'data/matriz-documental-407-oa.csv'),'utf8').replace(/^\uFEFF/,'');
 const lines=csv.trim().split(/\r?\n/);
 assert.equal(lines.length,408,'Una cabecera más exactamente 407 OA');
 assert.match(lines[0],/codigo_oficial/);
 assert.match(lines[0],/pagina_pdf_libro/);
 assert.match(lines[0],/estado_revision_pedagogica/);
 const pend=(csv.match(/PENDIENTE_COTEJO_DOCUMENTAL/g)||[]).length;
 assert.equal(pend,407,'Ningún libro debe certificarse sin cotejo');
 const sourceIds=new Set(official.map(x=>x.codigo_oficial));
 for(const id of sourceIds)assert.ok(csv.includes('"'+id.replace(/"/g,'""')+'"'));
 const ui=fs.readFileSync(path.join(root,'heva-documentary-ui.js'),'utf8');
 assert.match(ui,/\/data\/matriz-documental-407-oa\.csv/);
});
test('la revisión de staging permite revisar la cobertura sin alterar los OA ni generar material',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const ui=fs.readFileSync(path.join(root,'heva-documentary-ui.js'),'utf8');
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert.match(html,/heva-documentary-ui\.js/);
 assert.match(ui,/panel-staging/);
 assert.match(ui,/Los OA aprobados en el catálogo no equivalen a libros revisados/);
 assert.match(sw,/heva-documentary-ui\.js/);
 assert.doesNotThrow(()=>new (require('node:vm').Script)(ui));
});

test('OA aprobado no pierde alineación por fallo de extracción literal de PDF',()=>{
 const objectives=[
  official.find(x=>x.marco==='Decreto 257'&&x.asignatura==='Estudios Sociales'),
  official.find(x=>x.marco==='Bases 2024'&&x.asignatura==='Filosofía')
 ];
 assert.equal(objectives.length,2);
 for(const oa of objectives){
  assert.ok(oa,'El OA debe existir ya en catálogo');
  const plan={asignatura:oa.asignatura,marcoCurricular:oa.marco==='Decreto 257'?'Decreto Supremo 257/2009':'Bases Curriculares EPJA 2024',objetivoAprendizaje:oa.texto_literal};
  assert.equal(Register.findByPlan(plan)?.objetivoCatalogado,true);
  assert.equal(Register.requiresCurricularSourceReview(plan,'no_localizado_en_extraccion'),false);
  assert.equal(Register.requiresCurricularSourceReview(plan,'localizado_literalmente'),false);
  assert.equal(Register.requiresCurricularSourceReview({...plan,objetivoAprendizaje:'Texto no registrado en los OA publicados'},'no_localizado_en_extraccion'),true);
 }
 const reviewApi=fs.readFileSync(path.join(root,'api/review.js'),'utf8');
 assert.match(reviewApi,/CurricularRegistry\.requiresCurricularSourceReview\(material\.planGeneracion\|\|material,fuentesDocumentales\.objetivo\)/);
});
