#!/usr/bin/env python3
"""Guardrails for curated OA lessons: exact catalog IDs and worked-example evidence."""
import json
from pathlib import Path
from oa_curated_cases import CASES
from oa_specific_examples import specific_example
from oa_lessons import lesson
root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'catalogo-publicado.json').read_text(encoding='utf-8'))
by_id={o['clave_interna']:o for o in catalog}
assert len(catalog)==407 and len(by_id)==407
assert len(CASES)==407, f'Expected 407 exact-OA cases, got {len(CASES)}'
assert set(CASES)==set(by_id), 'Missing or unknown exact OA case keys'
for key, (scenario, solution, transfer) in CASES.items():
    assert all(len(t.strip())>=30 for t in (scenario,solution,transfer)), key
    l=lesson(by_id[key])
    assert l['scenario'].startswith(scenario) and solution in l['worked'],key
    assert len(l['scenario'].strip())>=65,key
    assert l['ejemplo_resuelto_con_datos'] is True,key
    assert solution in l['answer_guide'][0], ('Missing actual case answer key',key)
    assert l['questions'][0].startswith('Caso resuelto sobre «'), ('Exercise does not match solved case',key)
    assert l['focus'] in l['questions'][0], ('Exercise does not reference its literal OA focus',key)
    assert l['status']=='BORRADOR_DIDACTICO_NO_VALIDADO',key
n_topic=sum(bool(specific_example(o)) for o in catalog)
print(json.dumps({'catalog':len(catalog),'curated_exact_oa':len(CASES),'topic_rule_matches':n_topic,'expert_approved':0},ensure_ascii=False))
