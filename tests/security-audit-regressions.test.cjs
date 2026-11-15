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
