(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVATemplates=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
const themes={calida:{name:'Cálida · terracota y crema',main:'8B2635',accent:'C77638',background:'FFF7ED',ink:'302723'},institucional:{name:'Institucional · verde y arena',main:'285E49',accent:'A86A32',background:'F4F3E9',ink:'22372F'},contraste:{name:'Alto contraste · blanco y negro',main:'111111',accent:'111111',background:'FFFFFF',ink:'111111'}};
function get(id){return themes[id]||themes.calida;}
function layout(m){const theme=get(m.plantillaVisual||m.planGeneracion?.plantillaVisual),large=m.tipoMaterial==='ACCESIBLE'||m.derivacion?.tipo==='ACCESIBLE';return{theme,...theme,large,wordSize:large?32:26,slideSize:large?26:22};}
return{themes,get,layout};});
