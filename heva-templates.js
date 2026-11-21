(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVATemplates=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
const themes={
 azul:{name:'Gemini · institucional azul',main:'254B84',accent:'C99054',background:'F0F5FB',ink:'22344A',panel:'FFFFFF',soft:'E5EDF7',font:'Aptos',cover:'254B84',layout:'clean'},
 gemini_calido:{name:'Gemini · cálido',main:'975C3D',accent:'D69B56',background:'F8EFE3',ink:'3B302B',panel:'FFFDF9',soft:'EFE0D0',font:'Aptos',cover:'86503B',layout:'warm'},
 editorial_calido:{name:'Z.ai · editorial cálido',main:'782F40',accent:'BF9464',background:'F6F0E9',ink:'342E32',panel:'FFFDF9',soft:'E9DCD0',font:'Georgia',cover:'612C3B',layout:'editorial'},
 calida:{name:'Cálida · terracota y crema',main:'8B2635',accent:'C77638',background:'FFF7ED',ink:'302723',panel:'FFFFFF',soft:'F1E7DB',font:'Aptos',cover:'8B2635',layout:'warm'},
 institucional:{name:'Institucional · verde y arena',main:'285E49',accent:'A86A32',background:'F4F3E9',ink:'22372F',panel:'FFFFFF',soft:'ECE8D8',font:'Aptos',cover:'285E49',layout:'clean'},
 contraste:{name:'Alto contraste · blanco y negro',main:'111111',accent:'111111',background:'FFFFFF',ink:'111111',panel:'FFFFFF',soft:'EEEEEE',font:'Arial',cover:'111111',layout:'clean'}
};
function choose(m={}){
 const requested=m.plantillaVisual||m.planGeneracion?.plantillaVisual||'';
 if(requested&&requested!=='auto')return themes[requested]?requested:'calida';
 const subject=String(m.asignatura||m.planGeneracion?.asignatura||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/matemat|ciencias naturales|fisica|quimica|biologia|computacion/.test(subject))return'azul';
 if(/lenguaje|lengua y literatura|estudios sociales|historia|filosofia/.test(subject))return'editorial_calido';
 if(/ingles|convivencia|insercion laboral/.test(subject))return'gemini_calido';
 return'gemini_calido';
}
function get(id){return themes[id]||themes.calida;}
function layout(m){const a=m.accesibilidadVisual||{},theme=get(a.contraste?'contraste':choose(m)),large=!!a.letraGrande||m.tipoMaterial==='ACCESIBLE'||m.derivacion?.tipo==='ACCESIBLE';return{theme,...theme,large,wordSize:large?Math.max(32,Math.min(48,(Number(a.tamano)||16)*2)):26,slideSize:large?26:22};}
return{themes,get,choose,layout};});
