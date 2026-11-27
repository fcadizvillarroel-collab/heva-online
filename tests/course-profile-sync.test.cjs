const test=require('node:test');
const assert=require('node:assert/strict');
const endpoint=require('../api/course-profiles.js');
const {sameOrigin}=require('../api/_ai-access.cjs');

const host='heva.example.test';
function response(){
 return {headers:{},status(n){this.code=n;return this;},
  setHeader(k,v){this.headers[k]=v;},json(body){this.body=body;return this;}};
}
test('course profile sync rejects cross-origin writes and avoids caching',async()=>{
 const res=response();
 await endpoint({method:'POST',headers:{host,origin:'https://otro.example.test'},body:{action:'write'}},res);
 assert.equal(res.code,403);
 assert.equal(res.headers['Cache-Control'],'no-store');
});
test('logout clears the host-bound session cookie with browser protections',async()=>{
 const res=response();
 await endpoint({method:'POST',headers:{host,origin:'https://'+host},body:{action:'logout'}},res);
 assert.equal(res.code,200);
 assert.match(res.headers['Set-Cookie'],/^__Host-heva-teacher=; Path=\/; Max-Age=0; HttpOnly; Secure; SameSite=Strict$/);
 assert.equal(sameOrigin({headers:{host,origin:'http://'+host}}),false);
});
