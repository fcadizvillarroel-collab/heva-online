'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=p=>fs.readFileSync(path.join(root,p),'utf8');
const view=require('../experimental/material-view.js');

test('la auditoría se carga antes de la interfaz principal',()=>{
 const html=source('index.html');
 const lib=html.indexOf('<script src="/experimental/material-view.js?v=');
 const initial=html.indexOf('let materialActual = null;');
 assert.ok(lib>=0&&initial>lib);
});

test('el control se aplica después de generar o recuperar por bloques sin reemplazar el material',()=>{
 const html=source('index.html');
 assert.ok(html.indexOf('data=await recuperarMaterialHEVA(payload)')>=0);
 assert.ok(html.indexOf('materialActual = data.material;')<html.indexOf('window.HEVALabMaterialView.audit(materialActual'));
 assert.ok(html.indexOf('window.HEVALabMaterialView.audit(materialActual')<html.indexOf('hevaAutoSaveMaterial(materialActual)'));
 assert.match(html,/catch\(error\)\{\s*\/\/ La falla del informe nunca debe borrar un material ya generado/);
 assert.match(html,/p\.textContent='• '\+message/);
});

test('la API devuelve auditoría complementaria y protege generación aprobada contra fallo de esa auditoría',()=>{
 const server=source('api/generate.js');
 assert.match(server,/laboratorioActivo=estrategiasLab\.length>0\|\|\(Array\.isArray\(planIntegrado\?\.slots\)/);
 assert.match(server,/auditoriaVistaLab=LabMaterialView\.audit/);
 assert.match(server,/laboratorioVista:auditoriaVistaLab/);
 assert.match(server,/auditoriaVistaLab=\{ok:false/);
});

test('planificación completa de 90 minutos puede aprobar estructura propia sin introducción de guía',()=>{
 const plan={titulo:'Planificación EPJA',objetivoAprendizaje:'OA EPJA revisable',planClase:[
 {momento:'Inicio',minutos:15,accionesDocente:'Presenta los conceptos iniciales',accionesEstudiantes:'Relacionan con experiencias'},
 {momento:'Desarrollo',minutos:60,accionesDocente:'Modela y retroalimenta la actividad',accionesEstudiantes:'Resuelven casos con evidencia'},
 {momento:'Cierre',minutos:15,accionesDocente:'Recoge evaluación de salida',accionesEstudiantes:'Fundamentan su conclusión'}
 ]};
 const audit=view.audit(plan,'PLANIFICACION');
 assert.deepEqual(audit.issues,[]);
 assert.equal(audit.ok,true);
});

test('la versión en caché cambia junto con los módulos de auditoría',()=>{
 const sw=source('sw.js');
 assert.match(sw,/heva-online-v73-qa-ppt/);
 const html=source('index.html');assert.ok(html.includes('/heva-quality-gate.js?v=20261123-qa-ppt'));assert.ok(html.includes('/heva-recovery-ui.js?v=20261123-armonizado'));for(const asset of ['heva-slide-design','heva-guide-visuals'])assert.ok(html.includes('/'+asset+'.js?v=20261123-comparaciones'),asset);assert.ok(html.includes('/heva-office.js?v=20261123-qa-ppt'));assert.ok(html.includes('/heva-teacher-ui.js?v=20261123-vistas-reales'));
 assert.match(sw,/experimental\/material-view\.js/);
});
