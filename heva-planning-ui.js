(function(){
'use strict';
function mountCalendar(panel,node,C,form,read,loadBrief){
 const byId=id=>document.getElementById(id);
 const course=()=>({asignatura:byId('asignatura')?.value||'',nivel:byId('nivel-epja')?.value||'',marcoCurricular:byId('marco-curricular')?.value||''});
 const details=node('details',null,'bg-white border rounded p-3');
 details.id='heva-planning-calendar';
 details.append(node('summary','Calendario de clases y unidades','font-bold cursor-pointer'));
 const fields=node('div',null,'grid gap-3 my-3');
 details.append(fields);
 const status=node('p',null,'text-sm my-2');
 status.setAttribute('role','status');
 function field(parent,label,id,tag,type){
  const wrapper=node('label',label,'block font-semibold text-sm');
  const element=node(tag,null,'block border rounded px-2 py-1 mt-1 w-full font-normal');
  element.id=id;
  element.setAttribute('aria-label',label);
  if(type)element.type=type;
  wrapper.append(element);parent.append(wrapper);return element;
 }
 function option(value,label){const e=node('option',label);e.value=value;return e;}
 function action(parent,label,fn){
  const button=node('button',label,'border rounded px-3 py-1 text-sm font-bold');
  button.type='button';button.addEventListener('click',()=>{
   try{fn();}catch(error){status.textContent=error.message;}
  });
  parent.append(button);return button;
 }
 let active=null;
 const saved=field(fields,'Calendarios guardados','planning-calendar-saved','select');
 const name=field(fields,'Nombre del nuevo calendario','planning-calendar-name','input','text');
 const horizon=field(fields,'Período de planificación','planning-calendar-horizon','select');
 horizon.replaceChildren(...Object.entries(C.calendarHorizons).map(([id,title])=>option(id,title)));
 const from=field(fields,'Desde','planning-calendar-start','input','date');
 const to=field(fields,'Hasta','planning-calendar-end','input','date');
 const days=node('fieldset');days.append(node('legend','Días de clases','font-semibold text-sm'));
 const dayInputs=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'].map((label,value)=>{
  const line=node('label',null,'inline-flex gap-1 items-center mr-3');
  const checkbox=node('input');checkbox.type='checkbox';checkbox.value=value;
  line.append(checkbox,node('span',label,'text-sm'));days.append(line);return checkbox;
 });
 fields.append(days);
 const excluded=field(fields,'Fechas excluidas por feriados o interrupciones, una por línea','planning-calendar-exclusions','textarea');
 excluded.placeholder='AAAA-MM-DD';
 excluded.rows=3;
 const output=node('section',null,'border-t pt-3 mt-3 grid gap-3');
 output.hidden=true;
 const title=node('h4',null,'font-bold');
 const context=node('p',null,'text-sm');
 output.append(title,context);
 const session=field(output,'Sesión','planning-calendar-session','select');
 const sequence=node('fieldset',null,'space-y-2');
 sequence.append(node('legend','Proponer una secuencia de clases','font-semibold text-sm'),node('p','Usa el OA y el encargo del formulario. Desde la fecha seleccionada se ocupan solo sesiones activas sin encargo ni material vinculado.','text-sm'));
 const count=field(sequence,'Cantidad de clases','planning-calendar-itinerary-count','input','number');
 count.min='2';count.max='6';count.step='1';count.value='3';
 const joint=node('details');
 joint.append(node('summary','Añadir un OA de otra asignatura','font-semibold text-sm cursor-pointer'));
 const subject=field(joint,'Segunda asignatura','planning-calendar-joint-subject','select');
 const secondary=field(joint,'OA complementario','planning-calendar-joint-oa','select');
 const source=node('p',null,'text-sm');
 source.setAttribute('role','status');
 const literal=node('p',null,'text-sm');
 joint.append(source,literal);
 const jointFields={
  actividad:field(joint,'Actividad común para ambos OA','planning-calendar-joint-task','textarea'),
  criterioPrincipal:field(joint,'Evidencia observable para el OA principal','planning-calendar-joint-primary','textarea'),
  criterioSecundario:field(joint,'Evidencia observable para el OA complementario','planning-calendar-joint-secondary','textarea')
 };
 for(const field of Object.values(jointFields))field.maxLength=500;
 sequence.append(joint);
 let secondaryRows=[],request=0,selectionContext='';
 function resetSubjects(){
  request++;
  const current=course();
  const choices=[...byId('asignatura').options].filter(o=>o.value&&o.value!==current.asignatura&&!/Construcciones Metálicas/i.test(o.value));
  subject.replaceChildren(option('','Sin OA complementario'),...choices.map(o=>option(o.value,o.textContent)));
  secondary.replaceChildren();
  secondaryRows=[];literal.textContent='';source.textContent='';
  selectionContext=JSON.stringify(current);
 }
 joint.addEventListener('toggle',()=>{
  if(joint.open&&selectionContext!==JSON.stringify(course()))resetSubjects();
 });
 for(const id of ['asignatura','marco-curricular','nivel-epja'])byId(id).addEventListener('change',resetSubjects);
 subject.addEventListener('change',async()=>{
  const token=++request;
  const {marcoCurricular,nivel}=course();
  secondaryRows=[];literal.textContent='';secondary.replaceChildren();
  source.textContent=subject.value?'Cargando objetivos…':'';
  if(!subject.value)return;
  try{
   const {list,source:origin}=await consultarCatalogoHEVA({marco:marcoCurricular,nivel,asignatura:subject.value});
   if(token!==request)return;
   secondaryRows=list.filter(o=>o.clave_interna&&o.texto_literal&&o.vigente!==false);
   secondary.replaceChildren(option('','Selecciona un OA complementario'),...secondaryRows.map(o=>option(o.clave_interna,(o.codigo_oficial||o.clave_interna)+' · '+o.texto_literal)));
   source.textContent=secondaryRows.length?(origin==='Supabase'?'Objetivos de Supabase.':'Respaldo local. Puede requerir actualización.'):'No hay objetivos disponibles para esta selección.';
  }catch(error){if(token===request)source.textContent='No se pudo consultar el catálogo para esta asignatura.';}
 });
 secondary.addEventListener('change',()=>{literal.textContent=secondaryRows.find(o=>o.clave_interna===secondary.value)?.texto_literal||'';});
 output.append(sequence);
 const date=field(output,'Fecha de la sesión','planning-calendar-date','input','date');
 const duration=field(output,'Duración de la sesión en minutos','planning-calendar-minutes','input','number');
 duration.min='15';duration.max='240';duration.step='1';
 const note=field(output,'Nota, ajuste por baja asistencia o actividad de recuperación','planning-calendar-session-note','textarea');
 note.rows=2;
 const suspendedLabel=node('label',null,'flex gap-2 items-center text-sm');
 const suspended=node('input');suspended.type='checkbox';
 suspendedLabel.append(suspended,node('span','Marcar sesión suspendida'));output.append(suspendedLabel);
 const planMode=field(output,'Encargo de la sesión','planning-calendar-session-plan','select');
 planMode.append(option('keep','Conservar el encargo guardado'),option('assign','Vincular el encargo actual del formulario'),option('clear','Quitar el encargo vinculado'));
 const planSummary=node('pre',null,'whitespace-pre-wrap font-sans text-sm');
 output.append(planSummary);
 const itinerary=node('fieldset',null,'space-y-2');
 itinerary.append(node('legend','Itinerario de la sesión','font-semibold text-sm'));
 const stage=field(itinerary,'Foco de la clase','planning-calendar-itinerary-stage','input','text');
 const activity=field(itinerary,'Actividad de la clase','planning-calendar-itinerary-activity','textarea');
 const evidence=field(itinerary,'Evidencia de aprendizaje','planning-calendar-itinerary-evidence','textarea');
 stage.maxLength=120;activity.maxLength=1000;evidence.maxLength=1000;
 output.append(itinerary);
 const material=field(output,'Versión de material del historial','planning-calendar-material','select');
 function history(){return typeof readHistory==='function'?(readHistory()||[]):[];}
 const chosen=()=>active?.sesiones.find(entry=>entry.id===session.value);
 const currentBrief=()=>{
  const planificacionClase=read();
  const errors=C.validate({tipoMaterial:'PLANIFICACION',planificacionClase});
  if(errors.length)throw Error(errors.join(' '));
  return {...course(),...form(),objetivoId:byId('select-oa')?.selectedOptions[0]?.dataset.key||'',planificacionClase};
 };
 function showSession(){
  const current=chosen();
  if(!current)return;
  date.value=current.fecha;duration.value=current.duracion;note.value=current.nota;suspended.checked=current.suspendida===true;
  planMode.value='keep';
  const plan=current.encargo;
  itinerary.hidden=!plan?.itinerario;
  stage.value=plan?.itinerario?.titulo||'';
  activity.value=plan?.itinerario?.actividad||'';
  evidence.value=plan?.itinerario?.evidencia||'';
  planSummary.textContent=plan?[plan.objetivoAprendizaje,plan.temaEspecifico,C.summary(plan.planificacionClase)].join('\n'):'Sesión sin encargo vinculado.';
  const entries=history().filter(entry=>typeof entry?.id==='string'&&entry.data?.titulo);
  material.replaceChildren(option('','Sin material'),...entries.map(({id,data})=>option(id,data.titulo+(data.version?' · v'+data.version:''))));
  if(current.materialId&&!entries.some(entry=>entry.id===current.materialId))material.append(option(current.materialId,'Versión no disponible en el historial'));
  material.value=current.materialId;
 }
 function showCalendar(calendar,sessionId){
  active=calendar;output.hidden=!calendar;
  if(!calendar)return;
  title.textContent=calendar.nombre;
  context.textContent=[C.calendarHorizons[calendar.horizonte],calendar.curso.asignatura,calendar.curso.nivel,calendar.sesiones.filter(entry=>!entry.suspendida).length+' sesiones activas'].join(' · ');
  session.replaceChildren(...calendar.sesiones.map(entry=>option(entry.id,entry.fecha+' · '+(entry.suspendida?'suspendida':entry.duracion+' min'))));
  if(sessionId)session.value=sessionId;
  showSession();
 }
 function showSaved(selected){
  const calendars=C.readCalendars(localStorage);
  saved.replaceChildren(option('','Selecciona un calendario'),...calendars.map(item=>option(item.id,item.nombre+' · '+C.calendarHorizons[item.horizonte])));
  saved.value=selected||'';
  return calendars;
 }
 action(fields,'Crear calendario local',()=>{
  const calendar=C.scheduleCalendar({id:crypto.randomUUID(),nombre:name.value,horizonte:horizon.value,inicio:from.value,fin:to.value,dias:dayInputs.filter(input=>input.checked).map(input=>Number(input.value)),exclusiones:excluded.value.split('\n').map(text=>text.trim()).filter(Boolean),duracion:read().duracion,curso:course()});
  C.saveCalendar(localStorage,calendar);showSaved(calendar.id);showCalendar(calendar);
  status.textContent='Calendario guardado en este navegador.';
 });
 action(sequence,'Proponer y guardar secuencia',()=>{
  const sessionId=session.value;
  const amount=Number(count.value);
  let brief=currentBrief();
  if(subject.value){
   if(selectionContext!==JSON.stringify(course()))throw Error('Vuelve a seleccionar la segunda asignatura para este curso.');
   const selected=byId('select-oa').selectedOptions[0];
   brief.oaPrincipal={clave:selected?.dataset.key,texto:selected?.value};
   const fields=Object.fromEntries(Object.entries(jointFields).map(([key,field])=>[key,field.value]));
   brief=C.interdisciplinaryBrief(brief,secondaryRows.find(o=>o.clave_interna===secondary.value),fields);
  }
  const next=C.proposeItinerary(active,sessionId,amount,brief);
  C.saveCalendar(localStorage,next);showCalendar(next,sessionId);
  status.textContent='Secuencia guardada en '+amount+' sesiones. Selecciona una sesión para revisar o editar su propuesta.';
 });
 action(output,'Guardar cambios de la sesión',()=>{
  const current=chosen();
  let encargo=current?.encargo;
  if(planMode.value==='clear')encargo=null;
  if(planMode.value==='assign')encargo=currentBrief();
  if(planMode.value==='keep'&&encargo?.itinerario)encargo=C.editItinerary(encargo,{titulo:stage.value,actividad:activity.value,evidencia:evidence.value});
  const next=C.updateSession(active,session.value,{fecha:date.value,duracion:Number(duration.value),nota:note.value,materialId:material.value,encargo,suspendida:suspended.checked});
  const sessionId=session.value;
  C.saveCalendar(localStorage,next);showCalendar(next,sessionId);
  status.textContent='Sesión actualizada.';
 });
 action(output,'Abrir material vinculado',()=>{
  const index=history().findIndex(entry=>entry.id===chosen()?.materialId);
  if(index<0)throw Error('La versión vinculada no está disponible en el historial de este navegador.');
  recuperarHistorial(index);
 });
 action(itinerary,'Cargar encargo guardado en el formulario',()=>{
  const encargo=chosen()?.encargo;
  if(!encargo?.itinerario)throw Error('Selecciona una sesión con itinerario.');
  const selected=course();
  if(Object.keys(selected).some(key=>selected[key]!==encargo[key])||form().objetivoAprendizaje!==encargo.objetivoAprendizaje)throw Error('Selecciona en el formulario el mismo curso y OA que se muestran en el encargo.');
  loadBrief(encargo);
  status.textContent='Encargo cargado. Puedes revisarlo y generar la planificación desde el formulario.';
 });
 saved.addEventListener('change',()=>{
  try{const entry=C.readCalendars(localStorage).find(item=>item.id===saved.value);showCalendar(entry);}
  catch(error){status.textContent=error.message;}
 });
 session.addEventListener('change',showSession);
 details.addEventListener('toggle',()=>{
  if(!details.open)return;
  try{showSaved(active?.id);if(active)showSession();}
  catch(error){status.textContent=error.message;}
 });
 details.append(output,status);
 panel.prepend(details);
}
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
function loadBrief(encargo){
 const c=encargo.planificacionClase;
 $('tema-especifico').value=encargo.temaEspecifico;
 suggest();
 minutes.value=c.duracion;
 const remaining=new Set(c.contenidos);
 for(const input of contentBox.querySelectorAll('input'))input.checked=remaining.delete(input.value);
 custom.value=[...remaining].join('\n');
 for(const input of panel.querySelectorAll('input[data-planning-group]'))input.checked=(c[input.dataset.planningGroup]||[]).includes(input.value);
 mode.value=c.modoMateriales;
 detail.value=c.detalleMetodos||'';
 controls['planning-own'].value=c.materialPropio||'';
 controls['planning-product'].value=c.producto||'';
 const t=C.times(c);
 for(const key of ['inicio','desarrollo','cierre'])controls['planning-time-'+key].value=t[key];
 summaryEdited=false;
 refreshSummary();
}
mountCalendar(panel,node,C,form,read,loadBrief);
type.addEventListener('change',refresh);$('select-oa').addEventListener('change',()=>{suggest();});$('texto-oa').addEventListener('input',suggest);$('asignatura').addEventListener('change',suggest);
const oldUpdate=window.actualizarObjetivosYEstrategias;window.actualizarObjetivosYEstrategias=async function(...args){const r=await oldUpdate.apply(this,args);refresh();return r;};
refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();

