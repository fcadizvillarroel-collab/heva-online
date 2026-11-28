'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('consulta curricular respeta Supabase aun cuando no devuelve OA coincidentes',()=>{
 const html=src('index.html');
 assert.match(html,/let lista=\[\],origen='Supabase',consultaSupabaseExitosa=false/);
 assert.match(html,/lista=data\.objetivos;\s*consultaSupabaseExitosa=true/);
 assert.match(html,/if\(!consultaSupabaseExitosa\)\{\s*try\{\s*const locales=await obtenerObjetivosLocales/);
 assert.ok(html.indexOf('consultaSupabaseExitosa=true')<html.indexOf('if(!consultaSupabaseExitosa)'));
 assert.match(html,/solicitud!==solicitudOA/,'Mantener protección contra respuestas obsoletas');
});
test('la cuota agotada no dispara recuperación por bloques inmediatamente',()=>{
 const html=src('index.html'),server=src('api/generate.js');
 assert.match(html,/data\?\.codigo!=='AI_RATE_LIMIT'/);
 assert.match(html,/data\?\.codigo!=='AI_UNAVAILABLE'/);
 assert.match(html,/respuesta\.status===413\|\|respuesta\.status===422/);
 assert.match(server,/if\(error\.code==='AI_RATE_LIMIT'\)\{const reintentarEn=/);
 assert.match(server,/res\.status\(429\)\.json\(/);
 assert.match(server,/res\.setHeader\('Retry-After'/);
 assert.ok(!server.includes("if(error.code==='AI_RATE_LIMIT')return res.status(503)"));
});
test('el respaldo offline no se importa automáticamente a Supabase',()=>{
 const html=src('index.html'),rules=src('AGENTS.md');
 assert.match(html,/fetch\('\/catalogo-publicado\.json'/);
 assert.match(html,/fetch\('\/api\/curriculum\/admin\?'/);
 assert.match(rules,/NO generar, importar, reconstruir/);
});

test('la interfaz HEVA que realmente utiliza el docente respeta respuestas Supabase vacías',()=>{
 const ui=src('heva-ui.js');
 assert.match(ui,/list=usable\(data\.objetivos\)/);
 assert.match(ui,/localStorage\.setItem\(key,JSON\.stringify\(list\)\)/,'También registrar listas verificadas vacías');
 assert.match(ui,/catch\(e\)\{source='catálogo local EPJA';list=await local\(\);\}/);
 assert.ok(!ui.includes("if(!list.length&&source==='Supabase')"),'No cambiar la fuente después de recibir un cero válido');
 const html=src('index.html');
 assert.match(html,/heva-ui\.js\?v=20261128-fase3/);
});
test('Word y PPT muestran auditoría existente de forma automática y sin bloquear exportaciones válidas',()=>{
 const ui=src('heva-ui.js');
 assert.match(ui,/async function hevaAuditBeforeExport\(format\)/);
 assert.match(ui,/await mostrarAuditoriaHEVA\(\)/);
 assert.match(ui,/syncEdits\(\);await hevaAuditBeforeExport\('Word'\);try\{await HEVAOffice\.word/);
 assert.match(ui,/syncEdits\(\);await hevaAuditBeforeExport\('PowerPoint'\);try\{await HEVAOffice\.powerpoint/);
 assert.match(ui,/validación docente pendiente/);
 assert.ok(!ui.includes('confirm(\'¿Desea exportar'), 'No insertar ventanas modales innecesarias');
});
