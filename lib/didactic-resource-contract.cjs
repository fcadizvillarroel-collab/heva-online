'use strict';
// Opciones didácticas dentro de un único panel existente; no confundir con
// "imágenes/diagramas" que configura únicamente la presentación visual.
const types=Object.freeze({
 texto:'Texto o diálogo original incorporado',
 noticia:'Noticia didáctica simulada, completa y rotulada',
 comparacion:'Comparación con ejemplos concretos',
 tabla:'Tabla con datos, encabezados y unidades',
 mapa:'Mapa o esquema espacial sustentado'
});
function validate(input){
 if(input==null)return [];
 if(!Array.isArray(input)||input.length>Object.keys(types).length)return ['La selección de recursos didácticos no es válida.'];
 const seen=new Set();for(const item of input){
  if(typeof item!=='string'||!Object.hasOwn(types,item)||seen.has(item))return ['Los recursos didácticos contienen valores repetidos o desconocidos.'];
  seen.add(item);
 }
 return [];
}
function selected(input){return validate(input).length?[]:Array.isArray(input)?input.slice():[];}
function prompt(p={}){
 const list=selected(p.recursosDidacticosHEVA);
 if(!list.length||!['GUIA','PRESENTACION','ACCESIBLE','TALLER'].includes(p.tipoMaterial))return '';
 const rules={
  texto:'Redacta el fragmento o diálogo didáctico ORIGINAL que se leerá, con situación y voces completas. Si es un documento histórico o noticia auténtica, solo cítalo si existe en las fuentes verificadas; en caso contrario crea material ficticio rotulado y no atribuido.',
  noticia:'Incluye la noticia DIDÁCTICA SIMULADA completa y rotulada; título, entrada, desarrollo y relación directa con el OA. No la presentes como información reciente ni firmada por un medio real; si el esquema dispone de noticiaDidactica, usa ese campo sin duplicarla.',
  comparacion:'Incluye dos situaciones o respuestas distintas y una comparación explícita de semejanzas, diferencias y criterio de selección; usa los campos explicativos o diapositivas existentes, no agregues preguntas fuera de los límites.',
  tabla:'Integra en el documento una tabla textual autocontenida con nombres de columnas, dos o más filas concretas, unidad cuando corresponda y una consigna para interpretarla; no escribas "se adjunta tabla" si falta la tabla.',
  mapa:'Solo incorpora mapa auténtico si el documento incluye uno verificado y su descripción accesible. Si no existe mapa disponible, utiliza un esquema espacial TEXTUAL con lugares/relaciones comprobables o explica que el recurso está pendiente; nunca simules un mapa geográfico exacto.'
 };
 return '\nRECURSOS DIDÁCTICOS EXPLÍCITAMENTE SOLICITADOS: '+list.map(x=>types[x]).join('; ')+'.\n'+list.map(x=>'- '+rules[x]).join('\n')+'\nConserva el OA EPJA literal, el tema y las cantidades. Explica los conceptos ANTES de usarlos en las tareas. Los apoyos visuales requieren contenido real; no produzcas el mismo diagrama abstracto para todos los temas.\n';
}
module.exports={types,validate,selected,prompt};
