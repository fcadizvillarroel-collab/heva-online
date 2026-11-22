'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const unified=fs.readFileSync(path.join(__dirname,'../experimental/heva-unified-ui.js'),'utf8');
const begin=html.indexOf('window.hevaExperimentalPlan=function(){');
const end=html.indexOf(";\n$('asignatura').addEventListener",begin);
if(begin<0||end<0)throw Error('No se encontró la función del formulario');
const declaration=html.slice(begin,end+1);
function invoke({enabled=true,selected=[]}={}){
 const input={checked:enabled,events:[],dispatchEvent(e){this.events.push(e.type)}};
 const status={textContent:''};
 const ids={'lab-enabled':input,'lab-summary':status,
  'texto-oa':{value:'OA oficial literal'},'tema-especifico':{value:'Aplicación real'},
  'lab-mode':{value:'auto'}};
 const idsChosen=new Set(selected);
 const nodes=selected.map(id=>({dataset:{strategy:id},checked:true}));
 const context={
  $:id=>ids[id]||{value:'1'},
  choices:()=>selected.map(id=>({id,quantity:1})),
  counts:()=>({alternativas:2,desarrollo:0,lecturas:0}),
  document:{querySelectorAll:selector=>selector.includes('data-lab-slot')?[]:nodes},
  Event:class Event{constructor(type){this.type=type}},
  window:{HEVAIntegration:{plan:()=>({slots:[{id:'problemas-1',strategy:'problemas',alternativas:2,desarrollo:0,lecturas:0}]}),validate:()=>({ok:true})}}
 };
 vm.runInNewContext(declaration,context);
 return {result:context.window.hevaExperimentalPlan(),enabled:input.checked,status:status.textContent,events:input.events};
}
test('sin activar módulo se utiliza estrategia principal',()=>{
 const result=invoke({enabled:false});
 assert.equal(result.result,null);
 assert.equal(result.enabled,false);
});
test('activar módulo sin marcar complementarias no bloquea generación',()=>{
 const result=invoke({enabled:true,selected:[]});
 assert.equal(result.result,null);
 assert.equal(result.enabled,false);
 assert.match(result.status,/solo la estrategia principal/);
 assert.deepEqual(result.events,['change']);
});
test('selección real de estrategia complementaria conserva modo combinado',()=>{
 const result=invoke({enabled:true,selected:['problemas']});
 assert.ok(result.result);
 assert.equal(result.result.slots.length,1);
 assert.equal(result.enabled,true);
});
test('la interfaz desactiva automáticamente al desmarcar la última estrategia',()=>{
 assert.match(unified,/!control\.checked&&enabled\.checked&&!*document\.querySelector/);
 assert.match(unified,/Última estrategia desmarcada/);
 assert.doesNotMatch(html,/Activaste estrategias integradas, pero no seleccionaste ninguna/);
});
