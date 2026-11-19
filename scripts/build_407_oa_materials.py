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

ROOT=Path(__file__).resolve().parents[1]
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
  x=60+i*390
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
 def slide(): return prs.slides.add_slide(prs.slide_layouts[6])
 s=slide();addtext(s,.7,.5,12,1,'OBJETIVO DE APRENDIZAJE · '+str(oa['_index']).zfill(3),30,True)
 addtext(s,.7,1.55,12,.5,oa['asignatura']+' · '+oa['nivel'],18,False,TEAL)
 txt=oa['texto_literal']
 size=22 if len(txt)>350 else 25 if len(txt)>220 else 29
 addtext(s,.7,2.3,11.8,3.55,txt,size)
 addtext(s,.7,6.35,12,.55,oa['marco']+' · '+oa['fuente_documento'],14,False,TEAL)
 s=slide();addtext(s,.7,.35,12,.7,'COMPRENDER · APLICAR · REVISAR',29,True)
 picture=s.shapes.add_picture(str(png),Inches(.85),Inches(1.3),width=Inches(11.65),height=Inches(5.1))
 picture._element.nvPicPr.cNvPr.set('descr','Esquema original del objetivo '+str(oa['_index'])+': comprender, aplicar y revisar.')
 s=slide();addtext(s,.7,.45,12,.8,'Actividad de aplicación',30,True)
 addtext(s,.8,1.65,11.7,3.8,
  '1. Explica con tus palabras qué solicita el objetivo.\n'
  '2. Propón una situación de tu vida adulta, ciudadana o laboral en que se aplique.\n'
  '3. Describe cómo comprobarías que lo lograste.',24)
 addtext(s,.8,6.35,11.8,.55,'Ticket de salida: ¿qué aprendiste y qué necesitas practicar?',17,False,TEAL)
 prs.save(out)
def create_doc(oa,png,out):
 doc=Document();sec=doc.sections[0];sec.top_margin=Cm(1.8);sec.bottom_margin=Cm(1.6)
 sec.left_margin=Cm(2);sec.right_margin=Cm(2)
 normal=doc.styles['Normal'];normal.font.name='Aptos';normal.font.size=Pt(10.5)
 doc.add_heading('Guía breve de aprendizaje · OA '+str(oa['_index']).zfill(3),0)
 doc.add_paragraph(oa['asignatura']+' · '+oa['nivel'])
 doc.add_heading('Objetivo curricular',level=1);doc.add_paragraph(oa['texto_literal'])
 picture=doc.add_picture(str(png),width=Cm(15.4))
 picture._inline.docPr.set('descr','Organizador del objetivo '+str(oa['_index'])+': comprender, aplicar y revisar.')
 doc.add_heading('Comprender y aplicar',level=1)
 for q in ('¿Qué habilidad solicita este objetivo? Explica con tus palabras.',
           'Describe un ejemplo concreto relacionado con tu vida cotidiana, laboral o ciudadana.',
           '¿Qué evidencia permitiría comprobar que lograste el objetivo?'):
  doc.add_paragraph(q,style='List Number')
 doc.add_paragraph('Fuente curricular: '+oa['marco']+' · '+oa['fuente_documento'])
 doc.save(out)
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
 count=args.limit or len(catalog);records=[]
 for i,oa in enumerate(catalog[:count],1):
  oa=dict(oa,_index=i);key=str(i).zfill(3)+'_'+hashlib.sha256(oa['clave_interna'].encode()).hexdigest()[:10]
  png=out/'assets'/(key+'.png');diagram(oa,png)
  doc=out/'docx'/(key+'.docx');ppt=out/'pptx'/(key+'.pptx')
  create_doc(oa,png,doc);create_ppt(oa,png,ppt)
  records.append({'oa':oa['clave_interna'],'subject':oa['asignatura'],'docx':doc.name,'pptx':ppt.name,
   'visual':png.name,'visual_kind':'original_educational_diagram','documentary_source_verified':False})
 if not args.skip_render:
  docpdf=out/'pdf_docx';pptpdf=out/'pdf_pptx';render(out/'docx',docpdf);render(out/'pptx',pptpdf)
  for record in records:
   d=inspect_pdf(docpdf/(Path(record['docx']).stem+'.pdf'),(1,2))
   p=inspect_pdf(pptpdf/(Path(record['pptx']).stem+'.pdf'),3)
   record['render_docx']=d;record['render_pptx']=p
   record['pass']=not d.get('error') and not p.get('error') and not d.get('issues') and not p.get('issues')
 else:
  for record in records:record['pass']=None
 report={'expected_catalog_count':407,'generated':len(records),
  'passed':sum(r['pass'] is True for r in records),'failed':sum(r['pass'] is False for r in records),
  'rendered':not args.skip_render,'records':records,
  'limitations':['Original diagrams are not documentary photos or source-verified maps.',
   'Automated rendering cannot replace human pedagogical and visual review.']}
 (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 with zipfile.ZipFile(out/'heva_oa407_docx_pptx.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=5) as z:
  for sub in ('docx','pptx'):
   for file in (out/sub).iterdir():z.write(file,sub+'/'+file.name)
 print(json.dumps({k:v for k,v in report.items() if k!='records'},ensure_ascii=False))
 if report['failed']:sys.exit(1)
if __name__=='__main__':main()
