'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../heva-recovery-ui.js'),'utf8');
function testUI(tipo='GUIA',withPending=true){
 const plan={tipoMaterial:tipo,cantAlternativas:6,cantDesarrollo:2,cantCasos:1,temaEspecifico:'Globalización'};
 const stored=new Map(),items={};
 if(withPending)stored.set('heva-recuperacion-v2',JSON.stringify({version:2,planKey:JSON.stringify(plan),parts:[]}));
 const createElement=tag=>({tag,children:[],hidden:false,className:'',style:{},textContent:'',disabled:false,onclick:null,append(...parts){this.children.push(...parts)},replaceChildren(...parts){this.children=parts},setAttribute(key,val){this[key]=val}});
 const host=createElement('section');host.prepend=node=>{host.children.unshift(node);items[node.id]=node};
 items['panel-crear']=host;items['btn-generar']=createElement('button');
 const document={createElement,getElementById:id=>items[id]||null};
 const localStorage={getItem:key=>stored.get(key)||null,setItem:(key,val)=>stored.set(key,val),removeItem:key=>stored.delete(key)};
 const ctx={document,localStorage,console,AbortSignal:{timeout(){}},fetch:async()=>{throw Error('No fetch expected')}};
 vm.runInNewContext(code,ctx);
 return {host,items,stored,ctx};
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
test('apartar realiza una copia verificable antes de retirar el avance activo',()=>{
 const u=testUI('EVALUACION'),card=u.items['heva-resume-recovery'];
 const actions=card.children.find(x=>x.tag==='div');
 const apartar=actions.children.find(x=>x.textContent==='Apartar avance (recuperable)');
 assert.ok(apartar);
 apartar.onclick();
 assert.equal(u.stored.has('heva-recuperacion-v2'),false);
 const copy=JSON.parse(u.stored.get('heva-recuperacion-apartada-v1'));
 assert.equal(copy.version,2);
 assert.match(copy.planKey,/"EVALUACION"/);
 assert.ok(!card.hidden);
 assert.match(texts(card).join(' '),/Recuperar avance apartado/);
});
test('recuperar avance apartado devuelve el checkpoint original',()=>{
 const u=testUI('EVALUACION');
 const card=u.items['heva-resume-recovery'];
 card.children.find(x=>x.tag==='div').children.find(x=>x.textContent==='Apartar avance (recuperable)').onclick();
 const restore=card.children.find(x=>x.textContent==='Recuperar avance apartado');
 assert.ok(restore);restore.onclick();
 assert.equal(u.stored.has('heva-recuperacion-v2'),true);
 assert.equal(u.stored.has('heva-recuperacion-apartada-v1'),false);
 assert.match(texts(card).join(' '),/Continuar prueba pendiente/);
});
test('apartar está prohibido mientras una generación sigue en curso',()=>{
 const u=testUI('EVALUACION');
 const card=u.items['heva-resume-recovery'];
 u.items['btn-generar'].disabled=true;
 const apartar=card.children.find(x=>x.tag==='div').children.find(x=>x.textContent==='Apartar avance (recuperable)');
 apartar.onclick();
 assert.equal(u.stored.has('heva-recuperacion-v2'),true);
 assert.equal(u.stored.has('heva-recuperacion-apartada-v1'),false);
});
test('no sobrescribe un avance apartado diferente',()=>{
 const u=testUI('EVALUACION');
 u.stored.set('heva-recuperacion-apartada-v1',JSON.stringify({version:2,planKey:JSON.stringify({tipoMaterial:'GUIA'}),parts:[]}));
 const card=u.items['heva-resume-recovery'];
 card.children.find(x=>x.tag==='div').children.find(x=>x.textContent==='Apartar avance (recuperable)').onclick();
 assert.equal(u.stored.has('heva-recuperacion-v2'),true);
 assert.match(texts(card).join(' '),/Ya existe otro avance apartado/);
});
test('auto-guardado almacena la prueba en Mis Materiales sin eliminar avances ante un error',()=>{
 const u=testUI('EVALUACION'),testMaterial={titulo:'Prueba de globalización',tipoMaterial:'EVALUACION',preguntasAlternativas:[{enunciado:'Caso de prueba'}]};
 assert.equal(u.ctx.hevaAutoSaveMaterial(testMaterial),true);
 const saved=JSON.parse(u.stored.get('heva_historial'));
 assert.equal(saved.length,1);assert.equal(saved[0].data.tipoMaterial,'EVALUACION');
 u.ctx.hevaAutoSaveMaterial(testMaterial);
 assert.equal(JSON.parse(u.stored.get('heva_historial')).length,1);
 assert.equal(u.stored.has('heva-recuperacion-v2'),true);
});
test('el código conserva reanudación original y solo retira su checkpoint al descartar',()=>{
 assert.match(code,/recuperarMaterialHEVA\(plan\)/);
 assert.match(code,/localStorage\.removeItem\(HEVA_RECOVERY_KEY\)/);
 assert.doesNotMatch(code,/localStorage\.clear\(/);
});
