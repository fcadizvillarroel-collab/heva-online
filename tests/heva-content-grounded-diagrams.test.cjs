'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const D=require('../heva-slide-design.js');
const source=[
 'Antecedentes: Existían diferencias sobre las condiciones del intercambio.',
 'Desarrollo: Las partes iniciaron negociaciones y acuerdos.',
 'Consecuencias: Se modificaron las reglas de cooperación.'
];
function office(){
 const context={
  HEVA:require('../heva-core.js'),
  HEVATemplates:require('../heva-templates.js'),
  HEVAPedagogy:require('../heva-pedagogy.js'),
  HEVAGuideVisuals:require('../heva-guide-visuals.js'),
  HEVASlideDesign:D,
  document:{createElement:()=>({getContext:()=>null})}
 };
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(require.resolve('../heva-office.js'),'utf8'),context);
 return context.HEVAOffice;
}
function material(custom={}){
 return{titulo:'Cambios sociales',asignatura:'Estudios Sociales',tipoMaterial:'PRESENTACION',
  diapositivas:[{titulo:'Antecedentes, desarrollo y consecuencias',funcion:'explicación',contenido:source}],
  ...custom};
}
test('reconoce únicamente secuencias con datos explícitos, etiquetas válidas y contenido distinto',()=>{
 const f=D.structuredFlow(source);
 assert.ok(f);
 assert.deepEqual(f.items.map(x=>x.label),['Antecedentes','Desarrollo','Consecuencias']);
 assert.equal(f.items[0].text,'Existían diferencias sobre las condiciones del intercambio.');
 assert.equal(D.structuredFlow(['Causa: Faltó información.','Dato: Otra información.','Efecto: Un resultado.']),null);
 assert.equal(D.structuredFlow(['Situación: Se analiza un caso.','Acción: Se analiza un caso.','Resultado: Se analiza un caso.']),null);
 assert.equal(D.structuredFlow(['Antecedentes: x','Desarrollo: Se explica el proceso.','Consecuencias: Se explica el resultado.']),null);
});
test('la secuencia original genera diagramas PPT editables, completos y sin imágenes genéricas',()=>{
 const m=material(),before=JSON.stringify(m),out=office().preview(m);
 assert.equal(JSON.stringify(m),before);
 assert.equal(out.pages.length,2);
 const page=out.pages[1],visible=page.elements.filter(x=>x.kind==='text').map(x=>x.text);
 assert.equal(page.visualKind,'diagram');
 assert.equal(page.elements.filter(x=>x.kind==='image').length,0);
 assert.ok(page.elements.filter(x=>x.kind==='shape'&&x.shape==='roundRect').length>=3);
 for(const line of source){const [heading,...details]=line.split(':');assert.ok(visible.includes(heading.toUpperCase()),heading);assert.ok(visible.includes(details.join(':').trim()),line);}
 assert.ok(page.elements.every(x=>x.x>=0&&x.y>=0&&x.x+x.w<=13.34&&x.y+x.h<=7.51));
});
test('quitar diagramas conserva íntegro el contenido sin simular una fuente visual',()=>{
 const out=office().preview(material({recursosVisualesHEVA:{imagenes:false,diagramas:false,graficos:false,recuadros:false}}));
 const page=out.pages[1];
 assert.notEqual(page.visualKind,'diagram');
 assert.equal(page.elements.filter(x=>x.kind==='image').length,0);
 const all=page.elements.filter(x=>x.kind==='text').map(x=>x.text).join(' ');
 for(const line of source)assert.ok(all.includes(line),line);
});
test('funciona con secuencias de ciencias, matemática y resolución dialogada',()=>{
 for(const rows of [
  ['Observación: Se registra la temperatura del agua.','Análisis: Se comparan dos mediciones de temperatura.','Conclusión: La diferencia debe explicarse con datos.'],
  ['Datos: El total es de veinte unidades.','Procedimiento: Se divide la cantidad en partes iguales.','Comprobación: Se revisa sumando las partes obtenidas.'],
  ['Problema: Dos vecinos discrepan sobre un horario.','Diálogo: Ambos explican sus necesidades y límites.','Acuerdo: Proponen turnos y revisan el resultado.']
 ])assert.ok(D.structuredFlow(rows),rows.join(' / '));
});
