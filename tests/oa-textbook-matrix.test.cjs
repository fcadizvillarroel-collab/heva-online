'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('../lib/oa-textbook-matrix.cjs');
const Textbooks=require('../lib/textbook-reference-catalog.cjs');
const repo=path.join(__dirname,'..');
const plan={asignatura:'Estudios Sociales',nivel:'I Nivel Medio',marcoCurricular:'Bases Curriculares EPJA 2024',objetivoAprendizaje:'Analizar cambios de la Revolución Industrial en el trabajo',temaEspecifico:'Revolución Industrial y trabajo',usarTextosEscolares:true};
const digest='a'.repeat(64);
function catalogs(){return{enabled:true,items:[
 {title:'Texto chileno',url:'https://www.curriculumnacional.cl/textos_escolares',country:'CL',source:'Mineduc'},
 {title:'SEP México',url:'https://libros.conaliteg.gob.mx/secundaria_2024.html',country:'MX',source:'SEP'}
]};}
function sources(){return {documents:[
 {id:'TEXTO_REG_HIST1_MUESTRA',role:'contenido',title:'Muestra Historia primero medio',status:'consultada',modalidad:'regular',optInTextbook:true,publisher:'Mineduc',sha256:digest,checkedAt:'2026-11-22T11:00:00Z'},
 {id:'REG_HIST1',role:'contenido',title:'Programa regular Historia primero medio',status:'consultada',modalidad:'regular',sha256:digest},
 {id:'MX_BOOK',role:'contenido',title:'Libro hipotético sin lectura',status:'no_disponible',country:'MX',optInTextbook:true,modalidad:'regular',sha256:digest}
],fragments:[
 {id:'TEXTO_REG_HIST1_MUESTRA-P12-T',documentId:'TEXTO_REG_HIST1_MUESTRA',page:12,pageEnd:12,url:'https://aprendoenlinea.mineduc.gob.cl/historia.pdf#page=12',sha256:digest,text:'La Revolución Industrial produjo cambios en el trabajo y su organización económica durante el período.'},
 {id:'REG_HIST1-P2-T',documentId:'REG_HIST1',page:2,url:'https://aprendoenlinea.mineduc.gob.cl/programa.pdf#page=2',sha256:digest,text:'El trabajo de la Revolución Industrial puede estudiarse mediante fuentes históricas.'},
 {id:'MX_BOOK-P1-T',documentId:'MX_BOOK',page:1,url:'https://libros.conaliteg.gob.mx/libro.pdf#page=1',sha256:digest,text:'La Revolución Industrial transformó el trabajo'},
 {id:'TEXTO_REG_HIST1_MUESTRA-P98-F',documentId:'TEXTO_REG_HIST1_MUESTRA',page:98,url:'https://aprendoenlinea.mineduc.gob.cl/historia.pdf#page=98',sha256:'f'.repeat(64),text:'Revolución Industrial y trabajo sin huella coincidente'}
 ]};}
test('OA y marco chilenos permanecen prioritarios y con clave estable',()=>{
 const r=M.build(plan,catalogs(),sources());
 assert.equal(r.oaLiteral,plan.objetivoAprendizaje);
 assert.equal(r.marco,plan.marcoCurricular);
 assert.equal(r.oaKey,M.build(plan,catalogs(),sources()).oaKey);
 assert.equal(r.cobertura.CL.fragmentosLibro,1);
 assert.equal(r.cobertura.CL.fragmentosOtros,1);
 assert.equal(r.cobertura.MX.fragmentosLibro,0);
 assert.equal(r.cobertura.MX.catalogos,1);
 assert.equal(r.estado,'pagina_de_libro_localizada_pendiente_validacion_docente');
});
test('documento CL solo se identifica con número de página de PDF, huella y fragmento textual real',()=>{
 const r=M.build(plan,catalogs(),sources());
 const book=r.registros.find(x=>x.tipo==='fragmento_libro');
 assert.equal(book.paginaPDF,12);
 assert.equal(book.capitulo,null);
 assert.equal(book.paginaImpresa,null);
 assert.equal(book.huellaPDF,digest);
 assert.match(book.extractoVerificable,/Revolución Industrial/);
 assert.match(book.uso,/contrastar OA/);
 assert.equal(r.registros.filter(x=>x.tipo==='fragmento_libro').length,1);
});
test('un catálogo SEP nunca se presenta como libro leído ni se le inventa capítulo',()=>{
 const r=M.build(plan,catalogs(),sources());
 const mx=r.registros.filter(x=>x.pais==='MX');
 assert.equal(mx.length,1);
 assert.equal(mx[0].tipo,'catalogo');
 assert.equal(mx[0].paginaPDF,null);
 assert.equal(mx[0].capitulo,null);
 assert.doesNotMatch(M.instruction(r),/México.*página real/);
});
test('sin PDF consultado, queda solo bibliografía y prohibición de citar páginas',()=>{
 const r=M.build(plan,catalogs(),{documents:[],fragments:[]});
 assert.equal(r.estado,'solo_catalogos_pendientes_verificacion');
 assert.equal(r.cobertura.CL.fragmentosLibro+r.cobertura.MX.fragmentosLibro,0);
 assert.match(M.instruction(r),/No hay páginas de libros de texto comprobadas/);
});
test('si el docente desactiva los textos, no se añaden referencias',()=>{
 const r=M.build({...plan,usarTextosEscolares:false},catalogs(),sources());
 assert.equal(r.estado,'desactivado');
 assert.equal(r.registros.length,0);
 assert.equal(M.instruction(r),'');
});
test('matriz usa catálogos de países autorizados y no inventa contenido mexicano',()=>{
 const real=Textbooks.recommendations(plan);
 const result=M.build(plan,real,{documents:[],fragments:[]});
 assert.ok(result.registros.every(x=>x.tipo==='catalogo'));
 assert.ok(result.registros.every(x=>x.paginaPDF===null));
});
test('generación normal y por bloques incluyen la misma matriz documental',()=>{
 for(const f of ['api/generate.js','api/recover.js']){
  const txt=fs.readFileSync(path.join(repo,f),'utf8');
  assert.match(txt,/OATextbookMatrix\.build\(plan,librosRegulares,fuentesDocumentales\)/);
  assert.match(txt,/material\.matrizOATextos=matrizOA/);
  assert.match(txt,/OATextbookMatrix\.instruction\(matrizOA\)/);
 }
 const ui=fs.readFileSync(path.join(repo,'heva-teacher-ui.js'),'utf8');
 assert.match(ui,/Matriz OA EPJA/);
 assert.match(ui,/Capítulo y página impresa: pendientes/);
});
