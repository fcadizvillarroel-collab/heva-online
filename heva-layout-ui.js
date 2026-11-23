(function(){
'use strict';
/* Interfaz progresiva. Solo mueve nodos existentes: no altera OA, formularios ni datos enviados. */
function mount(){
 const get=id=>document.getElementById(id);
 const panel=get('panel-crear'),type=get('tipo-material'),ppt=get('heva-ppt-temas');
 if(!panel||!type||!ppt||panel.dataset.hevaLayoutMounted==='1')return;
 panel.dataset.hevaLayoutMounted='1';
 const form=type.closest('div.bg-white')||type.closest('div')?.parentElement;
 if(!form)return;
 const topic=get('tema-especifico')?.closest('div');
 const strategy=get('estrategia-didactica')?.closest('div');
 const access=get('heva-access-details'),lab=get('integrated-lab');
 const design=get('heva-design-details'),depth=get('heva-depth-details');
 const counts=get('cant-alternativas')?.closest('div.border-t');
 // Mantener el tema inmediatamente después del objetivo, antes de la estrategia.
 const strategyBlock=strategy?.closest?.('#heva-unified-pedagogy')||strategy;
 if(topic&&strategyBlock&&strategyBlock.parentElement===topic.parentElement)strategyBlock.before(topic);
 // Las configuraciones secundarias se recogen en un único panel, cerrado al abrir.
 const advanced=document.createElement('details');
 advanced.id='heva-ajustes-adicionales';
 advanced.className='heva-options-fold';
 const summary=document.createElement('summary');
 summary.textContent='Diseño pedagógico y estrategias · opcional';
 summary.setAttribute('aria-label','Abrir diseño pedagógico antes de generar');
 advanced.append(summary);
 const help=document.createElement('p');
 help.className='heva-fold-hint';
 help.textContent='Una sola configuración, sin repetir el OA ni el tema. Puedes ajustar la profundidad y el contexto, añadir apoyos y combinar estrategias cuando corresponda. Si no cambias nada, HEVA utiliza su propuesta habitual.';
 advanced.append(help);
 // Los controles de diseño y profundidad los monta el flujo anterior. Se conservan sus ID y valores.
 // Orden didáctico: nivel de profundidad -> diseño de tareas -> apoyos -> combinaciones.
 if(depth){advanced.append(depth);depth.classList.add('heva-fold-nested');const d=depth.querySelector('summary');if(d)d.textContent='Profundidad y contextualización';}
 if(design){advanced.append(design);design.classList.add('heva-fold-nested');const d=design.querySelector('summary');if(d)d.textContent='Secuencia didáctica, habilidades y evaluación';}
 if(access){advanced.append(access);access.classList.add('heva-fold-nested');const d=access.querySelector('summary');if(d)d.textContent='Accesibilidad, adecuaciones y recuperación';}
 if(lab){advanced.append(lab);lab.classList.add('heva-fold-nested');const d=lab.querySelector('summary');if(d)d.textContent='Combinar estrategias complementarias · opcional';}
 const before=get('btn-generar');
 if(before)before.before(advanced);else form.append(advanced);
 // Preguntas/casos tras la estrategia y antes de los ajustes avanzados.
 if(counts&&counts.parentElement===form)advanced.before(counts);
 // Estilo visual de PPT solo pertinente cuando se pide presentación.
 ppt.classList.add('heva-ppt-conditional');
 ppt.setAttribute('aria-label','Diseño visual específico para PowerPoint');
 if(counts){counts.id='heva-conteos-material';counts.before(ppt);}else advanced.before(ppt);
 // Paso 3 siempre se presenta después de las opciones y justo antes del botón
 // Generar, aunque el panel avanzado se reubique al cargar la interfaz.
 const third=get('heva-stage-3');
 if(third&&before)before.before(third);
 const refresh=()=>{
  const isPpt=type.value==='PRESENTACION';
  ppt.hidden=!isPpt;
  ppt.style.display=isPpt?'':'none';
  ppt.setAttribute('aria-hidden',String(!isPpt));
  // El servidor no usa cantidades separadas en PowerPoint ni en planificación.
  const hasCounts=!['PRESENTACION','PLANIFICACION'].includes(type.value);
  if(counts){counts.hidden=!hasCounts;counts.style.display=hasCounts?'':'none';counts.setAttribute('aria-hidden',String(!hasCounts));}
  const helpEl=get('heva-context-material');
  if(helpEl&&!isPpt)helpEl.style.display='';
 };
 type.addEventListener('change',refresh);
 refresh();
 // Mostrar una indicación discreta cuando existen ajustes opcionales activos.
 const updateActive=()=>{
  const selected=[get('pie-lectura-facil'),get('pie-apoyos-visuales'),get('pie-graduacion'),get('lab-enabled')].filter(x=>x?.checked).length;
  summary.textContent='Diseño pedagógico y estrategias · opcional'+(selected?' · '+selected+' activo'+(selected===1?'':'s'):'');
 };
 advanced.addEventListener('change',updateActive);
 updateActive();
 // Auditoría permanece oculta hasta que se solicite explícitamente.
 const audit=get('informe-auditoria-heva'),auditButton=get('btn-auditoria');
 if(audit&&!get('heva-audit-fold')){
  const fold=document.createElement('details');
  fold.id='heva-audit-fold';fold.className='heva-audit-fold';
  const heading=document.createElement('summary');
  heading.textContent='Detalles de la revisión pedagógica';
  fold.append(heading);
  audit.before(fold);fold.append(audit);
  if(auditButton)auditButton.addEventListener('click',()=>{fold.open=true;});
 }
 // Eliminar dos anuncios permanentes duplicados del encabezado; mantener enlace como acción compacta.
 const badge=get('heva-proposal-badge');
 if(badge)badge.hidden=true;
 const banner=document.querySelector('body > div.no-print[style*="background:#f0f6ee"]');
 if(banner){banner.classList.add('heva-lab-banner-compact');const intro=banner.querySelector('span');if(intro&&!banner.querySelector('#heva-abrir-estrategias'))intro.hidden=true;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();