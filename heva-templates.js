(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVATemplates=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
const themes={
 calida:{name:'Editorial cálida · burdeos y crema',main:'782F40',accent:'B97546',background:'FCF7F0',ink:'302B2F',panel:'FFFFFF',soft:'F3E8DB',font:'Arial'},
 institucional:{name:'Institucional · verde y arena',main:'285E49',accent:'A86A32',background:'F4F3E9',ink:'22372F',panel:'FFFFFF',soft:'E8EFEA',font:'Arial'},
 azul:{name:'Institucional azul',main:'254B84',accent:'C99054',background:'F0F5FB',ink:'22344A',panel:'FFFFFF',soft:'E5EDF7',font:'Arial'},
 gemini_calido:{name:'Cálida crema · Gemini',main:'975C3D',accent:'D69B56',background:'F8EFE3',ink:'3B302B',panel:'FFFFFF',soft:'EFE0D0',font:'Arial'},
 editorial_calido:{name:'Editorial cálida · Z.ai',main:'782F40',accent:'BF9464',background:'F6F0E9',ink:'342E32',panel:'FFFFFF',soft:'E9DCD0',font:'Arial'},
 contraste:{name:'Alto contraste · blanco y negro',main:'111111',accent:'111111',background:'FFFFFF',ink:'111111',panel:'FFFFFF',soft:'F2F2F2',font:'Arial'}
};
function get(id){return themes[id]||themes.calida;}
function layout(m){const a=m.accesibilidadVisual||{},theme=get(a.contraste?'contraste':m.plantillaVisual||m.planGeneracion?.plantillaVisual),large=!!a.letraGrande||m.tipoMaterial==='ACCESIBLE'||m.derivacion?.tipo==='ACCESIBLE';return{theme,...theme,large,wordSize:large?Math.max(32,Math.min(48,(Number(a.tamano)||16)*2)):26,slideSize:large?26:22};}
return{themes,get,layout};});
