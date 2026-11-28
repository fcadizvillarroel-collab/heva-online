(function(){
 'use strict';
 function mount(){
  const container=document.getElementById('heva-planning-calendar');
  if(!container||!window.HEVACurriculumTracking)return;
  const C=window.HEVACurriculumTracking;
  const node=(tag,text,classes)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(classes)e.className=classes;return e;};
  const panel=node('details',undefined,'border-t pt-3 mt-3 space-y-3');
  panel.id='heva-curriculum-tracking';
  panel.append(node('summary','Seguimiento curricular por curso','font-bold cursor-pointer'));
  panel.append(node('p','Selecciona un perfil y un calendario guardados. El calendario muestra lo planificado. Registra aquí el avance y la recuperación del grupo en este navegador.','text-sm'));
  function field(parent,label,id,tag){
   const wrapper=node('label',label,'block font-semibold text-sm');
   const element=node(tag,undefined,'block border rounded px-2 py-1 mt-1 w-full font-normal');
   element.id='curriculum-tracking-'+id;
   wrapper.append(element);parent.append(wrapper);return element;
  }
  function option(value,label){const e=node('option',label);e.value=value;return e;}
  function button(parent,label,callback){
   const b=node('button',label,'border rounded px-3 py-1 text-sm font-bold');b.type='button';
   b.addEventListener('click',()=>{try{callback();}catch(error){status.textContent=error.message;}});
   parent.append(b);return b;
  }
  const profileField=field(panel,'Perfil del curso','profile','select');
  const calendarField=field(panel,'Calendario del curso','calendar','select');
  const status=node('p',undefined,'text-sm');status.setAttribute('role','status');panel.append(status);
  const results=node('section',undefined,'space-y-3');results.hidden=true;panel.append(results);
  const filter=field(results,'Filtrar por estado','filter','select');
  filter.replaceChildren(option('','Todos'),...Object.entries(C.states).map(([id,label])=>option(id,label)));
  const summary=node('p',undefined,'text-sm');
  const coverage=node('ul',undefined,'grid sm:grid-cols-2 gap-2 text-sm');
  coverage.setAttribute('aria-label','Cobertura por estado del objetivo');
  results.append(summary,coverage);
  const list=field(results,'Objetivo de aprendizaje','oa','select');
  const oaText=node('p',undefined,'text-sm');results.append(oaText);
  const sessions=node('ul',undefined,'list-disc pl-5 text-sm space-y-2');results.append(sessions);
  const progress=field(results,'Estado registrado por docente','state','select');
  progress.replaceChildren(option('','Usar el estado del calendario'),...Object.entries(C.states).map(([id,label])=>option(id,label)));
  const recovery=field(results,'Actividad de recuperación del OA','recovery','textarea');
  recovery.maxLength=1500;recovery.rows=3;
  const save=button(results,'Guardar seguimiento del OA',()=>{
   const row=current();if(!row)return;
   C.setProgress(localStorage,profile(),calendar(),row.key,{estado:progress.value,recuperacion:recovery.value});
   updateRows(row.key);status.textContent='Seguimiento guardado en este navegador. '+origin;
  });
  button(results,'Descargar informe de seguimiento',()=>{
   const text=C.report(profile(),calendar(),rows,origin);
   window.HEVAOffice.download(new Blob([text],{type:'text/plain;charset=utf-8'}),'heva-seguimiento-curricular.txt');
  });
  button(results,'Eliminar registros manuales del calendario',()=>{
   const p=profile(),c=calendar();
   if(!window.confirm('¿Eliminar los estados docentes y las actividades de recuperación de '+p.name+' en '+c.nombre+'? El calendario, sus sesiones y materiales se conservan.'))return;
   C.clearProgress(localStorage,p,c);
   updateRows();
   status.textContent='Registros manuales eliminados para este perfil y calendario.';
  });
  let profiles=[],calendars=[],catalog=[],rows=[],origin='',revision=0;
  const profile=()=>profiles.find(entry=>entry.id===profileField.value);
  const calendar=()=>calendars.find(entry=>entry.id===calendarField.value);
  const current=()=>rows.find(row=>row.key===list.value);
  function choices(){
   const prior=profileField.value;
   profiles=window.HEVACourseWorkflow.readProfiles(localStorage);
   calendars=window.HEVAPlanning.readCalendars(localStorage);
   profileField.replaceChildren(option('','Selecciona un perfil de curso'),...profiles.map(x=>option(x.id,x.name)));
   profileField.value=profiles.some(x=>x.id===prior)?prior:'';
   calendarChoices();
  }
  function calendarChoices(){
   const prior=calendarField.value;
   const allowed=calendars.filter(entry=>C.matchesCourse(profile(),entry));
   calendarField.replaceChildren(option('','Selecciona un calendario'),...allowed.map(x=>option(x.id,x.nombre)));
   calendarField.value=allowed.some(x=>x.id===prior)?prior:'';
   if(!profiles.length)status.textContent='Guarda un perfil del curso en el generador.';
   else if(profile()&&!allowed.length)status.textContent='Crea un calendario para el marco, nivel y asignatura del perfil.';
   else status.textContent='';
  }
  function showObjective(){
   const row=current();save.disabled=progress.disabled=recovery.disabled=!row;
   progress.value=row?.estadoManual||'';recovery.value=row?.recuperacion||'';
   oaText.textContent=row?.texto||'';
   sessions.replaceChildren(...(row?.sesiones||[]).map(session=>{
    const item=node('li');
    const detail=node('details',undefined,'border rounded p-2 space-y-1');
    detail.append(node('summary',session.fecha+' · '+(session.suspendida?'Sesión suspendida':'Sesión programada')+' · '+(session.tema||'Sin tema'),'font-semibold cursor-pointer'));
    item.append(detail);
    for(const [label,text] of [['Plan',session.plan],['Actividades y contenidos',session.actividades.join(' · ')],['Evidencia prevista',session.evidencia],['Nota o ajuste',session.nota]]){
     if(text)detail.append(node('p',label+': '+text,'whitespace-pre-line'));
    }
    if(session.materialId)detail.append(node('p','Material: '+(session.material||'Versión vinculada no disponible')+(session.version?' · v'+session.version:'')));
    button(detail,'Ver sesión en el calendario',()=>{
     const saved=document.getElementById('planning-calendar-saved');
     const date=document.getElementById('planning-calendar-session');
     saved.value=calendar().id;saved.dispatchEvent(new Event('change'));
     date.value=session.id;date.dispatchEvent(new Event('change'));date.focus();
    });
    return item;
   }));
  }
  function updateRows(selected=list.value){
   rows=C.build(localStorage,profile(),calendar(),catalog,typeof readHistory==='function'?readHistory()||[]:[]);
   const visible=rows.filter(row=>!filter.value||row.estado===filter.value);
   summary.textContent=visible.length+' de '+rows.length+' objetivos · '+origin;
   coverage.replaceChildren(...Object.entries(C.states).map(([key,label])=>{
    const count=rows.filter(row=>row.estado===key).length;
    const item=node('li',undefined,'border rounded px-2 py-1');
    const bar=node('meter',undefined,'block w-full');
    bar.max=Math.max(1,rows.length);bar.value=count;bar.setAttribute('aria-label',label+' · '+count+' de '+rows.length);
    item.append(node('span',label+' · '+count),bar);
    return item;
   }));
   list.replaceChildren(option('','Selecciona un OA'),...visible.map(row=>option(row.key,row.codigo+' · '+C.states[row.estado]+' · '+row.texto)));
   if(visible.some(row=>row.key===selected))list.value=selected;
   showObjective();
  }
  async function load(){
   const token=++revision;results.hidden=true;
   const p=profile();
   if(!p||!calendar())return;
   if(/Construcciones Metálicas/i.test(p.asignatura)){
    status.textContent='Construcciones Metálicas utiliza referencias documentales y criterios del módulo en el calendario.';
    return;
   }
   status.textContent='Consultando objetivos del curso…';
   try{
    const result=await consultarCatalogoHEVA({marco:p.marco,nivel:p.nivel,asignatura:p.asignatura});
    if(revision!==token)return;
    catalog=result.list;
    origin=result.source==='Supabase'?'Catálogo vigente en Supabase.':'Respaldo curricular local. Puede requerir actualización.';
    updateRows();
    results.hidden=!rows.length;
    status.textContent=rows.length?'':'No hay OA vigentes disponibles para este perfil. '+origin;
   }catch(error){if(revision===token)status.textContent='No se pudo abrir el seguimiento. '+error.message;}
  }
  panel.addEventListener('toggle',()=>{
   if(!panel.open)return;
   try{choices();load();}catch(error){status.textContent=error.message;}
  });
  profileField.addEventListener('change',()=>{calendarChoices();load();});
  calendarField.addEventListener('change',load);
  filter.addEventListener('change',()=>{try{updateRows();}catch(error){status.textContent=error.message;}});
  list.addEventListener('change',showObjective);
  function refresh(){
   if(results.hidden||!panel.open)return;
   try{
    const prior=JSON.stringify(calendar());
    calendars=window.HEVAPlanning.readCalendars(localStorage);
    if(JSON.stringify(calendar())!==prior)updateRows();
   }catch(error){status.textContent=error.message;}
  }
  container.addEventListener('click',event=>{if(!panel.contains(event.target))refresh();});
  window.addEventListener('storage',refresh);
  container.append(panel);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
