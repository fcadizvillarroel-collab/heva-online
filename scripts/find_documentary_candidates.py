#!/usr/bin/env python3
"""Find real Commons file candidates and retain their source/license metadata.
This is discovery, NOT a license/legal review or curricular approval.
"""
import argparse,json,re,time,urllib.parse,urllib.request,urllib.error,html
from pathlib import Path
from oa_blueprints import blueprint
ROOT=Path(__file__).resolve().parents[1]
API='https://commons.wikimedia.org/w/api.php'
STOP=set('para como entre desde sobre cuando donde mediante durante desde otras otros diferentes distintos conocimientos habilidades información estudiantes aprendizaje forma desarrollo analizar aplicar comprender identificar reconocer desarrollar interpretar explicar comunicar evaluar construir utilizar elaborar valorar reflexionar situaciones contexto relación procesos capacidad personas propios propias mediante los las una unos unas del por con sus que este esta esto esos esas al la el de en y o un se su a es lo'.split())
def terms(oa):
 text=oa['texto_literal'].lower()
 words=re.findall(r'[a-záéíóúüñ]{5,}',text)
 distinct=[]
 for w in words:
  if w not in STOP and w not in distinct:distinct.append(w)
 return ' '.join(distinct[:4]) or oa['asignatura']
def request(params):
 url=API+'?'+urllib.parse.urlencode(params)
 req=urllib.request.Request(url,headers={'User-Agent':'HEVA-EPJA-documentary-research/1.0 (educational curriculum source research)'})
 for attempt in range(4):
  try:
   with urllib.request.urlopen(req,timeout=25) as r:return json.load(r)
  except urllib.error.HTTPError as e:
   if e.code not in (429,503) or attempt==3:raise
   delay=min(90,10*(2**attempt))
   print('Rate limited; pausing',delay,'seconds',flush=True)
   time.sleep(delay)
def clean(s):
 return re.sub(r'<[^>]+>','',html.unescape(s or '')).strip()
def candidates(oa,limit=3):
 q=terms(oa)
 data=request({'action':'query','generator':'search','gsrsearch':'filetype:bitmap '+q,
 'gsrnamespace':6,'gsrlimit':limit,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiextmetadatafilter':'LicenseShortName|LicenseUrl|Artist|Credit|ObjectName|UsageTerms','format':'json'})
 items=[]
 for page in data.get('query',{}).get('pages',{}).values():
  info=(page.get('imageinfo') or [{}])[0];meta=info.get('extmetadata') or {}
  get=lambda k:clean((meta.get(k) or {}).get('value',''))
  items.append({'file_title':page.get('title'),'commons_page':info.get('descriptionurl'),
   'media_url':info.get('url'),'license':get('LicenseShortName'),
   'license_url':get('LicenseUrl'),'artist':get('Artist'),'credit':get('Credit'),
   'object_name':get('ObjectName'),'usage_terms':get('UsageTerms'),
   'mime':info.get('mime'),'bytes':info.get('size'),
   'metadata_present':bool(get('LicenseShortName') and info.get('descriptionurl')),
   'license_verified':False,'curricular_relevance_verified':False,
   'historical_scientific_accuracy_verified':False,'human_review_required':True})
 return items
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--limit',type=int,default=407);ap.add_argument('--delay',type=float,default=2.0)
 ap.add_argument('--out',default='out/oa407_documentary_candidates.json');args=ap.parse_args()
 catalog=json.loads((ROOT/'catalogo-publicado.json').read_text())
 result=[]
 for i,oa in enumerate(catalog[:args.limit],1):
  row={'oa':oa['clave_interna'],'asignatura':oa['asignatura'],'query':terms(oa),
       'candidates':[],'status':'REQUIRES_HUMAN_DOCUMENTARY_AND_PEDAGOGICAL_REVIEW'}
  try:row['candidates']=candidates(oa)
  except urllib.error.HTTPError as e:
   row['error']=str(e)[:250]
   if e.code==429:
    row['status']='RATE_LIMITED_RETRY_LATER'
  except Exception as e:row['error']=str(e)[:250]
  result.append(row)
  if i%25==0:print('Processed',i,'/',min(args.limit,len(catalog)),flush=True)
  time.sleep(args.delay)
 out=Path(args.out);out.parent.mkdir(parents=True,exist_ok=True)
 out.write_text(json.dumps({'source':'Wikimedia Commons API','count':len(result),
 'license_or_oa_approval_automatically_granted':False,'records':result},ensure_ascii=False,indent=2))
 print('OA queried:',len(result),'with candidates:',sum(bool(x['candidates']) for x in result),
       'errors:',sum('error' in x for x in result))
if __name__=='__main__':main()
