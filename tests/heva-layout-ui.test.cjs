'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../heva-layout-ui.js'),'utf8');
class El {
 constructor(id='',className='',tag='div'){
  this.id=id;this.className=className;this.tag=tag;this.children=[];this.parentElement=null;
  this.style={};this.dataset={};this.listeners={};this.hidden=false;this.checked=false;this.value='GUIA';
  this.classList={add:x=>{this.className+=' '+x},contains:x=>this.className.split(' ').includes(x)};
 }
 append(x){if(x.parentElement)x.parentElement.children.splice(x.parentElement.children.indexOf(x),1);this.children.push(x);x.parentElement=this;return x}
 before(x){const p=this.parentElement;if(!p)throw Error('Node without parent');if(x.parentElement)x.parentElement.children.splice(x.parentElement.children.indexOf(x),1);p.children.splice(p.children.indexOf(this),0,x);x.parentElement=p;}
 closest(selector){for(let x=this;x;x=x.parentElement){if(selector==='div'&&x.tag==='div')return x;if(selector==='div.bg-white'&&x.className.split(' ').includes('bg-white'))return x;if(selector==='div.border-t'&&x.className.split(' ').includes('border-t'))return x;}return null}
 setAttribute(k,v){this[k]=v}
 addEventListener(event,fn){(this.listeners[event]??=[]).push(fn)}
 dispatch(event){for(const fn of this.listeners[event]||[])fn()}
 querySelector(selector){if(selector==='span')return this.children.find(x=>x.tag==='span')||null;return null}
}
function fixture(){
 const map={},el=(id,cls='',tag='div')=>{let e=new El(id,cls,tag);if(id)map[id]=e;return e};
 const body=el('body'),banner=el('banner','no-print');banner.style.background='#f0f6ee';banner.append(el('banner-title','','strong'));const intro=el('intro','','span');banner.append(intro);banner.append(el('banner-link','','a'));body.append(banner);
 body.append(el('heva-proposal-badge'));
 const panel=el('panel-crear'),form=el('form','bg-white'),quality=el('quality','bg-white');body.append(panel);panel.append(form);panel.append(quality);
 const typeBlock=el('type-block');typeBlock.append(el('tipo-material','','select'));form.append(typeBlock);
 const ppt=el('heva-ppt-temas');form.append(ppt);
 const framework=el('framework');form.append(framework);
 const oa=el('oa');form.append(oa);
 const strategy=el('strategy');strategy.append(el('estrategia-didactica','','select'));form.append(strategy);
 const access=el('heva-access-details','','details');access.append(el('pie-lectura-facil','','input'));access.append(el('pie-apoyos-visuales','','input'));access.append(el('pie-graduacion','','input'));form.append(access);
 const topic=el('topic');topic.append(el('tema-especifico','','input'));form.append(topic);
 const counts=el('counts','border-t');counts.append(el('cant-alternativas','','input'));form.append(counts);
 const lab=el('integrated-lab','','details');lab.append(el('lab-enabled','','input'));form.append(lab);
 form.append(el('btn-generar','','button'));
 const audit=el('informe-auditoria-heva','','pre');quality.append(el('btn-auditoria','','button'));quality.append(audit);
 const document={readyState:'complete',getElementById:id=>map[id]||null,createElement:tag=>new El('', '',tag),querySelector:selector=>selector.includes('background:#f0f6ee')?banner:null};
 return {document,map,form,quality,access,lab,topic,strategy,counts,ppt,body,intro};
}
test('oculta opciones PPT al escoger guía y conserva los campos originales',()=>{
 const f=fixture();vm.runInNewContext(source,{document:f.document});
 assert.equal(f.ppt.hidden,true);assert.equal(f.ppt.style.display,'none');
 assert.equal(f.document.getElementById('tipo-material').value,'GUIA');
 assert.equal(f.map['heva-ajustes-adicionales'].tag,'details');
 assert.equal(f.access.parentElement,f.map['heva-ajustes-adicionales']);
 assert.equal(f.lab.parentElement,f.map['heva-ajustes-adicionales']);
 assert.ok(f.form.children.indexOf(f.topic)<f.form.children.indexOf(f.strategy));
 assert.equal(f.map['heva-proposal-badge'].hidden,true);
 assert.equal(f.intro.hidden,true);
});
test('PPT aparece solo con presentación y oculta cantidades sin relevancia',()=>{
 const f=fixture();vm.runInNewContext(source,{document:f.document});
 const type=f.map['tipo-material'];type.value='PRESENTACION';type.dispatch('change');
 assert.equal(f.ppt.hidden,false);assert.equal(f.ppt.style.display,'');
 assert.equal(f.counts.hidden,true);
 type.value='PLANIFICACION';type.dispatch('change');
 assert.equal(f.ppt.hidden,true);assert.equal(f.counts.hidden,true);
 type.value='EVALUACION';type.dispatch('change');
 assert.equal(f.ppt.hidden,true);assert.equal(f.counts.hidden,false);
});
test('la revisión permanece replegada hasta que se solicita',()=>{
 const f=fixture();vm.runInNewContext(source,{document:f.document});
 const fold=f.map['heva-audit-fold'];assert.equal(f.map['informe-auditoria-heva'].parentElement,fold);
 assert.notEqual(fold.open,true);
 f.map['btn-auditoria'].dispatch('click');
 assert.equal(fold.open,true);
});
test('indica apoyos activos sin perder su selección',()=>{
 const f=fixture();vm.runInNewContext(source,{document:f.document});
 const advanced=f.map['heva-ajustes-adicionales'];f.map['pie-lectura-facil'].checked=true;advanced.dispatch('change');
 assert.match(advanced.children[0].textContent,/1 activo/);
 f.map['lab-enabled'].checked=true;advanced.dispatch('change');
 assert.match(advanced.children[0].textContent,/2 activos/);
});
test('la portada y el registro de precarga incluyen el módulo nuevo',()=>{
 const index=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 const sw=fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8');
 assert.match(index,/heva-layout-ui\.js/);assert.match(index,/#heva-ppt-temas\s*\{\s*display:none/);
 assert.ok(JSON.parse(sw.match(/const ASSETS=(\[[^;]+\]);/)[1]).includes('/heva-layout-ui.js'));
});
