#!/usr/bin/env python3
"""Stage-2 transparent curriculum/pedagogy screening: never confuses generic scaffolds with reviewed lessons."""
import json,sys,csv,re,unicodedata
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from oa_lessons import lesson
from oa_blueprints import domain
root=Path(__file__).resolve().parents[1]
rows=json.loads((root/'catalogo-publicado.json').read_text(encoding='utf-8'))
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'out'/'etapa2_revision'
out.mkdir(parents=True,exist_ok=True)
def words(s):
 s=''.join(ch for ch in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(ch)!='Mn')
 return set(re.findall(r'[a-z]{5,}',s))
STOP=set('desarrollar comprender analizar reconocer identificar aplicar evaluar utilizar explicar participar demostrar conocer relacionar comunicar resolver interpretar describir formular establecer construir proponer reflexionar distinguir promover considerar valorar mediante traves sobre para entre desde donde cuando otros otras forma manera diferentes distintos situaciones contextos ejemplos aspectos elementos procesos personas propias diversos diversas conocimiento conocimientos habilidades actitudes capacidad informacion acciones actividades relacion relaciones social sociales propio propia acuerdo partir'.split())
results=[]
for oa in rows:
 l=lesson(oa)
 key,_=domain(oa)
 topic=oa['texto_literal']
 # Explicit evidence gates. A template is not independently validated OA-specific instruction.
 has_structure=all(l.get(k) for k in ('explanation','scenario','worked','transfer','accessibility','exit_ticket')) and len(l.get('questions',[]))==4
 terms=words(topic)-STOP
 overlap=sorted(terms & (words(l['worked']+' '+l['transfer'])-STOP))
 relevance=round(len(overlap)/max(len(terms),1),3)
 issues=[]
 if not overlap:issues.append('SOLUCION_SIN_TERMINO_ESPECIFICO_DEL_OA')
 elif relevance<0.15:issues.append('BAJA_COINCIDENCIA_TEMATICA_LEXICA')
 if not has_structure:issues.append('ESTRUCTURA_INCOMPLETA')
 if l.get('status')!='VALIDADO_POR_ESPECIALISTA':issues.append('SIN_VALIDACION_DISCIPLINAR')
 if not l.get('fuentes_documentales_verificadas'):issues.append('SIN_FUENTES_ESPECIFICAS_VERIFICADAS')
 if not l.get('ejemplo_resuelto_validado_para_oa'):issues.append('EJEMPLO_GENERICO_O_SIN_COTEJO')
 if not l.get('pauta_revisada_por_docente'):issues.append('PAUTA_SIN_REVISION_EXPERTA')
 results.append({'clave_interna':oa['clave_interna'],'asignatura':oa['asignatura'],'nivel':oa['nivel'],'dominio':key,'objetivo_literal':topic,'estructura_completa':has_structure,'coincidencia_lexica':relevance,'terminos_coincidentes':', '.join(overlap),'estado':'REQUIERE_REVISION_EXPERTA' if issues else 'VALIDADO','alertas':'|'.join(issues),'ejemplo':l['scenario'],'solucion_orientativa':l['worked']})
with (out/'registro_revision_pedagogica_407.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=results[0].keys());w.writeheader();w.writerows(results)
summary={'total_oa':len(results),'estructura_completa':sum(r['estructura_completa'] for r in results),'validacion_experta_acreditada':sum(r['estado']=='VALIDADO' for r in results),'pendiente_revision':sum(r['estado']!='VALIDADO' for r in results),'sin_coincidencia_lexica':sum('SOLUCION_SIN_TERMINO_ESPECIFICO_DEL_OA' in r['alertas'] for r in results),'baja_coincidencia_lexica':sum('BAJA_COINCIDENCIA_TEMATICA_LEXICA' in r['alertas'] for r in results),'metodo':'Revisión automática de estructura y trazabilidad. No sustituye cotejo experto ni fuentes verificadas.'}
(out/'resumen.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False))
assert len(results)==407
