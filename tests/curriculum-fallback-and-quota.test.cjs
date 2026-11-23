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
