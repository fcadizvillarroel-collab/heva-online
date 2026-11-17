// QA de los exportadores locales reales, sin red ni proveedores IA.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture}=require('./ui-check.cjs');
(async()=>{
fs.mkdirSync('/tmp/heva-qa',{recursive:true});let captured;
const context={console,Buffer,Blob,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,DataView,URL:{createObjectURL(blob){captured=blob;return 'blob:local-qa'},revokeObjectURL(){}},setTimeout,clearTimeout,setImmediate,process,Promise,atob,btoa,HEVA:require('../heva-core.js'),HEVAPedagogy:require('../heva-pedagogy.js'),HEVATemplates:require('../heva-templates.js')};
context.document={createElement(tag){if(tag==='canvas')return {getContext:()=>null};return {click(){},remove(){},style:{}}},body:{appendChild(){}}};context.window=context;context.navigator={userAgent:'node QA'};vm.createContext(context);
for(const path of ['vendor/docx.js','vendor/pptxgen.js','heva-visual-assets.js','heva-office.js'])vm.runInContext(fs.readFileSync(path,'utf8'),context,{filename:path,importModuleDynamically:vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER});
const Original=context.PptxGenJS;let deckBytes;context.PptxGenJS=class extends Original{async writeFile(){deckBytes=await this.write({outputType:'nodebuffer'});return 'qa.pptx'}};
const guide=fixture();guide.accesibilidadVisual={contraste:true,letraGrande:true,tamano:20,fuente:'Verdana',interlineado:1.6,espaciado:.08};
const before=JSON.stringify(guide),word=await context.HEVAOffice.word(guide,false);assert.equal(JSON.stringify(guide),before);fs.writeFileSync('/tmp/heva-qa/qa.docx',Buffer.from(await word.arrayBuffer()));
const presentation=fixture('PRESENTACION');await context.HEVAOffice.powerpoint(presentation,false);fs.writeFileSync('/tmp/heva-qa/qa.pptx',Buffer.from(deckBytes));
const JSZip=require('jszip'),doc=await JSZip.loadAsync(fs.readFileSync('/tmp/heva-qa/qa.docx')),ppt=await JSZip.loadAsync(deckBytes);const document=await doc.file('word/document.xml').async('string'),styles=await doc.file('word/styles.xml').async('string');assert.match(document,/Taller compara proveedores/);assert.match(document,/SIMULADA/);assert.match(styles,/Verdana/);assert.match(document,/w:sz w:val="40"/);
const slides=Object.keys(ppt.files).filter(x=>/^ppt\/slides\/slide\d+\.xml$/.test(x));assert.ok(slides.length>=17);const visible=(await Promise.all(slides.map(x=>ppt.file(x).async('string')))).join('\n');assert.ok(!visible.includes('Pauta reservada'));const notes=Object.keys(ppt.files).filter(x=>/^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(x));assert.ok((await Promise.all(notes.map(x=>ppt.file(x).async('string')))).join('').includes('Pauta reservada'));
fs.writeFileSync('/tmp/heva-qa/export-result.json',JSON.stringify({wordBytes:fs.statSync('/tmp/heva-qa/qa.docx').size,powerpointBytes:deckBytes.length,slides:slides.length,notes:notes.length,checks:['vendor local real','noticia en Word','tipografía y tamaño accesibles','notas fuera de diapositivas','entrada inmutable']},null,2));console.log(fs.readFileSync('/tmp/heva-qa/export-result.json','utf8'));
})().catch(e=>{console.error(e);process.exit(1)});
