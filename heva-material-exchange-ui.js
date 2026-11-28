(function(){
 'use strict';
 const list=document.getElementById('lista-guardados');
 const exchange=window.HEVAMaterialExchange;
 if(!list||!exchange)return;
 const el=(tag,text)=>{const node=document.createElement(tag);node.textContent=text||'';return node;};
 const details=el('details');details.className='border rounded p-3 my-3 no-print';
 const summary=el('summary','Intercambiar un material docente');
 const explanation=el('p','Comparte una copia editable del material abierto. Puede contener la pauta completa. Revisa el texto y retira cualquier dato personal antes de enviarlo a otra persona.');
 const aliasLabel=el('label','Alias público de autoría (opcional)');
 const alias=el('input');alias.type='text';alias.maxLength=80;alias.className='block border rounded mb-2';aliasLabel.append(alias);
 const status=el('p');status.setAttribute('role','status');
 const origin=el('p');
 const save=el('button','Descargar material para compartir');save.type='button';save.className='border rounded px-2 py-1 mr-2';
 save.addEventListener('click',()=>{
  try{
   if(!materialActual)throw Error('Abre un material antes de compartirlo.');
   syncEdits();
   const payload=exchange.serialize(materialActual,alias.value);
   HEVAOffice.download(new Blob([payload],{type:'application/json'}),'HEVA_material_compartido.json');
   status.textContent='Copia editable descargada.';
  }catch(error){status.textContent=error.message;}
 });
 const input=el('input');input.type='file';input.accept='.json,application/json';
 const importLabel=el('label','Guardar una copia compartida en el historial');importLabel.className='block my-2';importLabel.append(input);
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];input.value='';
  if(!file)return;
  try{
   if(file.size>exchange.maximumBytes)throw Error('El archivo de intercambio supera el tamaño permitido.');
   const material=exchange.parse(await file.text());
   storeHistoryVersion(material);
   cargarHistorial();
   status.textContent='Copia guardada en el historial. Puedes abrirla, revisarla y guardar nuevas versiones.';
   const source=material.origenIntercambio;
   origin.textContent='Versión de origen '+source.version+(source.autor?' · Autoría indicada en el archivo: '+source.autor:'')+'.';
  }catch(error){status.textContent=error.message;}
 });
 details.append(summary,explanation,aliasLabel,save,importLabel,status,origin);list.before(details);
})();
