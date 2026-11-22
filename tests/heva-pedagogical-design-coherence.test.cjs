'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const unified=fs.readFileSync(path.join(__dirname,'../experimental/heva-unified-ui.js'),'utf8');
const workflow=fs.readFileSync(path.join(__dirname,'../heva-workflow-ui.js'),'utf8');
const layout=fs.readFileSync(path.join(__dirname,'../heva-layout-ui.js'),'utf8');
const index=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
test('estrategias complementarias activan el modo al seleccionarlas',()=>{
 assert.match(unified,/if\(control\?\.matches\?\.\('input\[data-strategy\]'\)\&\&control\.checked\&\&!enabled\.checked\)/);
 assert.match(unified,/enabled\.checked=true/);
 assert.match(unified,/enabled\.dispatchEvent\(new Event\('change'/);
});
test('desactivar estrategias combinadas limpia las marcas para no lanzar errores inconsistentes',()=>{
 assert.match(unified,/if\(enabled\.checked\)return/);
 assert.match(unified,/control\.checked=false/);
 assert.doesNotMatch(unified,/Marcaste estrategias complementarias, pero el módulo está desactivado/);
});
test('la recuperación de configuración anterior no introduce recursión infinita',()=>{
 assert.doesNotMatch(unified,/return window\.hevaExperimentalPlan\(\)/);
 assert.match(unified,/plan=original\(\)/);
});
test('el diseño pedagógico agrupa controles sin duplicar OA ni tema',()=>{
 assert.match(layout,/if\(depth\)\{advanced\.append\(depth\)/);
 assert.match(layout,/if\(design\)\{advanced\.append\(design\)/);
 assert.match(layout,/if\(access\)\{advanced\.append\(access\)/);
 assert.match(layout,/if\(lab\)\{advanced\.append\(lab\)/);
 assert.ok(layout.indexOf('if(depth)')<layout.indexOf('if(design)'));
 assert.ok(layout.indexOf('if(design)')<layout.indexOf('if(access)'));
 assert.ok(layout.indexOf('if(access)')<layout.indexOf('if(lab)'));
 assert.doesNotMatch(workflow,/id="design-oa"/);
 assert.match(workflow,/design-depth/);
 assert.match(workflow,/design-context/);
 assert.match(workflow,/design-modelado/);
 assert.match(workflow,/design-ausencias/);
 assert.match(workflow,/design-desafio/);
 assert.match(index,/heva-layout-ui\.js\?v=20261122-diseno-coherente/);
});
test('JS de los controles críticos tiene sintaxis válida',()=>{
 for(const js of [unified,layout,workflow])assert.doesNotThrow(()=>new vm.Script(js));
});
