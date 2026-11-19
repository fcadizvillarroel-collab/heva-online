#!/usr/bin/env python3
"""Create and visually render 407 OA-specific DOCX/PPTX teaching prototypes.
All images are ORIGINAL SCHEMATIC DIAGRAMS, never documentary photographs.
The catalog's OA literal text is preserved. QA reports are evidence, not
a certification of historical/scientific accuracy or pedagogical suitability.
"""
import argparse, json, re, subprocess, sys, textwrap, zipfile, hashlib
from collections import Counter
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageStat
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from pptx import Presentation
from pptx.util import Inches, Pt as PptPt
from pptx.dml.color import RGBColor as PPTColor
import fitz
from oa_blueprints import blueprint
from oa_lessons import lesson

ROOT=Path(__file__).resolve().parents[1]
OFFICIAL_EPJA_SOURCES = {
 'Decreto 257': 'https://www.bcn.cl/leychile/navegar?idNorma=1005224',
 'Bases Curriculares EPJA 2024': 'https://epja.mineduc.cl/documentos-curriculares-epja/',
}
def curricular_source(oa):
 marco = str(oa.get('marco', '')).lower()
 if '257' in marco: return OFFICIAL_EPJA_SOURCES['Decreto 257']
 return OFFICIAL_EPJA_SOURCES['Bases Curriculares EPJA 2024']

NAVY=(35,58,76); TEAL=(31,116,120); CREAM=(250,246,238)
def font(size=32):
 for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'):
  if Path(f).exists(): return ImageFont.truetype(f,size)
 return ImageFont.load_default()
def wrap(text,width=75):
 return textwrap.wrap(str(text),width=width,break_long_words=False,break_on_hyphens=False)
def slug(s):
 return re.sub('[^a-zA-Z0-9]+','_',s)[:60].strip('_')
def diagram(oa,path):
 im=Image.new('RGB',(1200,600),CREAM); d=ImageDraw.Draw(im)
 d.rounded_rectangle((25,25,1175,575),radius=25,outline=TEAL,width=6)
 d.text((55,55),'ORGANIZADOR DIDÁCTICO · OA '+str(oa['_index']).zfill(3),font=font(31),fill=NAVY)
 verb=oa['texto_literal'].split(' ',1)[0].strip('.:,').upper()
 phases=[('COMPRENDER','¿Qué pide el objetivo?'),('APLICAR','¿Cómo se demuestra?'),('REVISAR','¿Qué evidencia lo prueba?')]
 for i,(name,subtitle) in enumerate(phases):
  x=60+i*370
  d.rounded_rectangle((x,180,x+350,430),radius=18,fill=(231,241,239),outline=TEAL,width=3)
  d.text((x+20,215),name,font=font(34),fill=NAVY)
  for j,line in enumerate(wrap(subtitle,27)): d.text((x+20,290+j*34),line,font=font(23),fill=NAVY)
 d.text((55,485),'Habilidad inicial del OA: '+verb[:45],font=font(27),fill=NAVY)
 im.save(path,optimize=True)
 return path
def addtext(slide,x,y,w,h,text,size=23,bold=False,color=NAVY):
 shape=slide.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h))
 tf=shape.text_frame;tf.word_wrap=True
 tf.margin_left=Inches(.08);tf.margin_top=Inches(.06)
 for i,line in enumerate(str(text).split('\n')):
  p=tf.paragraphs[0] if i==0 else tf.add_paragraph()
  p.text=line;p.font.name='Aptos';p.font.size=PptPt(size);p.font.bold=bold;p.font.color.rgb=PPTColor(*color)
 return shape
def create_ppt(oa,png,out):
 prs=Presentation();prs.slide_width=Inches(13.333);prs.slide_height=Inches(7.5)
 data=lesson(oa)
 def slide(title,body,footer='HEVA · BORRADOR DIDÁCTICO NO VALIDADO'):
  s=prs.slides.add_slide(prs.slide_layouts[6])
  addtext(s,.65,.38,12,.7,title,28,True)
  size=20 if len(body)<260 else (17 if len(body)<500 else (15 if len(body)<750 else 13))
  addtext(s,.78,1.32,11.8,4.95,body,size)
  addtext(s,.78,6.65,11.8,.45,footer,12,False,TEAL)
  return s
 slide('OBJETIVO DE APRENDIZAJE · '+str(oa['_index']).zfill(3),oa['asignatura']+' · '+oa['nivel']+'\n\n'+oa['texto_literal'])
 slide('¿Qué vamos a aprender?',data['explanation'])
 slide('Fuente curricular y alcance','Marco: '+oa['marco']+'\nPágina indicada en catálogo: '+str(oa.get('pagina_oficial','No indicada'))+'\nReferencia oficial: '+curricular_source(oa)+'\n\nLos casos son originales, no citas del decreto. Las imágenes son esquemas originales y no fotografías documentales.')
 s=slide('Organizador para aprender','Observa las tres acciones: comprender, aplicar y revisar.')
 picture=s.shapes.add_picture(str(png),Inches(1.1),Inches(2.1),width=Inches(10.8),height=Inches(4.0))
 picture._element.nvPicPr.cNvPr.set('descr','Organizador original de comprender, aplicar y revisar.')
 slide('Caso para pensar',data['scenario']+'\n\nPregunta: ¿cómo lo resolverías antes de ver la demostración?')
 slide('Orientación para resolver el OA',data['worked'])
 slide('Practiquemos', '\n\n'.join(str(i)+'. '+q for i,q in enumerate(data['questions'][:3],1)))
 slide('Cómo revisar tu trabajo','Comprueba que respondiste al objetivo, justificaste tus decisiones y verificaste el procedimiento. Compara tus resultados con la explicación trabajada en clase.')
 slide('Aplicación y cierre',data['questions'][3]+'\n\n'+data['exit_ticket']+'\n\n'+data['accessibility'])
 prs.save(out)
def create_doc(oa,png,out,teacher=False):
 doc=Document();sec=doc.sections[0];sec.top_margin=Cm(1.5);sec.bottom_margin=Cm(1.4)
 sec.left_margin=Cm(2);sec.right_margin=Cm(2)
 normal=doc.styles['Normal'];normal.font.name='Aptos';normal.font.size=Pt(12)
 data=lesson(oa)
 for name in ['Heading 1','Heading 2']:
  doc.styles[name].paragraph_format.space_after=Pt(3)
 doc.add_heading(('Pauta docente · OA ' if teacher else 'Guía de aprendizaje · OA ')+str(oa['_index']).zfill(3),0)
 doc.add_paragraph(oa['asignatura']+' · '+oa['nivel'])
 doc.add_heading('Objetivo curricular',level=1);doc.add_paragraph(oa['texto_literal'])
 doc.add_heading('Explicación para aprender',level=1);doc.add_paragraph(data['explanation'])
 picture=doc.add_picture(str(png),width=Cm(10.2))
 picture._inline.docPr.set('descr','Esquema original: comprender, aplicar y revisar.')
 doc.add_heading('Caso de ejemplo',level=1);doc.add_paragraph(data['scenario'])
 doc.add_heading('Orientación para resolver el OA',level=1);doc.add_paragraph(data['worked'])
 doc.add_heading('Actividades de práctica',level=1)
 for q in data['questions']:doc.add_paragraph(q,style='List Number')
 if teacher:
  doc.add_heading('Pauta docente: soluciones y criterios de revisión',level=1)
  for ans in data['answer_guide']:doc.add_paragraph(ans,style='List Number')
 else:
  doc.add_heading('Autoevaluación',level=1)
  doc.add_paragraph('¿Expliqué el procedimiento, justifiqué la respuesta y revisé mis resultados?')
 doc.add_heading('Apoyo de accesibilidad',level=1);doc.add_paragraph(data['accessibility'])
 doc.add_heading('Ticket de salida',level=1);doc.add_paragraph(data['exit_ticket'])
 doc.add_paragraph('Fuente curricular: '+oa['marco']+' · '+oa['fuente_documento']+' · página registrada: '+str(oa.get('pagina_oficial','No indicada')))
 doc.add_paragraph('Referencia oficial para cotejo: '+curricular_source(oa))
 doc.add_paragraph('Las imágenes son esquemas originales, no documentos históricos ni fotografías verificadas.')
 doc.add_paragraph('BORRADOR DIDÁCTICO NO VALIDADO. Los ejemplos son ilustrativos y requieren cotejo docente con el OA.')
 for paragraph in doc.paragraphs:
  paragraph.paragraph_format.space_after=Pt(3)
  paragraph.paragraph_format.space_before=Pt(0)
  paragraph.paragraph_format.line_spacing=1.05
 doc.save(out)
def data_answer_key_present(text,oa):
 return lesson(oa)['answer_guide'][0] in text

def render(folder,output):
 output.mkdir(parents=True,exist_ok=True)
 files=sorted(folder.glob('*.docx'))+sorted(folder.glob('*.pptx'))
 # Convert in batches to avoid enormous command lines.
 for i in range(0,len(files),40):
  cmd=['libreoffice','-env:UserInstallation=file:///tmp/heva_lo_qa','--headless','--convert-to','pdf','--outdir',str(output)]+list(map(str,files[i:i+40]))
  p=subprocess.run(cmd,capture_output=True,text=True,timeout=240)
  if p.returncode: raise RuntimeError('LibreOffice: '+p.stderr[-800:])
 return files
def inspect_pdf(pdf,expected_pages):
 if not pdf.exists():return {'error':'PDF absent'}
 with fitz.open(pdf) as d:
  issues=[]; pages=len(d)
  if pages not in (expected_pages if isinstance(expected_pages,(list,tuple)) else [expected_pages]):issues.append('Unexpected page count: '+str(pages))
  for n,p in enumerate(d):
   text=p.get_text().strip()
   if len(text)<45 and not p.get_images(full=True):issues.append('Page '+str(n+1)+' nearly empty')
   if n>0 and len(text)<180 and not p.get_images(full=True):issues.append('Page '+str(n+1)+' residual page with insufficient content ('+str(len(text))+' characters)')
   pix=p.get_pixmap(matrix=fitz.Matrix(.55,.55),alpha=False)
   im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
   stat=ImageStat.Stat(im)
   if max(stat.stddev)<5:issues.append('Page '+str(n+1)+' visually blank')
   # Check text extends beyond PDF canvas; this is structural, not a human review.
   for b in p.get_text('blocks'):
    if len(b)>4 and isinstance(b[4],str) and b[4].strip():
     if b[0]<-2 or b[1]<-2 or b[2]>p.rect.width+2 or b[3]>p.rect.height+2:
      issues.append('Page '+str(n+1)+' text outside canvas');break
  return {'pages':pages,'issues':issues}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--out',default='out/oa407');ap.add_argument('--limit',type=int,default=0)
 ap.add_argument('--skip-render',action='store_true');args=ap.parse_args()
 catalog=json.loads((ROOT/'catalogo-publicado.json').read_text())
 assert len(catalog)==407 and len({x['clave_interna'] for x in catalog})==407
 out=Path(args.out).resolve();(out/'docx').mkdir(parents=True,exist_ok=True)
 (out/'pptx').mkdir(exist_ok=True);(out/'assets').mkdir(exist_ok=True)
 (out/'docx_docente').mkdir(exist_ok=True)
 count=args.limit or len(catalog);records=[]
 for i,oa in enumerate(catalog[:count],1):
  oa=dict(oa,_index=i);key=str(i).zfill(3)+'_'+hashlib.sha256(oa['clave_interna'].encode()).hexdigest()[:10]
  png=out/'assets'/(key+'.png');diagram(oa,png)
  doc=out/'docx'/(key+'.docx');ppt=out/'pptx'/(key+'.pptx')
  create_doc(oa,png,doc);create_ppt(oa,png,ppt)
  teacher_doc=out/'docx_docente'/(key+'_docente.docx')
  create_doc(oa,png,teacher_doc,teacher=True)
  # Teacher answer keys must never appear in student handouts.
  student_text='\n'.join(x.text for x in Document(doc).paragraphs)
  teacher_text='\n'.join(x.text for x in Document(teacher_doc).paragraphs)
  assert 'Pauta docente: soluciones y criterios de revisión' not in student_text
  assert 'Pauta docente: soluciones y criterios de revisión' in teacher_text
  assert data_answer_key_present(teacher_text,oa)
  records.append({'blueprint':blueprint(oa),'oa':oa['clave_interna'],'subject':oa['asignatura'],'docx':doc.name,'docx_docente':teacher_doc.name,'pptx':ppt.name,
   'visual':png.name,'visual_kind':'original_educational_diagram','documentary_source_verified':False,'curricular_reference_url':curricular_source(oa),'curricular_page_catalog':oa.get('pagina_oficial','')})
 if not args.skip_render:
  docpdf=out/'pdf_docx';pptpdf=out/'pdf_pptx';teacherpdf=out/'pdf_docx_docente';render(out/'docx',docpdf);render(out/'pptx',pptpdf);render(out/'docx_docente',teacherpdf)
  for record in records:
   d=inspect_pdf(docpdf/(Path(record['docx']).stem+'.pdf'),(1,2,3,4,5))
   t=inspect_pdf(teacherpdf/(Path(record['docx_docente']).stem+'.pdf'),(1,2,3,4,5,6))
   p=inspect_pdf(pptpdf/(Path(record['pptx']).stem+'.pdf'),9)
   record['render_docx']=d;record['render_docx_docente']=t;record['render_pptx']=p
   record['pass']=not any(z.get('error') or z.get('issues') for z in (d,t,p))
 else:
  for record in records:record['pass']=None
 report={'expected_catalog_count':407,'generated':len(records),
  'passed':sum(r['pass'] is True for r in records),'failed':sum(r['pass'] is False for r in records),
  'rendered':not args.skip_render,'records':records,
  'separate_teacher_keys':len(records),
  'documentary_sources_verified':sum(bool(r['documentary_source_verified']) for r in records),
  'needs_documentary_verification':sum(not r['documentary_source_verified'] for r in records),
  'human_visual_reviews_completed':0,
  'expert_pedagogical_approvals':0,
  'limitations':['Original diagrams are not documentary photos or source-verified maps.',
   'Automated rendering cannot replace human pedagogical and visual review.']}
 (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 with zipfile.ZipFile(out/'heva_oa407_docx_pptx.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=5) as z:
  for sub in ('docx','docx_docente','pptx'):
   for file in (out/sub).iterdir():z.write(file,sub+'/'+file.name)
 print(json.dumps({k:v for k,v in report.items() if k!='records'},ensure_ascii=False))
 if report['failed']:
  print('FAILED RECORDS:',json.dumps([r for r in records if r['pass'] is False],ensure_ascii=False))
  sys.exit(1)
if __name__=='__main__':main()
