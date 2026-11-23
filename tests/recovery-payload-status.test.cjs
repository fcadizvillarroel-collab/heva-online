const test=require('node:test'),assert=require('node:assert/strict');
const recover=require('../api/recover.js');
test('recuperación rechaza cargas >250k con código explícito sin consumir IA',async()=>{
 const calls=[];const res={setHeader(){},status(code){calls.push(code);return this;},json(data){this.body=data;return this;},end(){return this;}};
 await recover({method:'POST',body:{plan:{documentosBase:[{texto:'X'.repeat(250100)}]}}},res);
 assert.equal(calls.at(-1),413);
 assert.equal(res.body.codigo,'RECOVERY_PAYLOAD_TOO_LARGE');
 assert.equal(res.body.reintentable,false);
 assert.match(res.body.detalle,/bloques guardados/i);
});
test('rechazo 413 del proveedor no se confunde con indisponibilidad 503',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'../api/recover.js'),'utf8');
 assert.match(source,/res\.status\(limited\?429:tooLarge\?413:/);
});
