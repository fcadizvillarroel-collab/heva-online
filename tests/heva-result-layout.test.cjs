'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),test=require('node:test');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ui=fs.readFileSync(path.join(root,'heva-result-layout.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
test('guía se muestra antes de herramientas secundarias',()=>{
 assert.match(ui,/article\.after\(edit\)/);
 assert.match(ui,/edit\.after\(review\)/);
 assert.match(ui,/toolbar\.parentElement!==edit/);
 assert.match(ui,/const sources=/);
 assert.match(ui,/heva-export-control/);
 assert.match(ui,/heva-strategy-delivery/);
});
test('conservar controles y eventos de edición y revisión existentes',()=>{
 assert.match(ui,/group\.append\(btn\)/);
 assert.doesNotMatch(ui,/cloneNode\(/);
 assert.match(ui,/MutationObserver\(schedule\)/);
 assert.match(ui,/review\.open=true/);
});
test('HTML no imprime secuencias de salto de línea como texto',()=>{
 assert.ok(!html.includes('</pre>\\n        <article'));
 assert.ok(!html.includes('calidad</button>\\n'));
});
test('estilos y caché incluyen el visor ordenado',()=>{
 assert.match(html,/id="heva-result-layout-css"/);
 assert.match(html,/heva-result-layout\.js\?v=/);
 assert.match(sw,/"\/heva-result-layout\.js"/);
});
test('archivo de interfaz tiene sintaxis válida',()=>{
 assert.doesNotThrow(()=>new (require('node:vm').Script)(ui));
});
