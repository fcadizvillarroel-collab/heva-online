/* Panel docente de resultados de grupo. Las operaciones y la exportación son locales. */
(function(){
 'use strict';
 const analytics=window.HEVALearningAnalytics;
 if(!analytics||typeof renderizarDocumentoEnPantalla!=='function')return;
 const byId=id=>document.getElementById(id);
 const element=(tag,text)=>{
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  return node;
 };
 const button=(text,action)=>{
  const node=element('button',text);node.type='button';node.className='border rounded px-3 py-2';node.onclick=action;return node;
 };
 const number=(label,max,step)=>{
  const input=element('input');input.type='number';input.min='0';input.max=String(max);input.step=step;
  input.className='border rounded p-1 w-16';input.setAttribute('aria-label',label);
  return input;
 };
 let signature=null;
 function mount(){
  const active=typeof materialActual!=='undefined'?materialActual:null;
  const description=analytics.describe(active);
  let panel=byId('heva-learning-analytics');
  const host=byId('heva-result-edit')||byId('hoja-material')?.parentElement;
  if(!host)return;
  if(!description){if(panel){panel.hidden=true;signature=null;}return;}
  if(panel&&panel.parentElement!==host)host.append(panel);
  if(panel&&signature===description.signature){panel.hidden=false;return;}
  if(!panel){
   panel=element('details');panel.id='heva-learning-analytics';panel.className='no-print heva-result-fold border rounded p-3 my-3';
   host.append(panel);
  }
  panel.hidden=false;signature=description.signature;
  render(panel,description,active.objetivoAprendizaje);
 }
 function render(panel,description,objective){
  const {items,signature:expected}=description;
  panel.replaceChildren(element('summary','Resultados del grupo y recuperación'),
   element('p','Registra cuántas personas rindieron cada ítem y la suma de sus puntos. Completa solo resultados agregados. Los datos se guardan en este navegador.'));
  const threshold=number('Umbral de refuerzo (%)',100,'1');threshold.value='60';
  const thresholdLabel=element('label','Umbral de refuerzo (%) ');thresholdLabel.append(threshold);panel.append(thresholdLabel);
  const wrapper=element('div');wrapper.className='overflow-x-auto';wrapper.tabIndex=0;wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','Tabla de resultados por ítem');
  const table=element('table');table.className='text-sm my-2 w-full';
  table.append(element('caption','Resultados de la evaluación abierta'));
  const header=table.createTHead().insertRow();
  for(const label of ['Ítem','Puntos máximos','Aplicaciones','Puntos acumulados','Logro']){
   const cell=element('th',label);cell.scope='col';header.append(cell);
  }
  const body=table.createTBody();
  const controls=items.map(({label,points})=>{
   const count=number('Aplicaciones · '+label,analytics.maxGroup,'1');
   const earned=number('Puntos acumulados · '+label,analytics.maxGroup*points,'any');
   const row=body.insertRow(),heading=element('th',label);heading.scope='row';row.append(heading);
   row.insertCell().textContent=String(points);
   row.insertCell().append(count);row.insertCell().append(earned);
   const result=row.insertCell();result.textContent='Sin datos';
   return {count,earned,result};
  });
  wrapper.append(table);panel.append(wrapper);
  const state=element('p');state.setAttribute('role','status');
  const results=element('section');
  let savedReport=null;
  const actions=element('div');actions.className='flex flex-wrap gap-2 my-2';
  const validateCurrent=()=>{
   syncEdits();
   if(analytics.describe(materialActual)?.signature!==expected){
    mount();
    throw Error('La evaluación cambió. Abre el panel de la versión actual para registrar sus resultados.');
   }
  };
  const collect=()=>controls.map(({count,earned})=>{
   if(count.value===''&&earned.value===''&&!count.validity.badInput&&!earned.validity.badInput)return {count:0,earned:0};
   return {count:count.valueAsNumber,earned:earned.valueAsNumber};
  });
  const compute=()=>{
   validateCurrent();
   const report=analytics.summarize(items,collect(),threshold.valueAsNumber);
   if(savedReport?.previous)report.previous=savedReport.previous;
   return report;
  };
  function renderReport(report){
   report.rows.forEach((row,index)=>{
    controls[index].result.textContent=row.percent===null?'Sin datos':analytics.percentage(row.percent)+' %';
   });
   results.replaceChildren();
   if(!report.possible){results.append(element('p','Agrega al menos una aplicación para calcular el logro.'));return;}
   results.append(element('p','Logro ponderado en las aplicaciones registradas: '+analytics.percentage(report.percent)+' %.'));
   if(report.previous){
    results.append(element('h4','Comparación con la aplicación anterior'),
     element('p','Compara resultados agregados del mismo instrumento. Las personas y el número de aplicaciones pueden variar.'));
    const previous=report.previous;
    const format=row=>row.possible?analytics.percentage(row.percent)+' % ('+row.earned+' de '+row.possible+' puntos)':'Sin datos';
    results.append(element('p','Total ponderado actual: '+format(report)+'. Anterior: '+format(previous)+'.'));
    const list=element('ul');
    report.rows.forEach((row,index)=>{
     const prior=previous.rows[index];
     list.append(element('li',row.label+'. Actual: '+format(row)+' en '+row.count+' aplicaciones. Anterior: '+format(prior)+' en '+prior.count+' aplicaciones.'));
    });
    results.append(list);
   }
   const proposal=analytics.remediation(report,objective);
   if(!proposal){results.append(element('p','Ningún ítem con datos quedó bajo el umbral.'));return;}
   results.append(element('h4','Propuesta de recuperación para revisión docente'));
   if(proposal.objective)results.append(element('p','OA de la evaluación: '+proposal.objective));
   const list=element('ul');
   for(const row of proposal.priorities)list.append(element('li',row.label+' ('+row.percent+' %). '+row.guidance));
   results.append(list);
   const sequence=element('ol');
   for(const activity of proposal.activities)sequence.append(element('li',activity));
   results.append(sequence);
   const command=byId('studio-command');
   if(command)results.append(button('Preparar encargo en el asistente',()=>{
    if(command.value.trim()&&!confirm('¿Sustituir el texto pendiente del asistente por el encargo de recuperación?'))return;
    const issues=proposal.priorities.slice(0,8).map(item=>item.label+': '+item.guidance).join(' ');
    command.value='Adapta la evaluación para estudiantes con inasistencias. Prioriza '+issues+
     ' Usa consignas nuevas con el mismo OA, conserva la pauta separada y permite resolver sin internet.';
    for(let parent=command.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
    command.focus();
   }));
  }
  function execute(action){
   return async()=>{
    try{await action();}
    catch(error){
     if(signature!==expected){byId('heva-learning-analytics')?.querySelector('[role="status"]')?.replaceChildren(error.message);return;}
     state.textContent=error.message||'No se pudo completar la operación.';
    }
   };
  }
  const calculate=button('Calcular resultados',execute(()=>{renderReport(compute());state.textContent='Resultados recalculados.';}));
  const persist=newApplication=>execute(async()=>{
   const report=compute();
   const key=await analytics.recordKey(expected);
   if(signature!==expected)return;
   savedReport=analytics.save(localStorage,key,items,report.rows,report.threshold,{newApplication});
   renderReport(savedReport);
   newApplicationButton.disabled=false;
   state.textContent=newApplication?'Nueva aplicación guardada para comparar.':'Resultados agregados guardados en este navegador.';
  });
  const save=button('Guardar resultados',persist(false));
  const newApplicationButton=button('Guardar como nueva aplicación',persist(true));
  newApplicationButton.disabled=true;
  const download=button('Descargar resultados CSV',execute(()=>{
   const report=compute();
   if(!report.possible)throw Error('Agrega resultados antes de descargar.');
   HEVAOffice.download(new Blob([analytics.csv(report)],{type:'text/csv;charset=utf-8'}),'HEVA_resultados_agregados.csv');
   state.textContent='Resultados descargados.';
  }));
  const remove=button('Eliminar resultados guardados',execute(async()=>{
   validateCurrent();
   if(!confirm('¿Eliminar el registro agregado de esta versión en este navegador?'))return;
   const key=await analytics.recordKey(expected);
   if(signature!==expected)return;
   analytics.remove(localStorage,key);
   savedReport=null;newApplicationButton.disabled=true;
   for(const {count,earned,result} of controls){count.value='';earned.value='';result.textContent='Sin datos';}
   threshold.value='60';results.replaceChildren();state.textContent='Registro local eliminado.';
  }));
  actions.append(calculate,save,newApplicationButton,download,remove);
  if(window.HEVAMoodle){
   const moodle=button('Exportar alternativas para Moodle',execute(()=>{
    validateCurrent();
    const file=HEVAMoodle.exportQuiz(materialActual);
    const omitted=file.omitted.length?' Omitidas: '+file.omitted.join('; ')+'.':'';
    if(!file.exported)throw Error('No hay alternativas completas que exportar.'+omitted);
    HEVAOffice.download(new Blob([file.xml],{type:'application/xml;charset=utf-8'}),'HEVA_preguntas_moodle.xml');
    state.textContent=file.exported+' preguntas exportadas.'+omitted;
   }));
   actions.append(moodle);
  }

  panel.append(actions,state,results);
  let edited=false;
  panel.oninput=()=>{
   edited=true;results.replaceChildren();state.textContent='';
   for(const {result} of controls)result.textContent='—';
  };
  execute(async()=>{
   const key=await analytics.recordKey(expected);
   if(edited||signature!==expected)return;
   const saved=analytics.read(localStorage,key,items);
   if(!saved)return;
   savedReport=saved;newApplicationButton.disabled=false;
   saved.rows.forEach((row,index)=>{
    if(row.count){controls[index].count.value=row.count;controls[index].earned.value=row.earned;}
   });
   threshold.value=saved.threshold;renderReport(saved);
   state.textContent='Resultados agregados del registro local.';
  })();
 }
 const previous=renderizarDocumentoEnPantalla;
 renderizarDocumentoEnPantalla=function(...args){const result=previous.apply(this,args);mount();return result;};
 mount();
})();
