/* Bibliografía mexicana: descubrimiento por campos formativos, no convalidación curricular.
   Solo enlaces de catálogos oficiales CONALITEG; no se leen libros PDF aquí. */
'use strict';
const PRIMARY='https://libros.conaliteg.gob.mx/primaria_2024.html';
const SECONDARY='https://libros.conaliteg.gob.mx/secundaria_2024.html';
const TELE='https://libros.conaliteg.gob.mx/telesecundaria_2024.html';
const SUBSECRETARIA='https://educacionbasica.sep.gob.mx/catalogo-de-libros-de-texto-gratuitos-ciclo-escolar-2024-2025/';
const fields={
 sociales:[{title:'Ética, naturaleza y sociedades',url:SECONDARY,cycle:'2024-2025',usage:'Análisis histórico, geográfico y ciudadanía; comprobar contenidos concretos y contexto chileno.'}],
 lenguaje:[{title:'Lenguajes y Múltiples lenguajes',url:SECONDARY,cycle:'2024-2025',usage:'Prácticas lectoras, escritura y comunicación; adaptar registro, dialectos y referentes.'}],
 matematica:[{title:'Saberes y pensamiento científico',url:SECONDARY,cycle:'2024-2025',usage:'Representaciones, razonamiento y resolución de problemas, comprobando datos y soluciones.'}],
 ciencias:[{title:'Saberes y pensamiento científico',url:SECONDARY,cycle:'2024-2025',usage:'Indagación, modelos y análisis de fenómenos; comprobar rigurosidad científica.'}],
 ingles:[{title:'Lengua extranjera · Inglés',url:TELE,cycle:'2024-2025',usage:'Actividades de comprensión y producción en inglés sin asumir un nivel equivalente.'}],
 convivencia:[{title:'De lo humano y lo comunitario',url:SECONDARY,cycle:'2024-2025',usage:'Diálogo, participación y acuerdos; trasladar únicamente estrategias pertinentes al OA.'}],
 laboral:[{title:'De lo humano y lo comunitario',url:SECONDARY,cycle:'2024-2025',usage:'Situaciones comunitarias y trabajo colaborativo como ideas, nunca legislación laboral chilena.'}],
 emprendimiento:[{title:'Proyectos escolares y comunitarios',url:PRIMARY,cycle:'2024-2025',usage:'Metodología de proyectos, adaptada a iniciativas adultas y fuentes económicas locales.'}],
 digital:[{title:'Saberes y pensamiento científico / proyectos',url:SECONDARY,cycle:'2024-2025',usage:'Pensamiento aplicado y resolución de problemas; tecnología específica por verificar.'}],
 oficios:[{title:'Proyectos escolares y comunitarios',url:PRIMARY,cycle:'2024-2025',usage:'Secuencia didáctica de proyectos; no sustituye manuales técnicos ni normas de seguridad.'}],
 tp_metal:[],financiera:[],consumo:[],otra:[]
};
const approved=new Set([PRIMARY,SECONDARY,TELE,SUBSECRETARIA]);
function recommendations({enabled=false,subject=null,topicMatched=false}={}){
 if(!enabled||!topicMatched||!subject)return[];
 return (fields[subject]||[]).map(x=>({
  ...x,title:'SEP México · '+x.title,source:'Comisión Nacional de Libros de Texto Gratuitos · SEP (México)',
  country:'MX',role:'catalogo_oficial_extranjero',status:'indice_pendiente_verificacion_documento_y_pagina',
  modality:'educacion_regular_mexico',url:x.url
 })).filter(x=>approved.has(x.url));
}
function instructions(items=[]){
 if(!items.length)return'';
 return '\nFUENTES SEP MÉXICO: Se encontraron únicamente índices CONALITEG por campo formativo. NO se ha leído el texto completo de esos libros ni se han recuperado páginas. No atribuyas contenido, ejemplos, fotografías o citas específicas a un volumen mexicano. Sus campos y grados NO son equivalentes a niveles EPJA de Chile. Una vez verificado un fragmento concreto, únicamente se podrán adaptar ideas pedagógicas o conceptos pertinentes al OA EPJA, diferenciando expresamente legislación, historia y geografía mexicanas de las chilenas. No reproduzcas páginas ni actividades extensas protegidas por derechos de autor.';
}
module.exports={PRIMARY,SECONDARY,TELE,SUBSECRETARIA,fields,approved,recommendations,instructions};
