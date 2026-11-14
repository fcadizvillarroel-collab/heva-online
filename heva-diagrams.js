/* HEVA: organizadores visuales exportables sin servicios ni bibliotecas externas. */
(function(root){
 const escapeXML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&quot;'}[c]));
 const clean=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 function extract(m){
  if(!m||typeof m!=='object')throw Error('Primero genera o recupera un material.');
  const blocks=(root.HEVA&&root.HEVA.blocks)?root.HEVA.blocks(root.HEVA.material(m),false):[];
  const ignore=/^(pauta docente|respuesta|solucionario|clave|criterio de evaluaci[oó]n)/i;
  const nodes=blocks.filter(b=>b&&b.title&&!ignore.test(b.title)).map(b=>({title:clean(b.title).slice(0,72),text:clean(b.text).slice(0,140)})).filter(b=>b.title);
  if(nodes.length<2)throw Error('Se necesitan al menos dos secciones para elaborar el diagrama.');
  return {title:clean(m.titulo||'Organizador de aprendizaje').slice(0,110),nodes:nodes.slice(0,12)};
 }
 function svg(m,mode='mapa'){
  const d=extract(m),map=mode==='mapa',w=1000,step=map?116:122,h=150+d.nodes.length*step;
  const parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+escapeXML(d.title)+'"><rect width="100%" height="100%" fill="#fffbf5"/><text x="500" y="53" font-family="Arial,sans-serif" font-size="26" font-weight="bold" fill="#8b2635" text-anchor="middle">'+escapeXML(d.title)+'</text>'];
  d.nodes.forEach((n,i)=>{const y=90+i*step,x=map?(i%2?530:65):180,bw=map?405:640;
   if(i>0){const px=map?((i-1)%2?530:65):180,py=90+(i-1)*step;parts.push('<path d="M '+(px+(map?202:320))+' '+(py+80)+' L '+(x+bw/2)+' '+y+'" stroke="#a78b76" stroke-width="3" fill="none"/>')}
   parts.push('<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="88" rx="14" fill="'+(i%2?'#fef3c7':'#fce7e9')+'" stroke="#c4a99c" stroke-width="2"/>');
   parts.push('<text x="'+(x+16)+'" y="'+(y+27)+'" font-family="Arial,sans-serif" font-size="17" font-weight="bold" fill="#70252e">'+escapeXML(n.title.slice(0,39))+'</text>');
   const lines=n.text.match(/.{1,55}(?:\s|$)/g)||[];lines.slice(0,2).forEach((line,j)=>parts.push('<text x="'+(x+16)+'" y="'+(y+50+j*17)+'" font-family="Arial,sans-serif" font-size="13" fill="#44403c">'+escapeXML(line.trim().slice(0,55))+'</text>'));
  });return parts.join('')+'</svg>';
 }
 function mermaid(m){const d=extract(m);return 'flowchart TD\n  A["'+d.title.replace(/["\[\]]/g,'')+'"]\n'+d.nodes.map((n,i)=>'  N'+i+'["'+n.title.replace(/["\[\]]/g,'')+'"]\n  '+(i?'N'+(i-1):'A')+' --> N'+i).join('\n')+'\n'}
 function download(text,name,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
 function current(){return typeof materialActual!=='undefined'?materialActual:root.materialActual}
 function mount(){const anchor=document.getElementById('btn-pptx');if(!anchor)return;const b=document.createElement('button');b.type='button';b.textContent='Diagramas y mapas';b.className='px-3 py-1.5 border border-amber-700 text-amber-900 rounded text-xs font-bold';b.onclick=()=>{let m=current();try{extract(m)}catch(e){alert(e.message);return}let dialog=document.getElementById('heva-diagram-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='heva-diagram-dialog';dialog.style.cssText='max-width:min(96vw,1100px);width:100%;padding:20px;border:2px solid #8b2635;border-radius:14px;background:#fffbf5';dialog.innerHTML='<h2 style="font-size:22px;font-weight:bold;color:#8b2635">Organizadores visuales HEVA</h2><p>Diagrama construido a partir de las secciones del material. Comprueba relaciones y contenido antes de usarlo en clase.</p><label>Tipo <select id="heva-diagram-type"><option value="mapa">Mapa conceptual secuencial</option><option value="flujo">Diagrama de flujo</option></select></label><div id="heva-diagram-preview" style="max-height:55vh;overflow:auto;margin:12px 0"></div><button type="button" id="heva-diagram-svg">Descargar SVG</button> <button type="button" id="heva-diagram-mmd">Descargar Mermaid editable</button> <button type="button" id="heva-diagram-close">Cerrar</button>';document.body.appendChild(dialog);dialog.querySelectorAll('button').forEach(x=>x.style.cssText='padding:10px;margin:4px;border-radius:7px;border:1px solid #8b2635');dialog.querySelector('#heva-diagram-close').onclick=()=>dialog.close();dialog.querySelector('#heva-diagram-type').onchange=()=>{dialog.querySelector('#heva-diagram-preview').innerHTML=svg(current(),dialog.querySelector('#heva-diagram-type').value)};dialog.querySelector('#heva-diagram-svg').onclick=()=>download(svg(current(),dialog.querySelector('#heva-diagram-type').value),'HEVA_organizador.svg','image/svg+xml');dialog.querySelector('#heva-diagram-mmd').onclick=()=>download(mermaid(current()),'HEVA_diagrama.mmd','text/plain;charset=utf-8')}dialog.querySelector('#heva-diagram-preview').innerHTML=svg(m,dialog.querySelector('#heva-diagram-type').value);dialog.showModal()};anchor.after(b)}
 if(typeof document!=='undefined')mount();root.HEVADiagrams={extract,svg,mermaid};
})(typeof window!=='undefined'?window:globalThis);
