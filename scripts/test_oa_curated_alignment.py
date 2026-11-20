#!/usr/bin/env python3
"""Check all 407 OA-specific scenarios are paired with their corresponding solutions."""
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from oa_curated_cases import curated_case
from oa_specific_examples import specific_example
from oa_lessons import lesson
rows=json.loads((ROOT/"catalogo-publicado.json").read_text(encoding="utf-8"))
assert len(rows)==407
curated=0
for oa in rows:
 case=curated_case(oa) or specific_example(oa)
 material=lesson(oa)
 if case is not None:
  curated+=1
  assert material["scenario"]==case[0],oa["clave_interna"]
  assert case[1] in material["worked"],oa["clave_interna"]
  assert case[1] in material["explanation"],oa["clave_interna"]
  assert material["answer_guide"][0]=="Solución del caso presentado: "+case[1],oa["clave_interna"]
  assert material["transfer"]==case[2],oa["clave_interna"]
  assert material["ejemplo_resuelto_con_datos"] is True
 else:
  assert material["ejemplo_resuelto_con_datos"] is False
  assert material["tipo_pauta"]=="CRITERIOS_ORIENTATIVOS_SIN_SOLUCION_UNICA"
  assert material["questions"][0].startswith("Caso guiado:")
  assert material["answer_guide"][0].startswith("Orientación para el caso guiado:")
print(json.dumps({"oa":len(rows),"casos_especificos_coherentes":curated,"pautas_sin_solucion_inventada":len(rows)-curated},ensure_ascii=False))
