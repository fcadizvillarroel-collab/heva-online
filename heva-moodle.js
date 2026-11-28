(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./heva-core.js'),require('./heva-assessment.js'));
 else root.HEVAMoodle=factory(root.HEVA,root.HEVAAssessment);
})(globalThis,function(Core,Assessment){
 'use strict';
 const labels=['A','B','C','D'];
 const xml=value=>String(value??'').replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu,'')
  .replace(/[<>&"']/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'})[char]);
 const nonempty=value=>typeof value==='string'&&value.trim().length>0;
 function exportQuiz(material){
  if(material?.tipoMaterial!=='EVALUACION')throw Error('Abre una evaluación HEVA.');
  const questions=[],omitted=[];
  for(const item of Assessment.items(Core.material(material))){
   if(!item.label.startsWith('Alternativa ')){omitted.push(item.label+' · requiere su formato y pauta docente');continue;}
   const q=item.q;
   const answers=Array.isArray(q?.alternativas)?q.alternativas:[];
   const valid=nonempty(q?.enunciado)&&labels.includes(q.claveCorrecta)&&answers.length===labels.length&&
    labels.every(letter=>answers.filter(a=>a?.letra===letter&&nonempty(a.texto)).length===1)&&
    new Set(answers.map(a=>a.texto.trim().toLocaleLowerCase('es'))).size===labels.length;
   if(!valid){omitted.push(item.label+' · revisa el enunciado, las opciones y la clave');continue;}
   const options=answers.map(a=>'    <answer fraction="'+(a.letra===q.claveCorrecta?100:0)+'" format="plain_text"><text>'+xml(a.texto)+'</text></answer>').join('\n');
   questions.push([
    '  <question type="multichoice">',
    '    <name><text>'+xml(material.titulo+' · '+item.label)+'</text></name>',
    '    <questiontext format="plain_text"><text>'+xml(q.enunciado)+'</text></questiontext>',
    '    <defaultgrade>'+item.points+'</defaultgrade>',
    '    <single>true</single><shuffleanswers>false</shuffleanswers><answernumbering>ABCD</answernumbering>',
    options,
    '  </question>'
   ].join('\n'));
  }
  return {exported:questions.length,omitted,xml:questions.length?'<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n'+questions.join('\n')+'\n</quiz>\n':''};
 }
 return {exportQuiz};
});
