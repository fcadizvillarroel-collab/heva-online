const assert = require('node:assert/strict');
const { review } = require('../heva-approval-audit.js');
const base = {
 tipoMaterial:'GUIA', objetivoAprendizaje:'Analizar procesos históricos',
 revisionPedagogica:{validada:true,revisor:'Revisor',fecha:'2026-11-19',oaVerificado:true,contenidoVerificado:true,actividadesVerificadas:true,respuestasVerificadas:true,accesibilidadVerificada:true},
 revisionVisual:{validada:true,revisor:'Revisor',fecha:'2026-11-19',paginasRevisadas:2},
 paginasExportadas:2
};
const substantive = [{texto:'La industrialización modificó los procesos productivos, las condiciones laborales y las ciudades. Se comparan fuentes de dos épocas, se explican causas y consecuencias, y se responde una pregunta de aplicación sobre la vida cotidiana.'}];
function codes(m,sections=substantive,visuals=[]) {return review({material:m,sections,visuals}).issues.map(x=>x.code);}
assert(codes(base).length===0,'A fully evidenced non-documentary example must pass');
assert(codes(base,[{texto:'Paso 1'}]).includes('MARCADOR_SIN_DESARROLLAR'));
assert(codes(base,[{texto:'Tema'}]).includes('CONTENIDO_INSUFICIENTE'));
assert(codes({...base,recursosVisualesHEVA:{imagenes:true}}).includes('SIN_FUENTES_VERIFICADAS'));
const visual=[{id:'v1',documentary:true,sourceUrl:'https://example.org/image'}];
const source={id:'v1',titulo:'Fuente',autorInstitucion:'Institución',url:'https://example.org/image',licencia:'CC BY',pertinenciaOA:'Representa el proceso',verificada:true,revisor:'Revisor',fechaVerificacion:'2026-11-19',derechosVerificados:true};
assert(codes({...base,fuentesVisualesVerificadas:[source]},substantive,visual).includes('RECURSO_DOCUMENTAL_SIN_CURADURIA'));
assert(!codes({...base,fuentesVisualesVerificadas:[{...source,fechaConsulta:'2026-11-19'}]},substantive,visual).includes('RECURSO_DOCUMENTAL_SIN_CURADURIA'));
console.log('HEVA approval audit: 6 checks passed');
