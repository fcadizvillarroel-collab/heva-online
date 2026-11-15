const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('base recovery preserves non-question strategy references',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../lib/recovery.cjs'),'utf8');
 assert.match(source,/trazabilidadEstrategia:\(Array\.isArray\(m\.trazabilidadEstrategia\)/);
 assert.ok(source.includes(String.raw`! /^(ALT|DES|CASO)-\\d+$/.test`.replace('! /','!/').replace('\\\\d','\\d')));
});
test('curriculum admin rejects invalid IDs and checks PATCH outcomes',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../api/curriculum/admin.js'),'utf8');
 assert.match(source,/validId\(stagingId\)/);
 assert.match(source,/response\.ok/);
 assert.match(source,/data\.length!==1/);
});
test('Groq fallback stops when remaining deadline is insufficient',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../api/_providers.cjs'),'utf8');
 assert.match(source,/for \(const mod of modelosGroq\) \{\s*if\(deadline-Date\.now\(\)<=1500\)break/);
});

test('atomic curriculum approval is gated and SQL is restricted',()=>{
 const api=fs.readFileSync(path.join(__dirname,'../api/curriculum/admin.js'),'utf8');
 const sql=fs.readFileSync(path.join(__dirname,'../docs/HEVA_APROBACION_ATOMICA_PENDIENTE.sql'),'utf8');
 assert.match(api,/HEVA_CURRICULUM_ATOMIC_RPC==='true'/);
 assert.match(api,/\/rest\/v1\/rpc\/heva_aprobar_objetivo/);
 assert.match(sql,/FOR UPDATE/);
 assert.match(sql,/REVOKE ALL ON FUNCTION[\s\S]+FROM PUBLIC, anon, authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION[\s\S]+TO service_role/);
});
test('database hardening proposal removes permissive policies and table grants',()=>{
 const sql=fs.readFileSync(path.join(__dirname,'../docs/HEVA_SEGURIDAD_SQL_PENDIENTE.sql'),'utf8');
 assert.match(sql,/DROP POLICY IF EXISTS "Acceso publicado autenticado"/);
 assert.match(sql,/ALTER TABLE public.curriculo_publicado ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/REVOKE ALL PRIVILEGES ON TABLE public.heva_perfiles FROM anon, authenticated/);
});

test('all five AI endpoints require the shared access guard',()=>{
 for(const file of ['generate','review','recover','studio','diagram']){
  const source=fs.readFileSync(path.join(__dirname,'../api/'+file+'.js'),'utf8');
  assert.match(source,/require\('\.\/_ai-access\.cjs'\)\.protect\(req,res\)/,file);
 }
});
test('quota guard fails closed when enabled and quotas are unavailable',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../api/_ai-access.cjs'),'utf8');
 const sql=fs.readFileSync(path.join(__dirname,'../docs/HEVA_CUOTA_IA_PENDIENTE.sql'),'utf8');
 assert.match(source,/HEVA_AI_REQUIRE_AUTH/);
 assert.match(source,/rest\/v1\/rpc\/heva_consumir_cuota_ia/);
 assert.match(source,/status\(503\)/);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/REVOKE ALL ON FUNCTION[\s\S]+FROM PUBLIC,anon,authenticated/);
});

test('pilot remains login-free and supports an optional shared request ceiling',()=>{
 const guard=fs.readFileSync(path.join(__dirname,'../api/_ai-access.cjs'),'utf8');
 const sql=fs.readFileSync(path.join(__dirname,'../docs/HEVA_PILOTO_SIN_LOGIN_CUOTA_PENDIENTE.sql'),'utf8');
 assert.match(guard,/HEVA_AI_REQUIRE_AUTH/);
 assert.match(guard,/HEVA_PILOT_SHARED_QUOTA/);
 assert.match(guard,/HEVA_PILOT_DAILY_REQUESTS/);
 assert.match(guard,/rpc\/heva_consumir_cuota_piloto/);
 assert.match(sql,/ON CONFLICT\(fecha\) DO UPDATE/);
 assert.match(sql,/ALTER TABLE public.heva_piloto_consumo ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public.heva_consumir_cuota_piloto\(integer\) TO service_role/);
});

test('PowerPoint mode does not inherit assessment multiple-choice counts',()=>{
 const api=fs.readFileSync(path.join(__dirname,'../api/generate.js'),'utf8');
 const ui=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 assert.match(api,/const cantidadesEfectivas=tipoMaterial==='PRESENTACION'/);
 assert.match(api,/HEVA\.validate\(m,cantidadesEfectivas\)/);
 assert.match(api,/\.\.\.cantidadesEfectivas,incluirTicketSalida/);
 assert.match(ui,/const esPresentacionHEVA=.*==='PRESENTACION'/);
 assert.match(ui,/\? \{cantAlternativas:0,cantDesarrollo:0,cantCasos:0\}/);
});

test('PowerPoint exporter uses native slides and a warm 16:9 layout',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../heva-office.js'),'utf8');
 assert.match(source,/ppt\.layout='LAYOUT_WIDE'/);
 assert.match(source,/material\.diapositivas\.map/);
 assert.match(source,/const pages=sections\.flatMap/);
 assert.match(source,/function addChrome/);
 assert.match(source,/function addContent/);
 assert.match(source,/fit:'shrink'/);
});

test('PowerPoint layouts vary by pedagogical purpose',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../heva-office.js'),'utf8');
 for(const name of ['activity','compare','timeline','cards','feature','editorial'])assert.ok(source.includes("'"+name+"'"),name);
 assert.match(source,/function classifySlide/);
 assert.match(source,/addContent\(ppt,theme,slide,page.title,page.lines,page.kind,i\)/);
});

test('strategy metadata can be repaired without inventing evidence',()=>{
 const pedagogy=require('../heva-pedagogy.js');
 const p={estrategiaDidactica:'Análisis de fuentes y evidencias'};
 const normalized=pedagogy.normalizeStrategyPlan({planEstrategia:{habilidad:'Interpretar fuentes históricas',aplicacion:'Analizar dos fuentes',evidencia:'Comparación argumentada',retroalimentacion:'Revisar evidencias y argumentos'}},p);
 assert.equal(normalized.planEstrategia.id,pedagogy.strategy(p.estrategiaDidactica).id);
 assert.equal(normalized.planEstrategia.habilidadCentral,'Interpretar fuentes históricas');
 assert.equal(normalized.planEstrategia.aplicacionConcreta,'Analizar dos fuentes');
 assert.equal(normalized.planEstrategia.evidenciaEsperada,'Comparación argumentada');
 assert.equal(normalized.planEstrategia.retroalimentacionDocente,'Revisar evidencias y argumentos');
 const missing=pedagogy.normalizeStrategyPlan({planEstrategia:{}},p);
 assert.equal(missing.planEstrategia.habilidadCentral,undefined);
});

test('PowerPoint assets use a versioned URL and prompts require complete classroom stimuli',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const api=fs.readFileSync(path.join(__dirname,'../api/generate.js'),'utf8');
 assert.match(ui,/heva-office\.js\?v=20261115-layouts2/);
 assert.match(ui,/heva-ui\.js\?v=20261115-layouts2/);
 assert.match(api,/AUTOSUFICIENCIA/);
 assert.match(api,/COHERENCIA DISCIPLINAR/);
});

test('recovery base repairs incomplete strategy metadata without discarding slides',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../api/recover.js'),'utf8');
 assert.match(source,/fase==='base'&&issues\.some/);
 assert.match(source,/STRATEGY_PLAN_INCOMPLETE/);
 assert.match(source,/planEstrategia:fixed\.value\.planEstrategia/);
 assert.match(source,/if\(next\.length<issues\.length\)/);
});

test('PowerPoint visual engine provides native semantic diagrams',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../heva-office.js'),'utf8');
 assert.match(source,/function drawSemanticVisual/);
 assert.match(source,/function visualKind/);
 assert.match(source,/kind==='equation'/);
 assert.match(source,/kind==='chronology'/);
 assert.match(source,/kind==='process'/);
 assert.match(source,/if\(drawSemanticVisual\(ppt,theme,slide,title,lines\)\)return/);
});

test('subject audit supports every discipline and retains pending verification',()=>{
 const audit=require('../experimental/subject-audit.cjs');
 for(const [subject,area] of [['Matemática','matematica'],['Lenguaje y Comunicación','lenguaje'],['Estudios Sociales','sociales'],['Ciencias Naturales','ciencias'],['Inglés','ingles'],['Construcciones Metálicas','tecnico'],['Convivencia Social','instrumental']]){
  const result=audit.inspectAll({asignatura:subject,objetivoAprendizaje:'OA de prueba',diapositivas:[{titulo:'Introducción',contenido:'Conceptos y ejemplos que se desarrollan mediante un problema contextualizado en el aula.'}]});
  assert.equal(result.disciplina,area);
  assert.equal(result.alcanceProfundo.validacion,'pendiente_revision_independiente_y_docente');
  assert.ok(result.criterios.length>=3);
 }
});
