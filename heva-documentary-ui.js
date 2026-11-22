/* Consulta de cobertura OA–textos: nunca atribuye una aprobación docente inexistente. */
(function(){
 'use strict';
 function mount(){
  const stage=document.getElementById('panel-staging');
  if(!stage||document.getElementById('heva-documentary-coverage'))return;
  const section=document.createElement('section');section.id='heva-documentary-coverage';
  section.className='bg-white border border-stone-200 rounded-lg p-5 space-y-3 no-print';
  const head=document.createElement('h3');head.textContent='Matriz OA EPJA · cobertura documental Chile y México';
  head.className='text-base font-bold text-[#8B2635]';
  const help=document.createElement('p');help.className='text-sm text-stone-700';
  help.textContent='Los OA aprobados en el catálogo no equivalen a libros revisados. Este inventario muestra referencias para consultar y qué evidencias siguen faltando.';
  const stats=document.createElement('p');stats.setAttribute('role','status');stats.className='text-sm';
  const controls=document.createElement('div');controls.className='flex flex-wrap gap-2';
  const category=document.createElement('select');category.className='border rounded p-2 text-sm';category.setAttribute('aria-label','Filtrar matriz documental por grupo curricular');
  const prev=document.createElement('button'),next=document.createElement('button');
  for(const [button,label] of [[prev,'Página anterior'],[next,'Página siguiente']]){button.type='button';button.textContent=label;button.className='border rounded p-2 text-sm';}
  const pageLabel=document.createElement('span');pageLabel.className='text-sm self-center';pageLabel.setAttribute('aria-live','polite');
  const data=document.createElement('div');data.className='overflow-x-auto';
  const table=document.createElement('table');table.className='min-w-full text-sm border-collapse';
  const header=table.createTHead().insertRow();for(const h of ['Código OA','Marco y asignatura','Referencia Chile','Referencia México','Revisión de libros']){const th=document.createElement('th');th.scope='col';th.textContent=h;th.className='text-left p-2 border-b';header.append(th);}
  const body=table.createTBody();data.append(table);
  controls.append(category,prev,pageLabel,next);
  const exportLink=document.createElement('a');
  exportLink.href='/data/matriz-documental-407-oa.csv';exportLink.download='matriz-documental-407-oa.csv';
  exportLink.className='inline-flex border rounded px-3 py-2 text-sm font-bold text-[#8B2635]';
  exportLink.textContent='Descargar matriz de 407 OA para revisión documental (CSV)';
  exportLink.setAttribute('aria-label','Descargar inventario de OA con columnas de revisión de libros pendientes');
  section.append(head,help,exportLink,stats,controls,data);
  stage.prepend(section);
  let page=1,loading=false;
  function link(parent,item,label){
   if(!item?.url){parent.textContent='Sin catálogo específico';return;}
   const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;a.className='underline text-[#8B2635]';parent.append(a);
   const note=document.createElement('small');note.className='block text-stone-600';note.textContent='Solo catálogo; libro y página por comprobar';parent.append(note);
  }
  async function load(){
   if(loading)return;loading=true;stats.textContent='Consultando inventario documental…';prev.disabled=true;next.disabled=true;
   try{
    const query=new URLSearchParams({pagina:String(page),limite:'20'});
    if(category.value)query.set('grupo',category.value);
    const response=await fetch('/api/oa-documentary-coverage?'+query.toString(),{headers:{Accept:'application/json'}});
    if(!response.ok)throw Error('No se pudo consultar la cobertura ('+response.status+').');
    const payload=await response.json();const summary=payload.resumen;
    if(!category.options.length){category.add(new Option('Todas las asignaturas',''));
     for(const group of Object.keys(summary.grupos||{}).sort())category.add(new Option(group+' · '+summary.grupos[group],group));}
    stats.textContent='OA publicados: '+summary.objetivosTotales+' · Decreto 257: '+(summary.marcos['Decreto 257']||0)+
     ' · Bases 2024: '+(summary.marcos['Bases 2024']||0)+
     ' · Libros cotejados por OA: '+summary.paginasLibroCotejadas+
     ' · Aprobaciones pedagógicas documentales: '+summary.aprobacionesPedagogicas+
     '. Los enlaces son candidatos, no libros revisados.';
    body.replaceChildren();
    for(const r of payload.registros||[]){
     const tr=body.insertRow();
     const code=tr.insertCell();code.textContent=r.oaCodigo;code.className='p-2 border-b break-all';
     const info=tr.insertCell();info.textContent=r.marco+' · '+r.asignatura+' · Nivel '+r.nivel;info.className='p-2 border-b';
     const cl=tr.insertCell();cl.className='p-2 border-b';link(cl,r.fuenteChileCandidata,'Catálogo Mineduc');
     const mx=tr.insertCell();mx.className='p-2 border-b';link(mx,r.fuenteMexicoCandidata,'CONALITEG · '+(r.fuenteMexicoCandidata?.campo||''));
     const review=tr.insertCell();review.className='p-2 border-b';review.textContent='Pendiente: libro, capítulo, página y validación docente';
    }
    pageLabel.textContent='Página '+page+' de '+Math.max(1,Math.ceil(payload.totalFiltrados/20));
    prev.disabled=page===1;next.disabled=page*20>=payload.totalFiltrados;
   }catch(error){stats.textContent='Inventario no disponible: '+error.message+'. Los materiales guardados no se modificaron.';}
   finally{loading=false;}
  }
  prev.onclick=()=>{if(page>1){page--;load();}};
  next.onclick=()=>{page++;load();};
  category.onchange=()=>{page=1;load();};
  document.getElementById('tab-staging')?.addEventListener('click',()=>load());
  // Si la pestaña ya es visible, mostrar datos inmediatamente.
  if(!stage.classList.contains('hidden'))load();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
