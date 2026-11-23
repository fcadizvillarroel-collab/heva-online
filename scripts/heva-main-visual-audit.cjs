'use strict';
/* Audit real browser layout across laptop/tablet/phone. Screenshots + machine-readable
   geometry; never calls /api/generate or accesses classroom data. */
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true});
const dir=process.env.HEVA_VISUAL_AUDIT_DIR||'/tmp/heva-visual-audit';
await fs.mkdir(dir,{recursive:true});
const report=[];
try{
for(const width of [1365,768,390,320]){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
 const errors=[],alerts=[];let generated=0;
 page.on('pageerror',e=>errors.push(String(e.message).slice(0,250)));
 page.on('request',r=>{if(/\/api\/generate/.test(r.url()))generated++});
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#heva-ajustes-adicionales')&&document.querySelector('#heva-unified-pedagogy')&&window.HEVAStrategyLab,{timeout:16000});
 await page.waitForTimeout(300);
 const inspect=async label=>page.evaluate(label=>{
   const visible=el=>el.checkVisibility({checkVisibilityCSS:true,checkOpacity:true})&&
     el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0;
   const out=[];
   for(const el of document.querySelectorAll('body *')){
    if(!visible(el)||el.children.length>12)continue;
    const r=el.getBoundingClientRect(),style=getComputedStyle(el);
    if(r.left< -3||r.right>innerWidth+3) {
      if(style.position!=='fixed'||label==='drawer')
        out.push({id:el.id||null,tag:el.tagName,text:(el.textContent||'').trim().slice(0,60),
          left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),position:style.position});
    }
   }
   const topLevel=[...document.querySelectorAll('#panel-crear > .bg-white, #heva-unified-pedagogy, #heva-ajustes-adicionales, #integrated-lab')].map(el=>({
     id:el.id||'form',visible:visible(el),rect:(()=>{let r=el.getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}})(),
     parent:el.parentElement?.id||el.parentElement?.className?.slice?.(0,65)||''
   }));
   const duplicates={};for(const el of document.querySelectorAll('[id]'))duplicates[el.id]=(duplicates[el.id]||0)+1;
   const duplicateIDs=Object.entries(duplicates).filter(x=>x[1]>1);
   const actions=[...document.querySelectorAll('button,summary')].filter(visible).map(el=>({type:el.tagName,text:el.textContent.trim().replace(/\s+/g,' ').slice(0,100)}));
   const count={};for(const a of actions){let k=a.text.toLowerCase();count[k]=(count[k]||0)+1;}
   const duplicateActions=Object.entries(count).filter(([k,n])=>k.length>8&&n>1);
   const drawer=document.querySelector('#heva-lab-drawer');const d=drawer?.getBoundingClientRect();
   return{label,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,
     outOfBounds:out.slice(0,45),outTotal:out.length,duplicateIDs,duplicateActions,
     actions:actions.slice(0,65),topLevel,drawer:d?{x:Math.round(d.x),right:Math.round(d.right),width:Math.round(d.width),height:Math.round(d.height)}:null,
     strategyPrimaryCount:document.querySelectorAll('#estrategia-didactica').length,
     labSelectionCount:document.querySelectorAll('#lab-enabled').length,
     pageHasBanner:!!document.querySelector('#heva-abrir-estrategias')};
 },label);
 const base=await inspect('base');
 assert.equal(await page.locator('#heva-empty-preview').isVisible(),true,'La vista inicial debe ser limpia');
 assert.equal(await page.locator('#hoja-material').isVisible(),false,'No mostrar una prueba falsa o en blanco');
 assert.equal(await page.locator('#barra-calidad').isVisible(),false,'No mostrar descargas sin contenido');
 assert.equal(base.pageHasBanner,false,'HEVA no debe repetir el acceso al LAB en el encabezado');
 assert.equal(base.labSelectionCount,1,'No repetir la activación del LAB');
 const order=await page.evaluate(()=>({
   tema:document.querySelector('#tema-especifico').closest('div')?.getBoundingClientRect().top,
   estrategia:document.querySelector('#heva-unified-pedagogy')?.getBoundingClientRect().top,
   explanationFold:document.querySelector('#heva-strategy-evidence')?.open
 }));
 assert.ok(order.tema<order.estrategia,'El tema debe mostrarse antes de estrategias');
 assert.equal(order.explanationFold,false,'Explicación de estrategia debe comenzar cerrada');
 assert.ok(base.scrollWidth<=width+2,'Se detectó desbordamiento horizontal en el formulario');
 await page.screenshot({path:path.join(dir,'heva-'+width+'-inicio.png'),fullPage:width===1365||width===390});
 await page.locator('#heva-ajustes-adicionales > summary').click();
 await page.locator('#integrated-lab > summary').click();
 await page.locator('#heva-lab-drawer').waitFor({state:'visible',timeout:9000});
 const drawer=await inspect('drawer');
 await page.screenshot({path:path.join(dir,'heva-'+width+'-estrategias.png')});
 await page.locator('.heva-lab-close').click();
 const reopened=await page.locator('#integrated-lab').evaluate(el=>el.open);
 assert.equal(reopened,false,'drawer must close');
 report.push({width,base,drawer,errors,generated});
 await page.close();
}
await fs.writeFile(path.join(dir,'auditoria-visual-heva.json'),JSON.stringify(report,null,2));
for(const row of report)console.log('HEVA_VISUAL_AUDIT',JSON.stringify({
 width:row.width,mainHorizontalOverflow:row.base.scrollWidth-row.width,
 drawerHorizontalOverflow:row.drawer.scrollWidth-row.width,
 mainOut:row.base.outOfBounds.slice(0,8),drawerOut:row.drawer.outOfBounds.slice(0,8),
 duplicateActions:row.base.duplicateActions,duplicateIDs:row.base.duplicateIDs,
 primaryCount:row.base.strategyPrimaryCount,labCount:row.base.labSelectionCount,
 errors:row.errors,generated:row.generated,drawerRect:row.drawer.drawer
}));
console.log('SAVED_VISUAL_AUDIT '+dir);
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
