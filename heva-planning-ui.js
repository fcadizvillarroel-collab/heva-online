(function(){
'use strict';
function mount(){
const C=HEVAPlanning,$=id=>document.getElementById(id),type=$('tipo-material'),anchor=$('tema-especifico')?.parentElement;if(!type||!anchor)return;
const panel=document.createElement('section');panel.id='heva-planning-panel';panel.className='border-2 border-amber-300 rounded-xl p-4 bg-amber-50 space-y-3 my-3';anchor.after(panel);
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
panel.append(node('h3','Diseña tu clase','font-bold text-[#8B2635]'),node('p','Elige qué enseñar y cómo trabajar. Las sugerencias se adaptan al objetivo; puedes escribir otros contenidos.','text-xs'));
const controls={};let lastKey='',summaryEdited=false;
function input(label,id,value,kind='text'){const l=node('label',label,'block text-xs font-bold');const e=document.createElement(kind==='textarea'?'textarea':'input');e.id=id;if(kind!=='textarea')e.type=kind;e.value=value;e.className='block border rounded p-2 w-full font-normal mt-1';if(kind==='textarea')e.rows=3;l.append(e);panel.append(l);controls[id]=e;return e;}
const minutes=input('Duración de la clase (minutos)','planning-duration','90','number');minutes.min='15';minutes.max='240';
const contentBox=node('fieldset');contentBox.append(node('legend','Qué quiero trabajar','font-bold text-sm'));panel.append(contentBox);
const custom=input('Otros contenidos (uno por línea)','planning-custom','','textarea');
function checkList(key,label,parent=panel){const box=node('fieldset');box.append(node('legend',label,'font-bold text-sm'));const list=node('div',null,'grid grid-cols-1 gap-2 mt-2');box.append(list);for(const [id,text]of Object.entries(C.groups[key])){const l=node('label',null,'text-xs flex gap-2 items-start');const e=document.createElement('input');e.type='checkbox';e.dataset.planningGroup=key;e.value=id;l.append(e,node('span',text));list.append(l);}parent.append(box);return box;}
checkList('metodos','Cómo voy a enseñar');const detail=input('Precisa el caso, problema o pregunta de debate (opcional)','planning-method-details','','textarea');detail.placeholder='Por ejemplo: decidir entre dos soluciones, interpretar una fuente o discutir una pregunta.';
checkList('agrupamientos','Cómo trabajarán los estudiantes');checkList('recursos','Qué recursos utilizaré');
input('Material propio o referencia que ya tengo (opcional)','planning-own','','textarea');
checkList('comprobaciones','Cómo comprobaré el aprendizaje');
input('Qué producirán o demostrarán los estudiantes','planning-product','','textarea');
checkList('apoyos','Qué apoyos necesitan');
const modeLabel=node('label','Materiales de la clase','block text-xs font-bold');const mode=document.createElement('select');mode.id='planning-material-mode';mode.className='block border rounded p-2 w-full';for(const [id,label]of [['existentes','Planificar usando materiales que ya tengo'],['crear','Planificar y generar materiales después de revisar']]){const o=node('option',label);o.value=id;mode.append(o);}modeLabel.append(mode);panel.append(modeLabel);
const materials=checkList('materiales','Materiales que quiero crear');materials.append(node('p','Después de revisar la planificación, abre «Paquete pedagógico de esta unidad» para generar los materiales elegidos.','text-xs mt-2'));
const timeBox=node('fieldset');timeBox.append(node('legend','Distribución del tiempo','font-bold text-sm'));panel.append(timeBox);
for(const [key,label,value]of [['inicio','Inicio',15],['desarrollo','Desarrollo',60],['cierre','Cierre',15]]){const l=node('label',label+' (minutos)','block text-xs');const e=document.createElement('input');e.type='number';e.min='1';e.id='planning-time-'+key;e.value=value;e.className='block border rounded p-2 w-24';controls[e.id]=e;l.append(e);timeBox.append(l);}
const summary=input('Resumen del encargo (puedes ajustarlo)','planning-summary','','textarea');summary.rows=7;
const status=node('p',null,'text-xs font-bold');status.setAttribute('role','status');panel.append(status);
function form(){return{asignatura:$('asignatura').value,objetivoAprendizaje:$('texto-oa').value,temaEspecifico:$('tema-especifico').value};}
function selected(key){return [...panel.querySelectorAll('input[data-planning-group="'+key+'"]:checked')].map(e=>e.value);}
function read(){return{duracion:Number(minutes.value),contenidos:[...contentBox.querySelectorAll('input:checked')].map(e=>e.value).concat(custom.value.split('\n').map(s=>s.trim()).filter(Boolean)),metodos:selected('metodos'),agrupamientos:selected('agrupamientos'),recursos:selected('recursos'),comprobaciones:selected('comprobaciones'),apoyos:selected('apoyos'),materiales:mode.value==='crear'?selected('materiales'):[],modoMateriales:mode.value,detalleMetodos:detail.value,materialPropio:controls['planning-own'].value,producto:controls['planning-product'].value,tiempos:Object.fromEntries(['inicio','desarrollo','cierre'].map(k=>[k,Number(controls['planning-time-'+k].value)])),resumen:summary.value};}
function suggest(){const p=form(),key=JSON.stringify([p.asignatura,p.objetivoAprendizaje]);if(key===lastKey)return;lastKey=key;contentBox.querySelectorAll('label').forEach(e=>e.remove());C.suggestions(p).forEach((text,i)=>{const l=node('label',null,'flex items-start gap-2 text-xs mt-2'),e=document.createElement('input');e.type='checkbox';e.value=text;e.checked=i<2;l.append(e,node('span',text));contentBox.append(l);});summaryEdited=false;refreshSummary();}
function refreshSummary(){materials.hidden=mode.value!=='crear';const c=read();if(!summaryEdited)summary.value=C.summary(c);const errors=C.validate({tipoMaterial:'PLANIFICACION',planificacionClase:c});status.textContent=errors.length?errors.join(' '):'El encargo está preparado. Puedes generar la planificación.';}
for(const [group,id]of [['metodos','explicacion'],['metodos','modelado'],['agrupamientos','individual'],['agrupamientos','plenaria'],['recursos','texto'],['comprobaciones','oral']])panel.querySelector('[data-planning-group="'+group+'"][value="'+id+'"]').checked=true;
summary.addEventListener('input',()=>{summaryEdited=true;});
panel.addEventListener('input',e=>{if(e.target!==summary)refreshSummary();});panel.addEventListener('change',refreshSummary);
function updateTimes(){const t=C.times({duracion:Number(minutes.value)});for(const k of ['inicio','desarrollo','cierre'])controls['planning-time-'+k].value=t[k];refreshSummary();}
minutes.addEventListener('input',updateTimes);minutes.addEventListener('change',updateTimes);
function refresh(){const planning=type.value==='PLANIFICACION';panel.hidden=!planning;for(const id of ['heva-unified-pedagogy','heva-access-details','heva-design-details','heva-depth-details']){const e=$(id);if(e)e.hidden=planning;}const e=$('heva-design');if(e)e.closest('details')?e.closest('details').hidden=planning:e.hidden=planning;const contract=$('contrato-material');if(planning&&contract){contract.replaceChildren(node('strong','Planificación de una clase'),node('p','Selecciona contenidos, metodología, recursos y evaluación. La planificación tendrá inicio, desarrollo y cierre según el tiempo elegido.'));}if(planning){if($('integrated-lab'))$('integrated-lab').open=false;suggest();refreshSummary();}}
window.hevaPlanningExtras=()=>{if(type.value!=='PLANIFICACION')return{};suggest();const c=read(),errors=C.validate({tipoMaterial:'PLANIFICACION',planificacionClase:c});if(errors.length)throw Error(errors.join('; '));const map={modelado:'MODELADO',fuentes:'FUENTES',casos:'CASOS',problemas:'PROBLEMAS',lectura:'LECTURA',escritura:'MODELADO',simulacion:'CASOS',debate:'FUENTES',indagacion:'PROBLEMAS'};const primary=c.metodos.find(id=>map[id]);return{planificacionClase:c,disenoPedagogico:null,planIntegrado:null,estrategiaDidactica:HEVAPedagogy.strategy(map[primary]||'MODELADO').name,adecuacionesPIE:c.apoyos.map(id=>C.groups.apoyos[id])};};
type.addEventListener('change',refresh);$('select-oa').addEventListener('change',()=>{suggest();});$('texto-oa').addEventListener('input',suggest);$('asignatura').addEventListener('change',suggest);
const oldUpdate=window.actualizarObjetivosYEstrategias;window.actualizarObjetivosYEstrategias=async function(...args){const r=await oldUpdate.apply(this,args);refresh();return r;};
refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();

