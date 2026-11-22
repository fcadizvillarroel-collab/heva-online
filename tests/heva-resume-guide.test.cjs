'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../heva-recovery-ui.js'),'utf8');
function testUI(tipo='GUIA',withPending=true){
 const plan={tipoMaterial:tipo,cantAlternativas:6,cantDesarrollo:2,cantCasos:1,temaEspecifico:'Globalización'};
 const stored=new Map(),items={};
 if(withPending)stored.set('heva-recuperacion-v2',JSON.stringify({version:2,planKey:JSON.stringify(plan),parts:[]}));
 const createElement=tag=>({tag,children:[],hidden:false,className:'',style:{},textContent:'',disabled:false,onclick:null,append(...parts){this.children.push(...parts)},replaceChildren(...parts){this.children=parts},setAttribute(key,val){this[key]=val}});
 const host=createElement('section');host.prepend=node=>{host.children.unshift(node);items[node.id]=node};
 items['panel-crear']=host;
 const document={createElement,getElementById:id=>items[id]||null};
 const localStorage={getItem:key=>stored.get(key)||null,setItem:(key,val)=>stored.set(key,val),removeItem:key=>stored.delete(key)};
 vm.runInNewContext(code,{document,localStorage,console,AbortSignal:{timeout(){}},fetch:async()=>{throw Error('No fetch expected')}});
 return {host,items,stored};
}
function texts(node){return [node.textContent||'',...(node.children||[]).flatMap(texts)].filter(Boolean)}
test('sin recuperación guardada no aparece el aviso',()=>{
 const u=testUI('GUIA',false);assert.equal(u.items['heva-resume-recovery'],undefined);
});
test('la guía pendiente se muestra como recuperación, no contenido pedagógico',()=>{
 const u=testUI('GUIA'),card=u.items['heva-resume-recovery'],txt=texts(card).join(' ');
 assert.match(txt,/Generación de guía interrumpida/);
 assert.match(txt,/Continuar guía pendiente/);
 assert.match(txt,/No es una actividad de la guía/);
 assert.ok(!card.hidden);
});
test('los otros formatos tienen nombre específico',()=>{
 for(const [tipo,label] of [['EVALUACION','prueba'],['PRESENTACION','presentación'],['PLANIFICACION','planificación']]){
  const u=testUI(tipo);assert.match(texts(u.items['heva-resume-recovery']).join(' '),new RegExp('Continuar '+label+' pendiente'));
 }
});
test('descartar borra solamente el checkpoint y oculta el aviso',()=>{
 const u=testUI(),card=u.items['heva-resume-recovery'];
 const actions=card.children.find(x=>x.tag==='div');
 assert.ok(actions);
 const discard=actions.children.find(x=>x.textContent==='Descartar este avance');
 assert.ok(discard);discard.onclick();
 assert.equal(u.stored.has('heva-recuperacion-v2'),false);
 assert.equal(card.hidden,true);
});
test('el código conserva reanudación original y solo retira su checkpoint al descartar',()=>{
 assert.match(code,/recuperarMaterialHEVA\(plan\)/);
 assert.match(code,/localStorage\.removeItem\(HEVA_RECOVERY_KEY\)/);
 assert.doesNotMatch(code,/localStorage\.clear\(/);
});
