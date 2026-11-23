#!/usr/bin/env python3
"""Guard against teaching the worked answer before the case and duplicating it in student guides."""
import json, tempfile
from pathlib import Path
from docx import Document
from pptx import Presentation
from build_407_oa_materials import create_ppt,create_doc,diagram,evidence_diagram
from oa_curated_cases import curated_case

root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'catalogo-publicado.json').read_text(encoding='utf-8'))
samples=[]
for word in ('Estudios Sociales','Matemática','Lengua Castellana'):
    result=next((o for o in catalog if word.lower() in o['asignatura'].lower()),None)
    if result is not None:samples.append(result)
assert len(samples)==3
with tempfile.TemporaryDirectory() as t:
    tmp=Path(t)
    for i,record in enumerate(samples,1):
        oa=dict(record,_index=i)
        assert curated_case(oa) is not None
        figure=diagram(oa,tmp/f'fig-{i}.png')
        evidence=evidence_diagram(oa,tmp/f'ev-{i}.png')
        pptfile=tmp/f'oa-{i}.pptx'
        docfile=tmp/f'oa-{i}.docx'
        create_ppt(oa,figure,evidence,pptfile)
        create_doc(oa,figure,docfile,teacher=False)
        deck=Presentation(pptfile)
        slides=[' '.join(shape.text for shape in slide.shapes if shape.has_text_frame) for slide in deck.slides]
        case_index=next(j for j,s in enumerate(slides) if 'Caso para pensar' in s)
        solution_index=next(j for j,s in enumerate(slides) if 'Resolución explicada y transferencia' in s)
        assert case_index<solution_index,(i,case_index,solution_index)
        raw_solution=curated_case(oa)[1]
        assert raw_solution not in ' '.join(slides[:case_index]),'Answer was revealed before case'
        doc=Document(docfile)
        contents='\n'.join(p.text for p in doc.paragraphs)
        assert contents.count(curated_case(oa)[0])==1,'Student Word duplicates same case'
        assert contents.count(raw_solution)==1,'Student Word duplicates solved reasoning'
        assert 'Actividades de práctica' in contents
print('PASS: three subjects show the case before the answer and avoid duplicating the solved example')
