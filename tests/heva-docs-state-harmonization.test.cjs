'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=(p)=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('HEVA documental: el catálogo Supabase no se reabre ni se describe RLS antiguo',()=>{
 const security=read('SEGURIDAD_PENDIENTE.md');
 const readme=read('README.md');
 assert.match(security,/407 filas totales, 407 vigentes/);
 assert.match(security,/RLS activo/);
 assert.match(security,/TRUNCATE/);
 assert.match(readme,/407 OA vigentes/);
 assert.doesNotMatch(readme,/La inspección detectó RLS desactivado/);
 assert.doesNotMatch(security,/RLS desactivado y políticas/);
});

test('HEVA documental: la propuesta de seguridad no corta lectura de OA',()=>{
 const sql=read('docs/HEVA_SEGURIDAD_SQL_PENDIENTE.sql');
 assert.match(sql,/NO EJECUTADA/);
 assert.match(sql,/curriculo_publicado YA permite SELECT/);
 assert.doesNotMatch(sql,/^\s*REVOKE\s+ALL\s+PRIVILEGES\s+ON\s+TABLE\s+public\.curriculo_publicado/mi);
 assert.doesNotMatch(sql,/^\s*DROP\s+POLICY/mi);
});

test('HEVA documental: Review Studio tiene un solo responsable',()=>{
 const map=read('docs/HEVA_MAPA_CANONICO_SIN_DUPLICADOS_20261123.md');
 const agents=read('AGENTS.md');
 assert.match(map,/heva-review-studio\.js/);
 assert.match(map,/PR \*\*#70\*\*/);
 assert.match(map,/sustituida por PR #70/);
 assert.match(agents,/HEVA Review integrado/);
 assert.match(agents,/no fusionar/);
});
