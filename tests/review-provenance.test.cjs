const test=require('node:test'),assert=require('node:assert/strict'),P=require('../lib/review-provenance.cjs');
test('single author can be reviewed by the other free provider',()=>assert.deepEqual(P.independent({autoriaIA:{proveedor:'gemini'}},['','g','q']),['groq']));
test('mixed authorship cannot be represented as independently reviewed by either contributor',()=>{const m={autoriaIA:{proveedor:'gemini'},edicionesIA:[{proveedor:'groq'},{proveedor:'gemini'}]};assert.deepEqual(P.contributors(m),['gemini','groq']);assert.deepEqual(P.independent(m,['','g','q']),[]);});
test('no paid service is enabled by provenance logic',()=>assert.deepEqual(P.independent({autoriaIA:{proveedor:'groq'}},['','','q']),[]));
