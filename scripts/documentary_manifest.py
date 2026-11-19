"""Generate 407 documentary search briefs without inventing licensed asset matches."""
import json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from oa_blueprints import blueprint
root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'catalogo-publicado.json').read_text())
SOURCE_COLLECTIONS={
 'historia':[('Biblioteca Nacional Digital de Chile','https://www.bibliotecanacionaldigital.gob.cl/'),('Wikimedia Commons','https://commons.wikimedia.org/')],
 'ciencias':[('Wikimedia Commons','https://commons.wikimedia.org/'),('NASA media','https://www.nasa.gov/nasa-brand-center/images-and-media/')],
 'matematica':[('Wikimedia Commons','https://commons.wikimedia.org/')],
 'lenguaje':[('Biblioteca Nacional Digital de Chile','https://www.bibliotecanacionaldigital.gob.cl/')],
 'ingles':[('Wikimedia Commons','https://commons.wikimedia.org/')],
 'laboral':[('Wikimedia Commons','https://commons.wikimedia.org/')],
 'convivencia':[('Wikimedia Commons','https://commons.wikimedia.org/')],
 'economia':[('Wikimedia Commons','https://commons.wikimedia.org/')],
 'arte':[('Wikimedia Commons','https://commons.wikimedia.org/')],
 'fisica':[('Wikimedia Commons','https://commons.wikimedia.org/')]
}
records=[]
for oa in catalog:
 b=blueprint(oa)
 records.append({'oa':oa['clave_interna'],'asignatura':oa['asignatura'],'foco':b['foco'],
 'tipo_recurso_recomendado':b['recurso_recomendado'],
 'colecciones_para_busqueda':[{'institucion':name,'pagina_coleccion':url} for name,url in SOURCE_COLLECTIONS.get(b['dominio'],[('Wikimedia Commons','https://commons.wikimedia.org/')])],
 'recurso_especifico':None,'autor':None,'licencia':None,'url_archivo':None,
 'pertinencia_verificada':False,'derechos_verificados':False,'estado':'PENDIENTE_CURADURIA_DOCUMENTAL'})
assert len(records)==407
out=root/'out'/'oa407_documentary_manifest.json';out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(records,ensure_ascii=False,indent=2))
print('407 documentary briefs; zero specific media items falsely marked verified')
