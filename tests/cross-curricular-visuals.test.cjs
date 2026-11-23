const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const cases=[
 ['Historia','Guerra del Pacífico','ANTECEDENTES'],
 ['Lenguaje','Registros de habla formal e informal','REGISTRO'],
 ['Matemática','Ecuaciones lineales','PLANTEAR'],
 ['Ciencias Naturales','Ecosistemas y biodiversidad','INTERACCIONES'],
 ['Inglés','English conversation','SITUATION'],
 ['Construcciones Metálicas','Soldadura y EPP','PREPARAR'],
 ['Convivencia Social','Resolución de conflictos','PERSONAS'],
 ['Inserción Laboral','Contrato de trabajo','REQUISITOS'],
 ['Estudios Sociales','Globalización','ORIGEN']
];
for(const [asignatura,tema,expected] of cases)test('visual OA '+asignatura+' / '+tema,()=>{
 const labels=[];
 const ctx={fillRect(){},fillText(t){labels.push(String(t));},beginPath(){},roundRect(){},fill(){},moveTo(){},lineTo(){},set fillStyle(v){},set font(v){}};
 const canvas={getContext:()=>ctx,toDataURL:()=> 'data:image/png;base64,iVBORw0KGgo=',width:1000,height:550};
 const context={document:{createElement:()=>canvas},globalThis:null};context.globalThis=context;vm.createContext(context);
 vm.runInContext(fs.readFileSync(require.resolve('../heva-slide-design.js'),'utf8'),context);
 const sections=[{title:'Introducción',text:'Presentación'},{title:tema,text:'Ejemplo: analizamos el tema y sus efectos.'}];
 const output=context.HEVASlideDesign.decorate({tipoMaterial:'PRESENTACION',asignatura,temaEspecifico:tema,recursosVisualesHEVA:{imagenes:true,diagramas:true}},sections);
 assert.ok(output[1].image,tema);
 assert.ok(labels.some(text=>text.includes(expected)),tema+' labels: '+labels.join(','));
});
