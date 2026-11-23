'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=path=>fs.readFileSync(require('node:path').join(root,path),'utf8');
test('Supabase mantiene los OA EPJA publicados como fuente curricular de verdad',()=>{
 const admin=read('api/curriculum/admin.js');
 assert.match(admin,/\/rest\/v1\/curriculo_publicado\?select=/);
 assert.match(admin,/vigente=eq\.true/);
 assert.match(admin,/action === 'verified'/);
 const guide=read('AGENTS.md');
 assert.match(guide,/fuente de verdad/);
 assert.match(guide,/NO generar, importar, reconstruir/);
 assert.match(guide,/catalogo-publicado\.json/);
});
test('la copia local conserva los 407 OA sin duplicar claves, pero no acredita revisión docente',()=>{
 const records=JSON.parse(read('catalogo-publicado.json'));
 assert.equal(records.length,407);
 assert.equal(new Set(records.map(x=>x.clave_interna)).size,407);
 assert.ok(records.every(x=>x.marco&&x.texto_literal));
 assert.match(read('README.md'),/Supabase.*fuente/);
});
