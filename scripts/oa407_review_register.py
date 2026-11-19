#!/usr/bin/env python3
"""Export a complete, auditable 407-OA human review register.
Blank evidence is intentionally NOT an approval.
"""
import csv,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
catalog=json.loads((ROOT/'catalogo-publicado.json').read_text())
assert len(catalog)==407
fields=['oa','marco','asignatura','nivel','objetivo_literal','fuente_curricular','pagina_fuente',
 'explicacion_revisada','ejemplo_resuelto_revisado','actividades_revisadas',
 'respuestas_revisadas','accesibilidad_revisada','paginas_word_revisadas',
 'paginas_ppt_revisadas','total_paginas_word','total_paginas_ppt',
 'recurso_documental_url','autor_institucion','licencia_especifica',
 'pertinencia_oa_revisada','derechos_de_uso_revisados','revisor','fecha_revision',
 'estado','observaciones']
out=ROOT/'out'/'oa407_registro_validacion.csv';out.parent.mkdir(exist_ok=True)
with out.open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
 for oa in catalog:
  w.writerow({'oa':oa['clave_interna'],'marco':oa['marco'],'asignatura':oa['asignatura'],
   'nivel':oa['nivel'],'objetivo_literal':oa['texto_literal'],
   'fuente_curricular':oa.get('fuente_documento',''),'pagina_fuente':oa.get('pagina_oficial',''),
   'estado':'PENDIENTE_REVISION_INDIVIDUAL',
   'observaciones':'Sin aprobación docente ni recurso documental individual comprobado'})
print('407 OA review rows; 0 falsely approved')
