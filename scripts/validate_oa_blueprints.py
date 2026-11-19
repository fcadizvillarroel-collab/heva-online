import json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from oa_blueprints import blueprint
root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'catalogo-publicado.json').read_text())
assert len(catalog)==407
records=[blueprint(oa) for oa in catalog]
assert len({x['oa'] for x in records})==407
assert all(x['estado_pedagogico']=='BORRADOR_NO_VALIDADO' for x in records)
assert all(len(x['actividades'])==3 for x in records)
unique_activity_sets=len({tuple(x['actividades']) for x in records})
print('Unique activity texts:',unique_activity_sets,'of 407; some OA texts may coincide')
assert len({x['dominio'] for x in records})>=8
out=root/'out'/'oa407_blueprints.json';out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(records,ensure_ascii=False,indent=2))
print('407 individual OA blueprints; domains:',len({x['dominio'] for x in records}))
