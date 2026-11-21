/* Herramientas docentes: vista previa compartida, edición, versiones y acceso. */
(function(){
'use strict';
const T=globalThis.HEVATeaching,byId=id=>document.getElementById(id);
let undo=[],reading=[],speechIndex=0,speechToken=0;
function element(tag,text,attrs={}){const x=document.createElement(tag);if(text!=null)x.textContent=text;for(const [key,value]of Object.entries(attrs))x.setAttribute(key,value);return x;}
function button(text,action){const b=element('button',text,{type:'button'});b.onclick=()=>{try{Promise.resolve(action()).catch(e=>alert(e.message))}catch(e){alert(e.message)}};return b;}
function dialog(title){const d=element('dialog',null,{class:'heva-teacher-dialog'});const close=button('Cerrar',()=>d.close());d.append(element('h2',title),close);d.addEventListener('close',()=>d.remove());document.body.append(d);return d;}
function current(){syncEdits();if(!materialActual)throw Error('Primero crea o abre un material.');return materialActual;}
function setMaterial(next){materialActual=next;if(next.revisionIA)next.revisionIA.estado='desactualizada_por_edicion';renderizarDocumentoEnPantalla();guardarEnHistorial(false);}
function checkpoint(){const m=current();guardarEnHistorial(false);undo.push(structuredClone(m));if(undo.length>20)undo.shift();}
const visualLabels={imagenes:'Imágenes de apoyo (portada e interiores)',diagramas:'Diagramas y líneas de tiempo',graficos:'Gráficos de datos',recuadros:'Recuadros y resaltados'};
function visualFields(initial,prefix,changed=()=>{}){const box=element('div'),inputs={};box.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0';const selected=HEVASlideDesign.options({recursosVisualesHEVA:initial});for(const [key,label]of Object.entries(visualLabels)){const row=element('label'),input=element('input',null,{type:'checkbox',id:prefix+'-'+key,'aria-label':label});input.checked=selected[key];row.append(input,document.createTextNode(' '+label));box.append(row);inputs[key]=input;}const read=()=>Object.fromEntries(Object.entries(inputs).map(([k,x])=>[k,x.checked]));const set=value=>{Object.values(inputs).forEach(x=>x.checked=value);changed(read());};Object.values(inputs).forEach(x=>x.onchange=()=>changed(read()));return{box,read,set};}
const placementNames={inicio:'Después de la activación inicial',explicacion:'Junto a la explicación del tema',actividad:'Junto a la primera actividad',final:'En el cierre del material'};
function imageCoverControl(value,id){
 const label=element('label');
 label.style.cssText='display:flex;align-items:center;gap:8px;margin:10px 0';
 const input=element('input',null,{type:'checkbox',id});
 input.checked=value===true;
 label.append(input,document.createTextNode('Permitir fotografía decorativa en portada (desactivado por defecto)'));
 return{box:label,read:()=>input.checked};
}
function imagePlacementControl(value,changed=()=>{},id='heva-image-placement'){
 const box=element('div');box.style.cssText='display:grid;gap:6px;margin:12px 0';
 const label=element('label','¿Dónde ubicar la imagen principal?',{for:id});
 const select=element('select',null,{id});select.style.cssText='width:100%;padding:8px;border:1px solid #b8aaa2;border-radius:6px;background:white';
 for(const [key,text] of Object.entries(placementNames))select.append(new Option(text,key));
 select.value=placementNames[value]?value:'explicacion';
 select.addEventListener('change',()=>changed(select.value));
 box.append(label,select,element('small','Solo afecta imágenes disponibles o añadidas por el docente. No agrega imágenes de internet automáticamente.'));
 return{box,read:()=>select.value};
}
function visualOptionsDialog(){
 const m=current(),d=dialog('Elegir recursos visuales');
 d.append(element('p','Elige imágenes, diagramas, gráficos y recuadros. La imagen principal se coloca donde indiques, cuando haya una imagen pertinente incorporada o disponible. Sin imagen, no se añade un espacio vacío.'));
 const fields=visualFields(HEVASlideDesign.options(m),'heva-visual-material');
 const position=imagePlacementControl(m.ubicacionImagenHEVA,()=>{},'heva-visual-placement-material');
 const cover=imageCoverControl(m.imagenPortadaHEVA,'heva-image-cover-material');
 d.append(fields.box,position.box,cover.box,button('Con recursos visuales',()=>fields.set(true)),button('Solo texto',()=>fields.set(false)),button('Aplicar y guardar opciones',()=>{
  checkpoint();m.recursosVisualesHEVA=fields.read();m.ubicacionImagenHEVA=position.read();m.imagenPortadaHEVA=cover.read();setMaterial(m);d.close();
 }));
 d.showModal();
}
function mountVisualForm(){
 if(byId('heva-visual-options-form'))return;
 let initial;try{initial=JSON.parse(localStorage.getItem('heva-recursos-visuales-v1')||'null')}catch{}
 let savedPlacement;try{savedPlacement=localStorage.getItem('heva-imagen-ubicacion-v1')||'explicacion'}catch{savedPlacement='explicacion'}
 const panel=element('details',null,{id:'heva-visual-options-form',class:'no-print border rounded p-3 my-3'});
 panel.append(element('summary','Recursos visuales opcionales y ubicación'),
 element('p','Las imágenes no son obligatorias. Decide si quieres fotos, diagramas, gráficos y recuadros, y dónde irá la imagen principal. Una fotografía de fuente externa solo se añade si está disponible y se ha comprobado su pertinencia y uso permitido.'));
 const fields=visualFields(initial||{},'heva-visual-nuevo',value=>{
  try{localStorage.setItem('heva-recursos-visuales-v1',JSON.stringify(value))}catch{}
 });
 const position=imagePlacementControl(savedPlacement,value=>{try{localStorage.setItem('heva-imagen-ubicacion-v1',value)}catch{}},'heva-image-placement-new');
 let coverSaved=false;try{coverSaved=localStorage.getItem('heva-imagen-portada-v1')==='true'}catch{}
 const cover=imageCoverControl(coverSaved,'heva-image-cover-new');cover.box.querySelector('input').addEventListener('change',()=>{try{localStorage.setItem('heva-imagen-portada-v1',String(cover.read()))}catch{}});
 let textbookSaved=true;try{textbookSaved=localStorage.getItem('heva-usar-textos-escolares-v1')!=='false'}catch{}
 const textbookLine=element('label');textbookLine.style.cssText='display:flex;align-items:flex-start;gap:8px;margin:12px 0';
 const textbookInput=element('input',null,{type:'checkbox',id:'heva-use-textbooks'});
 textbookInput.checked=textbookSaved;
 textbookLine.append(textbookInput,document.createTextNode('Consultar textos complementarios de Chile (Mineduc) y México (SEP) cuando coincidan con tema y OA EPJA'));
 const textbookNotice=element('p','Permite consultar catálogos educativos de Chile y México. No equipara cursos o campos formativos con niveles EPJA. Solo se usa contenido de documentos PDF efectivamente recuperados, pertinentes y verificados; nunca se copian libros completos.');
 textbookNotice.style.cssText='font-size:.83rem;color:#57534e';
 textbookInput.addEventListener('change',()=>{try{localStorage.setItem('heva-usar-textos-escolares-v1',String(textbookInput.checked))}catch{}});
 panel.append(textbookLine,textbookNotice,fields.box,position.box,cover.box,button('Con recursos para el material nuevo',()=>fields.set(true)),button('Solo texto para el material nuevo',()=>fields.set(false)));
 const anchor=byId('studio-documents');if(anchor)anchor.after(panel);else byId('panel-crear')?.append(panel);
 const previous=window.studioGenerationExtras;
 window.studioGenerationExtras=()=>({...previous?.(),recursosVisualesHEVA:fields.read(),usarTextosEscolares:textbookInput.checked});
}
function balanceAnswerKeys(){
 const m=current();
 if(!Array.isArray(m.preguntasAlternativas)||m.preguntasAlternativas.length<4)throw Error('Este material no contiene suficientes alternativas para equilibrar.');
 const before=HEVA.distribution(m);
 const adjusted=HEVA.balanceChoices(m);
 if(!adjusted.equilibrioClaves.aplicadas){alert('No se movieron alternativas. Puede que las respuestas ya estén equilibradas o que la pauta cite letras que deben revisarse manualmente.');return;}
 checkpoint();
 if(adjusted.revisionIA)adjusted.revisionIA.estado='desactualizada_por_edicion';
 setMaterial(adjusted);
 const after=HEVA.distribution(adjusted);
 alert('Claves reordenadas: '+adjusted.equilibrioClaves.aplicadas+' ítems. Antes '+JSON.stringify(before.counts)+'; ahora '+JSON.stringify(after.counts)+'. Comprueba la pauta antes de usar el material.');
}
function scoring(){const m=current();if(m.tipoMaterial!=='EVALUACION')throw Error('Abre una prueba para asignar puntajes.');const d=dialog('Asignar puntajes a la prueba'),rows=[];d.append(element('p','Elige 1, 2 o 3 puntos por pregunta. Conserva las preguntas y las claves. Los niveles de las rúbricas se ponderan proporcionalmente; pueden dar puntajes parciales fraccionarios.'));
const summary=element('p','',{role:'status'}),update=()=>summary.textContent='Puntaje total: '+rows.reduce((n,r)=>n+Number(r.select.value),0)+' puntos';
for(const item of HEVAAssessment.items(m)){const row=element('label',item.label+' · '+String(item.q.enunciado||item.q.preguntaReflexion||item.q.consigna||item.q.texto||'').slice(0,95)),select=element('select',null,{'aria-label':'Puntaje '+item.label});for(const n of [1,2,3])select.append(new Option(n+' '+(n===1?'punto':'puntos'),n));select.value=item.points;select.onchange=update;row.append(select);d.append(row);rows.push({...item,select});}
d.append(summary);for(const n of [1,2,3])d.append(button('Todas con '+n,()=>{rows.forEach(r=>r.select.value=n);update()}));d.append(button('Guardar puntajes',()=>{checkpoint();rows.forEach(r=>r.q.puntajeDocente=Number(r.select.value));m.puntajeTotal=HEVAAssessment.totalScore(m);setMaterial(m);d.close()}));update();d.showModal();}
function chartPreview(item){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 560 350');svg.setAttribute('role','img');svg.setAttribute('aria-label','Gráfico de barras de '+item.data[0].name);svg.style.cssText='width:100%;height:100%;overflow:visible';const series=item.data[0],max=Math.max(1,...series.values),step=320/series.values.length;series.values.forEach((v,i)=>{const y=i*step+20,bar=document.createElementNS(ns,'rect');bar.setAttribute('x','180');bar.setAttribute('y',String(y));bar.setAttribute('width',String(v/max*280));bar.setAttribute('height',String(Math.min(32,step*.6)));bar.setAttribute('fill','#'+(item.chartColors?.[0]||'8B2635'));svg.append(bar);for(const [value,x]of [[series.labels[i],0],[String(v),180+v/max*280+8]]){const t=document.createElementNS(ns,'text');t.setAttribute('x',String(x));t.setAttribute('y',String(y+22));t.setAttribute('font-size','19');t.setAttribute('font-family','Arial');t.textContent=value;svg.append(t);}});return svg;}
function preview(){const m=current(),view=HEVAOffice.preview(m,!!byId('incluir-pauta')?.checked),d=dialog('Vista previa de PowerPoint');d.append(element('p',view.limitation));const summary=view.visualSummary;if(summary){d.append(element('p','Interior: '+summary.interiorPages+' diapositivas · '+summary.interiorImages+' imágenes · '+summary.charts+' gráficos · '+summary.diagrams+' diagramas.'));if(!summary.interiorImages)d.append(element('p','Esta presentación no tiene imágenes interiores. Puedes incorporarlas desde Editar y ordenar bloques. La biblioteca automática actual cubre intercambio económico/globalización, diálogo y germinación.'));}for(const [i,page]of view.pages.entries()){
 const wrapper=element('section',null,{class:'heva-slide-wrapper','aria-label':'Diapositiva '+(i+1)}),canvas=element('div',null,{class:'heva-slide-canvas'});canvas.style.backgroundColor='#'+page.background.color;
 for(const item of page.elements){const x=element(item.kind==='image'?'img':'div',item.kind==='text'?item.text:null);if(item.kind==='image'){x.src=item.data;x.alt=item.altText||'';}x.style.cssText=`position:absolute;left:${item.x/view.width*100}%;top:${item.y/view.height*100}%;width:${item.w/view.width*100}%;height:${item.h/view.height*100}%;box-sizing:border-box;`;
 if(item.kind==='text'){Object.assign(x.style,{fontSize:(item.fontSize||20)*96/72+'px',fontFamily:(item.fontFace||'Arial')+', Arial, sans-serif',fontWeight:item.bold?'700':'400',color:'#'+(item.color||'302723'),whiteSpace:'pre-wrap',lineHeight:'1.18',textAlign:item.align||'left',display:'flex',alignItems:item.valign==='top'?'flex-start':'center',justifyContent:item.align==='right'?'flex-end':item.align==='center'?'center':'flex-start',padding:(item.margin||0)*96+'px'});}
 else if(item.kind==='chart')x.append(chartPreview(item));else if(item.kind==='image')x.style.objectFit='cover';else if(item.shape==='line')x.style.borderTop='1px solid #'+(item.line?.color||'DDCDBE');else{x.style.backgroundColor='#'+(item.fill?.color||'FFFFFF');if(item.line?.color&&item.line.transparency!==100)x.style.border=((item.line.width||1)*96/72)+'px solid #'+item.line.color;if(item.shape==='roundRect')x.style.borderRadius='12px';if(item.shape==='downArrow')x.style.clipPath='polygon(30% 0,70% 0,70% 55%,100% 55%,50% 100%,0 55%,30% 55%)';}
 canvas.append(x);}
 wrapper.append(canvas);d.append(wrapper);
 const resize=()=>{const scale=Math.min(1,wrapper.clientWidth/1280);canvas.style.transform='scale('+scale+')';wrapper.style.height=720*scale+'px';};const observer=new ResizeObserver(resize);observer.observe(wrapper);d.addEventListener('close',()=>observer.disconnect(),{once:true});}
 d.showModal();}
async function localSlideImage(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>3*1024*1024)throw Error('Elige una imagen JPG, PNG o WebP de hasta 3 MB.');
 const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('No se pudo leer la imagen.'));r.readAsDataURL(file);});
 const img=await new Promise((resolve,reject)=>{const x=new Image();x.onload=()=>resolve(x);x.onerror=()=>reject(Error('El archivo no se pudo interpretar como imagen.'));x.src=data;});
 const scale=Math.min(1,960/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('El navegador no pudo preparar la imagen.');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
 const value={data:canvas.toDataURL('image/jpeg',.78),width:canvas.width,height:canvas.height,alt:file.name.replace(/\.[^.]+$/,''),generated:false};if(!HEVASlideDesign.image(value))throw Error('La imagen preparada supera el tamaño admitido.');return value;
}
function renderGuideResources(){document.querySelectorAll('[data-heva-vbox]').forEach(x=>{x.style.backgroundColor='';x.style.borderLeft='';x.style.padding='';x.removeAttribute('data-heva-vbox');});document.querySelectorAll('.heva-guide-visual-preview').forEach(x=>x.remove());if(!materialActual||!HEVAGuideVisuals.enabled(materialActual))return;const m=materialActual,theme=HEVATemplates.layout(m).theme,blocks=HEVAGuideVisuals.plan(m,HEVA.blocks(m,false),globalThis.HEVAContextAssets);for(const b of blocks){const v=b.guideVisual;if(!v)continue;const anchor=b.path?[...document.querySelectorAll('[data-heva-path]')].find(x=>x.dataset.hevaPath===b.path):b.title==='Lectura'?byId('doc-lectura'):null;if(!anchor)continue;if(v.box){anchor.setAttribute('data-heva-vbox','true');Object.assign(anchor.style,{backgroundColor:'#'+theme.background,borderLeft:'4px solid #'+theme.main,padding:'8px 12px'});}if(!v.image&&!v.chart&&!v.diagram)continue;const fig=element('figure',null,{class:'heva-guide-visual-preview no-print'});fig.style.cssText='margin:14px 0;padding:12px;border:1px solid #ddd';fig.append(element('figcaption','Apoyo visual de la guía · Word y PPT'));
 if(v.image){const img=element('img',null,{src:v.image.data,alt:v.image.alt});img.style.cssText='display:block;max-width:100%;max-height:260px;margin:10px auto;object-fit:contain';fig.append(img,element('p',v.image.generated?'Imagen ilustrativa generada para HEVA.':v.image.alt));}
 if(v.chart){const chart=element('div');chart.style.cssText='height:250px;max-width:620px';chart.append(chartPreview({data:[{name:v.chart.unit,labels:v.chart.labels,values:v.chart.values}],chartColors:[theme.main]}));fig.append(chart);}
 if(v.diagram)v.diagram.lines.forEach((text,i)=>{if(i)fig.append(element('p','↓'));const node=element('p',text);node.style.cssText='padding:10px;border:1px solid #bbb;background:#'+theme.background;fig.append(node);});anchor.after(fig);}}
function guideImage(){const m=current();if(!HEVAGuideVisuals.enabled(m))throw Error('Abre una guía, taller o versión accesible.');const d=dialog('Imagen de apoyo de la guía');d.append(element('p','La imagen se incorpora después de la lectura tanto en Word como al convertir la guía a PPT. Si no hay lectura, aparece al final del contenido. Se guarda una versión anterior. La biblioteca automática solo cubre tres temas; puedes elegir una imagen propia para los demás.'));
 const label=element('label','Elegir JPG, PNG o WebP (hasta 3 MB)'),input=element('input',null,{type:'file',accept:'image/jpeg,image/png,image/webp','aria-label':'Imagen de apoyo de la guía'});label.append(input);d.append(label);
 input.onchange=async()=>{if(!input.files?.[0])return;try{input.disabled=true;const image=await localSlideImage(input.files[0]);if(materialActual!==m||!d.open)throw Error('El material cambió. Abre nuevamente esta opción.');checkpoint();m.imagenGuiaHEVA=image;m.ocultarImagenGuiaHEVA=false;setMaterial(m);d.close();guideImage();}catch(e){alert(e.message);}finally{input.disabled=false;}};
 const image=HEVASlideDesign.image(m.imagenGuiaHEVA);if(image){const img=element('img',null,{src:image.data,alt:image.alt});img.style.cssText='max-width:240px;max-height:180px;object-fit:contain';d.append(img);const label=element('label','Descripción y procedencia de la imagen'),text=element('textarea');text.value=image.alt;label.append(text);d.append(label,button('Guardar descripción',()=>{checkpoint();m.imagenGuiaHEVA.alt=text.value.slice(0,300);setMaterial(m);d.close();}));}
 d.append(button('Quitar imágenes de apoyo de esta guía',()=>{checkpoint();delete m.imagenGuiaHEVA;m.ocultarImagenGuiaHEVA=true;setMaterial(m);d.close();}),button('Usar imagen automática si corresponde',()=>{checkpoint();delete m.imagenGuiaHEVA;m.ocultarImagenGuiaHEVA=false;setMaterial(m);d.close();}));d.showModal();}
function guideImageButton(){const b=button('Imagen de apoyo de la guía',guideImage);b.id='heva-guide-image-action';return b;}
function edit(){const m=current(),d=dialog('Editar y ordenar bloques');d.append(element('p','Cada cambio conserva una versión anterior. Mover mantiene la pauta y las referencias de las tareas.'));if(m.tipoMaterial==='PRESENTACION')d.append(element('p','Para comparar cantidades, escribe una fila por línea, por ejemplo: Grupo A: 8 personas y Grupo B: 12 personas. Con dos a seis filas comparables, HEVA puede mostrar un gráfico de barras. Unidades admitidas: %, personas, días, kg, unidades o pesos.'));
 for(const [field,label]of Object.entries({diapositivas:'Diapositivas',preguntasAlternativas:'Alternativas',preguntasDesarrollo:'Desarrollo',casosEstudio:'Casos',actividadesGuiadas:'Práctica guiada'})){
 if(!m[field]?.length)continue;const section=element('section');section.append(element('h3',label));m[field].forEach((item,index)=>{const row=element('div',null,{class:'heva-edit-row'});row.append(element('strong',(index+1)+'. '+(item.titulo||item.enunciado||item.consigna||item.preguntaReflexion||label).slice(0,110)));
 const up=button('Subir',()=>{checkpoint();setMaterial(T.move(materialActual,field,index,-1));d.close();edit()}),down=button('Bajar',()=>{checkpoint();setMaterial(T.move(materialActual,field,index,1));d.close();edit()});up.disabled=index===0;down.disabled=index===m[field].length-1;row.append(up,down);
 const fields=field==='diapositivas'?['titulo','contenido','notasDocente']:field==='casosEstudio'?['titulo','contextoReal','preguntaReflexion','criterioEvaluacion']:field==='actividadesGuiadas'?['consigna','apoyo','productoEsperado']:['enunciado',field==='preguntasAlternativas'?'justificacion':'criterioEvaluacion'];
 if(field==='diapositivas'){
 const label=element('label','Imagen para esta diapositiva · JPG, PNG o WebP (hasta 3 MB)'),file=element('input',null,{type:'file',accept:'image/jpeg,image/png,image/webp','aria-label':'Imagen diapositiva '+(index+1)});label.append(file);row.append(label);
 file.onchange=async()=>{if(!file.files?.[0])return;try{file.disabled=true;const image=await localSlideImage(file.files[0]);if(materialActual!==m||!d.open)throw Error('El material cambió. Abre el editor y vuelve a elegir la imagen.');checkpoint();materialActual.diapositivas[index].imagenHEVA=image;materialActual.diapositivas[index].ocultarImagenHEVA=false;setMaterial(materialActual);d.close();edit();}catch(e){alert(e.message);}finally{file.disabled=false;}};
 if(HEVASlideDesign.image(item.imagenHEVA)){const img=element('img',null,{src:item.imagenHEVA.data,alt:item.imagenHEVA.alt||'Imagen de la diapositiva'});img.style.cssText='max-width:180px;max-height:130px;object-fit:contain';row.append(img);const l=element('label','Descripción accesible'),a=element('textarea');a.value=item.imagenHEVA.alt||'';l.append(a);row.append(l,button('Guardar descripción de imagen',()=>{checkpoint();materialActual.diapositivas[index].imagenHEVA.alt=a.value.slice(0,300);setMaterial(materialActual);d.close();edit();}));}
 row.append(button('Quitar imagen de esta diapositiva',()=>{checkpoint();delete materialActual.diapositivas[index].imagenHEVA;materialActual.diapositivas[index].ocultarImagenHEVA=true;setMaterial(materialActual);d.close();edit();}),button('Usar imagen automática si corresponde',()=>{checkpoint();delete materialActual.diapositivas[index].imagenHEVA;materialActual.diapositivas[index].ocultarImagenHEVA=false;setMaterial(materialActual);d.close();edit();}));
 }
 const inputs=[];for(const key of fields){const l=element('label',key==='notasDocente'?'Notas docentes (no visibles en diapositiva)':key),input=element('textarea');input.value=Array.isArray(item[key])?item[key].join('\n'):item[key]||'';l.append(input);row.append(l);inputs.push([key,input]);}
 row.append(button('Guardar este bloque',()=>{checkpoint();for(const [key,input]of inputs)materialActual[field][index][key]=key==='contenido'?input.value.split('\n').filter(Boolean):input.value;setMaterial(materialActual);d.close();edit()}));section.append(row);});d.append(section);}
 d.showModal();}
function compare(){const m=current(),history=readHistory();if(!history)return;const versions=history.filter(x=>m.materialId&&x.data.materialId===m.materialId&&HEVAAudit.snapshot(x.data)!==HEVAAudit.snapshot(m));const d=dialog('Comparar versiones');if(!versions.length){d.append(element('p','No hay una versión anterior distinta de este material. Guarda una versión antes de editar o corregir.'));d.showModal();return;}
 const select=element('select',null,{'aria-label':'Versión anterior'});versions.forEach((v,i)=>select.append(new Option('Versión '+(v.data.version||1)+' · '+v.fecha,String(i))));const output=element('div');const render=()=>{output.replaceChildren();const changes=T.diff(versions[Number(select.value)].data,m,HEVAPedagogy);if(!changes.length)output.append(element('p','Sin diferencias en los bloques visibles.'));for(const change of changes){const section=element('section',null,{class:'heva-diff'});section.append(element('h3',change.tipo+' · '+change.titulo));const grid=element('div',null,{class:'heva-diff-grid'});for(const [label,text]of [['Antes',change.antes],['Ahora',change.despues]]){const col=element('div');col.append(element('strong',label),element('pre',text||'Sin contenido'));grid.append(col);}section.append(grid);output.append(section);}};select.onchange=render;d.append(select,output);render();d.showModal();}
function validatedAccess(raw={}){return {contraste:raw.contraste===true,letraGrande:raw.letraGrande===true,tamano:Math.min(24,Math.max(14,Number(raw.tamano)||16)),espaciado:Math.min(.2,Math.max(0,Number(raw.espaciado)||0)),interlineado:Math.min(2,Math.max(1.2,Number(raw.interlineado)||1.5)),fuente:raw.fuente==='Verdana'?'Verdana':'Arial'};}
let access;try{access=validatedAccess(JSON.parse(localStorage.getItem('heva-acceso-v1')||'{}'));}catch{access=validatedAccess();}
function applyAccess(){const sheet=byId('hoja-material');sheet.classList.add('heva-access');sheet.classList.toggle('heva-access-contrast',access.contraste);sheet.style.setProperty('--heva-reader-size',access.tamano+'px');sheet.style.setProperty('--heva-reader-space',access.espaciado+'em');sheet.style.setProperty('--heva-reader-line',String(access.interlineado));sheet.style.setProperty('--heva-reader-font',access.fuente);}
function accessibility(){const d=dialog('Accesibilidad de lectura y exportación');d.append(element('p','Los ajustes de pantalla se recuerdan en este navegador. Usa Aplicar al material para conservarlos también en Word y PowerPoint. El espaciado y el interlineado se exportan a Word; PowerPoint usa su distribución de diapositivas.'));
 const fields=[];for(const [key,label,min,max,step]of [['tamano','Tamaño de letra',14,24,1],['espaciado','Espaciado de letras',0,.2,.02],['interlineado','Interlineado',1.2,2,.1]]){const l=element('label',label),input=element('input',null,{type:'number',min,max,step});input.value=access[key];l.append(input);d.append(l);fields.push([key,input]);}
 for(const [key,label]of [['contraste','Alto contraste'],['letraGrande','Letra grande en exportaciones']]){const l=element('label',label),input=element('input',null,{type:'checkbox'});input.checked=access[key];l.prepend(input);d.append(l);fields.push([key,input]);}
 const font=element('select',null,{'aria-label':'Tipografía'});for(const name of ['Arial','Verdana'])font.append(new Option(name,name));font.value=access.fuente;d.append(font);fields.push(['fuente',font]);
 const save=()=>{const value={};fields.forEach(([key,input])=>value[key]=input.type==='checkbox'?input.checked:input.value);access=validatedAccess(value);try{localStorage.setItem('heva-acceso-v1',JSON.stringify(access));}catch{alert('No se pudo recordar el ajuste en este navegador. Se aplica a esta sesión.');}applyAccess();};
 d.append(button('Guardar ajustes de pantalla',()=>{save();d.close()}),button('Aplicar al material y exportaciones',()=>{save();checkpoint();materialActual.accesibilidadVisual={...access};setMaterial(materialActual);d.close()}));d.showModal();}
function stopSpeech(){speechToken++;globalThis.speechSynthesis?.cancel();reading=[];}
function speak(){if(!globalThis.speechSynthesis||!globalThis.SpeechSynthesisUtterance){alert('Este navegador no dispone de lectura en voz alta.');return;}const m=current(),d=dialog('Escuchar el material');d.append(element('p','Lee solo el ejemplar del estudiante. La disponibilidad de voces y su funcionamiento sin conexión dependen del equipo.'));
 const voice=element('select',null,{'aria-label':'Voz'}),rate=element('input',null,{type:'number',min:'.5',max:'1.5',step:'.1',value:'.9','aria-label':'Velocidad'});function voices(){voice.replaceChildren();const list=speechSynthesis.getVoices().filter(x=>/^es/i.test(x.lang));for(const v of list)voice.append(new Option(v.name+' · '+v.lang,v.voiceURI));const cl=list.find(x=>/^es[-_]CL$/i.test(x.lang));if(cl)voice.value=cl.voiceURI;}voices();speechSynthesis.addEventListener('voiceschanged',voices);d.addEventListener('close',()=>{stopSpeech();speechSynthesis.removeEventListener('voiceschanged',voices)},{once:true});
 const status=element('p','Listo para leer.',{role:'status'});d.append(voice,rate,button('Leer desde el inicio',()=>{stopSpeech();const token=speechToken;reading=HEVAPedagogy.blocks(m,false).flatMap(x=>[x.title,x.text]).join('. ').match(/[^.!?]+[.!?]?/g)?.flatMap(x=>x.match(/.{1,220}(?:\s|$)|.{1,220}/g)||[])||[];speechIndex=0;const next=()=>{if(token!==speechToken)return;if(speechIndex>=reading.length){status.textContent='Lectura terminada.';return;}const u=new SpeechSynthesisUtterance(reading[speechIndex++]);u.lang='es-CL';u.rate=Math.min(1.5,Math.max(.5,Number(rate.value)||.9));u.voice=speechSynthesis.getVoices().find(v=>v.voiceURI===voice.value)||null;u.onend=next;u.onerror=()=>{status.textContent='La voz no pudo continuar. Prueba otra voz del equipo.';};status.textContent='Leyendo fragmento '+speechIndex+' de '+reading.length;speechSynthesis.speak(u);};next();}),button('Pausar',()=>speechSynthesis.pause()),button('Continuar',()=>speechSynthesis.resume()),button('Detener',()=>{stopSpeech();status.textContent='Lectura detenida.';}),status);d.showModal();}
function showDepthAdvisories(bar){
 let box=byId('heva-depth-advisories');
 const issues=materialActual?.controlProfundidadHEVA;
 if(!Array.isArray(issues)||!issues.length){if(box)box.remove();return;}
 if(!box){box=element('details',null,{id:'heva-depth-advisories'});bar.append(box);}
 box.replaceChildren(element('summary','Revisión de profundidad pedagógica · '+issues.length+' observaciones'));
 box.append(element('p','Control orientativo, no equivale a revisión disciplinar ni certifica la calidad del material.'));
 for(const issue of issues.slice(0,12))box.append(element('p',String(issue.detail||'Pendiente de revisión')));
}
function showMetalSources(bar){
 let panel=byId('heva-metal-sources');
 const ref=materialActual?.referenciasMetalmecanica;
 if(!ref?.aplica){if(panel)panel.remove();return;}
 if(!panel){panel=element('details',null,{id:'heva-metal-sources'});bar.append(panel);}
 const titles=Array.isArray(ref.modules)?ref.modules.map(m=>m.id+' · '+m.title).join(' | '):'';
 panel.replaceChildren(element('summary','Referencias técnicas comparadas · Construcciones Metálicas'),element('p','Módulos chilenos relacionados: '+(titles||'Sin correspondencia automática. Revisar OA seleccionado.')));
 const known=new Set([
 'https://www.curriculumnacional.cl/docente/629/w3-article-34329.html',
 'https://www.todofp.es/que-estudiar/familias-profesionales/fabricacion-mecanica/construcciones-metalicas.html',
 'https://educacion.gob.ec/wp-content/uploads/downloads/2017/08/oferta-formativa-de-bachillerato-tecnico.pdf',
 'https://www.sena.edu.co/es-co/Documents/CONVOCATORIA-CHIEF-EXPERT-HABILIDAD-FINAL-10-de-marzo.pdf',
 'https://www.inet.edu.ar/wp-content/uploads/2013/04/15-07-anexo07.pdf',
 'https://www.conalep.edu.mx/sites/default/files/micrositios/Mapa_Curricular_2025/MC25_Soldaduras%20Industriales.pdf'
 ]);
 for(const item of Array.isArray(ref.sources)?ref.sources:[]){
  if(!known.has(item.url))continue;
  const p=element('p'),link=element('a',(item.country||'?')+' · '+item.title,{href:item.url,target:'_blank',rel:'noopener noreferrer'});
  p.append(link,document.createTextNode(item.country==='CL'?' · Referencia curricular chilena prioritaria':' · Apoyo temático extranjero; contenidos y páginas por verificar'));panel.append(p);
 }
 panel.append(element('p','La correspondencia es orientativa: NO constituye homologación de títulos, niveles ni OA. No sustituye procedimientos de seguridad ni la revisión de un docente especialista.'));
}
function showTPDocumentEvidence(bar){
 let panel=byId('heva-tp-document-evidence');
 const data=materialActual?.trazabilidadDocumentalTP;
 if(!data||data.status==='no_aplica'){if(panel)panel.remove();return;}
 if(!panel){panel=element('details',null,{id:'heva-tp-document-evidence'});bar.append(panel);}
 const items=Array.isArray(data.fragments)?data.fragments:[];
 panel.replaceChildren(element('summary','Evidencia documental · Construcciones Metálicas ('+items.length+' fragmentos recuperados)'));
 panel.append(element('p',items.length?'Fragmentos extraídos automáticamente; requieren contrastar contenido con página original y validación docente.':'No se recuperó contenido técnico citables en esta consulta. Los catálogos no sustituyen la evidencia.'));
 for(const f of items){
  const para=element('p');
  para.append(document.createTextNode((f.title||'Documento')+' · PDF pág. '+f.page+(f.pageEnd&&f.pageEnd!==f.page?'–'+f.pageEnd:'')+' · '+(f.status||'Por revisar')));
  if(typeof f.url==='string'&&/^https:\/\/(aprendoenlinea\.mineduc\.gob\.cl|www\.curriculumnacional\.cl)\//.test(f.url)){
   const link=element('a',' · Abrir fuente',{href:f.url,target:'_blank',rel:'noopener noreferrer'});para.append(link);
  }
  panel.append(para);
 }
 const visuals=materialActual?.planVisualTP;
 if(visuals?.items?.length)panel.append(element('p','Propuestas de diagramas ('+visuals.items.length+'): '+visuals.items.map(x=>x.description).join(' · ')+'. No son imágenes extraídas de los libros. Licencias de imágenes externas pendientes.'));
 panel.append(element('p','Este panel no certifica revisión visual de los PDF, licencias ni aprobación de un especialista.'));
}
function showTextbookCandidates(bar){
 let refs=byId('heva-textbook-references');
 const record=materialActual?.textosEscolaresComplementarios;
 if(!record?.enabled){if(refs)refs.remove();return;}
 if(!refs){refs=element('details',null,{id:'heva-textbook-references'});bar.append(refs);}
 const status=record.status==='candidata_por_tema_oa_pendiente_libro_y_pagina'?'Coincidencia preliminar por tema y OA, pendiente de verificar PDF, capítulos, páginas y equivalencia pedagógica.':'No se identificó una coincidencia documental suficiente para esta asignatura y OA.';
 refs.replaceChildren(element('summary','Textos escolares de apoyo · referencias para revisar'),element('p',status));
 for(const item of Array.isArray(record.items)?record.items:[]){
  if(!['https://www.librosdelmineduc.cl/educacion-basica/','https://www.librosdelmineduc.cl/educacion-media/','https://www.curriculumnacional.cl/textos_escolares','https://aprendoenlinea.mineduc.gob.cl/','https://aprendoenlinea.mineduc.gob.cl/recursos/historia-geografia-ciencias-sociales-1-medio-santillana-texto-estudiante','https://aprendoenlinea.mineduc.gob.cl/recursos/matematica-7o-basico-sm-texto-estudiante','https://libros.conaliteg.gob.mx/primaria_2024.html','https://libros.conaliteg.gob.mx/secundaria_2024.html','https://libros.conaliteg.gob.mx/telesecundaria_2024.html'].includes(item.url))continue;
  const para=element('p'),link=element('a',item.title||'Referencia',{href:item.url,target:'_blank',rel:'noopener noreferrer'});
  para.append(link,document.createTextNode(' · '+(item.country==='MX'?'Catálogo oficial SEP México · libro y página pendientes de verificación':['indice_oficial','ficha_texto_oficial'].includes(item.role)?'Ficha o catálogo ministerial Chile':'Catálogo de terceros, no acredita autoría de los archivos')));refs.append(para);
 }
 refs.append(element('p','No se ha copiado ni reproducido contenido del libro. Las fuentes oficiales efectivamente recuperadas por HEVA se registran por separado.'));
}
function mount(){let bar=byId('heva-teacher-tools');if(!bar){bar=element('section',null,{id:'heva-teacher-tools',class:'no-print'});bar.append(element('h3','Revisar y adaptar el material'),button('Vista previa PPT',preview),button('Recursos visuales · con o sin',visualOptionsDialog),button('Asignar puntajes · 1, 2 o 3',scoring),button('Equilibrar claves A–D',balanceAnswerKeys),button('Editar y ordenar bloques',edit),guideImageButton(),button('Comparar versiones',compare),button('Deshacer último cambio',()=>{if(!undo.length)return;const previous=undo.at(-1),m=current();if(previous.materialId!==m.materialId)throw Error('El último cambio corresponde a otro material. Abre su historial para recuperarlo.');undo.pop();guardarEnHistorial(false);setMaterial(previous)}),button('Accesibilidad',accessibility),button('Escuchar',speak));byId('hoja-material').before(bar);}bar.hidden=!materialActual;showTextbookCandidates(bar);showMetalSources(bar);showTPDocumentEvidence(bar);showDepthAdvisories(bar);renderGuideResources();const guideAction=byId('heva-guide-image-action');if(guideAction)guideAction.hidden=!HEVAGuideVisuals.enabled(materialActual||{});const buttons=[...bar.querySelectorAll('button')];const scoreButton=buttons.find(b=>b.textContent.includes('Asignar puntajes'));if(scoreButton)scoreButton.hidden=materialActual?.tipoMaterial!=='EVALUACION';const balanceButton=buttons.find(b=>b.textContent.includes('Equilibrar claves'));if(balanceButton)balanceButton.hidden=!['GUIA','EVALUACION','ACCESIBLE'].includes(materialActual?.tipoMaterial)||!(materialActual?.preguntasAlternativas?.length>=4);const previewButton=buttons.find(b=>b.textContent.includes('Vista previa PPT'));if(previewButton)previewButton.hidden=materialActual?.tipoMaterial!=='PRESENTACION';applyAccess();
 if(materialActual){const report=T.inspect(materialActual);let summary=byId('heva-teaching-report');if(!summary){summary=element('details',null,{id:'heva-teaching-report'});bar.append(summary);}summary.replaceChildren(element('summary','Desempeño del OA y actividades · orientación docente'),element('p',report.alcance));for(const x of report.actividades)summary.append(element('p',x.ref+' · '+(x.cognicion?.nivel||'Nivel no inferido: revisar desempeño')));for(const issue of report.issues)summary.append(element('p',issue.detail));}}
const oldRender=renderizarDocumentoEnPantalla;renderizarDocumentoEnPantalla=function(){oldRender();mount()};
const oldGenerate=generarMaterialReal;generarMaterialReal=async function(...args){
 const priorMaterial=materialActual;
 let requestedPlace='explicacion';try{requestedPlace=localStorage.getItem('heva-imagen-ubicacion-v1')||'explicacion'}catch{}
if(navigator.onLine===false){const form=[...document.querySelectorAll('#panel-crear input[id],#panel-crear select[id],#panel-crear textarea[id]')].filter(x=>!['password','file','hidden'].includes(x.type)&&!/key|token|secret|clave/i.test(x.id)).map(x=>({id:x.id,value:x.value,checked:x.checked}));try{localStorage.setItem('heva-solicitud-pendiente-v1',JSON.stringify({fecha:new Date().toISOString(),form}));alert('Sin conexión: el encargo quedó guardado como solicitud pendiente, aún no generada. Al volver internet, recupera el encargo y pulsa Crear material. El material anterior se conserva.');}catch{alert('Sin conexión y sin espacio para guardar el encargo. Conserva los campos abiertos y vuelve a intentar al recuperar internet.');}pending();return;}const result=await oldGenerate(...args);
 if(materialActual&&materialActual!==priorMaterial&&['GUIA','TALLER','ACCESIBLE','PRESENTACION'].includes(materialActual.tipoMaterial)){
  materialActual.ubicacionImagenHEVA=placementNames[requestedPlace]?requestedPlace:'explicacion';
  try{materialActual.imagenPortadaHEVA=localStorage.getItem('heva-imagen-portada-v1')==='true'}catch{materialActual.imagenPortadaHEVA=false}
  guardarEnHistorial(false);
 }
 return result};
function pending(){let box=byId('heva-pending-request');let saved;try{saved=JSON.parse(localStorage.getItem('heva-solicitud-pendiente-v1')||'null')}catch{}if(!saved?.form)return;if(!box){box=element('aside',null,{id:'heva-pending-request',class:'no-print'});byId('panel-crear').prepend(box);}box.replaceChildren(element('p','Solicitud pendiente guardada. La generación requiere conexión y disponibilidad de IA.'),button('Recuperar encargo pendiente',async()=>{const fields=saved.form;for(const id of ['marco-curricular','nivel-epja']){const x=fields.find(f=>f.id===id);if(x&&byId(id))byId(id).value=x.value;}await actualizarTodoElCurriculo();const subject=fields.find(f=>f.id==='asignatura');if(subject){if(![...byId('asignatura').options].some(o=>o.value===subject.value))throw Error('La asignatura guardada no está disponible para este marco y nivel. Revisa el encargo; no se ha generado material.');byId('asignatura').value=subject.value;}await actualizarObjetivosYEstrategias();for(const x of fields){const el=byId(x.id);if(el){el.value=x.value;if(el.type==='checkbox'||el.type==='radio')el.checked=x.checked;}}byId('tipo-material').dispatchEvent(new Event('change'));mostrarContratoPedagogico();alert('Encargo recuperado. Revisa la selección y pulsa Crear material para generar.');}));}
window.addEventListener('online',pending);pending();mount();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountVisualForm,{once:true});else mountVisualForm();
})();
