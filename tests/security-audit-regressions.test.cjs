const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('base recovery preserves non-question strategy references',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../lib/recovery.cjs'),'utf8');
 assert.match(source,/trazabilidadEstrategia:\(Array\.isArray\(m\.trazabilidadEstrategia\)/);
 assert.match(source,/!\/\^\(ALT\|DES\|CASO\)-\\d\+\$\//);
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
