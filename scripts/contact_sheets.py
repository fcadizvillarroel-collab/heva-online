#!/usr/bin/env python3
"""Create numbered contact sheets of every rendered DOCX/PPTX PDF page."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import fitz,sys,math
root=Path(sys.argv[1] if len(sys.argv)>1 else 'out/oa407')
out=root/'contact_sheets';out.mkdir(parents=True,exist_ok=True)
files=(sorted((root/'pdf_docx').glob('*.pdf'))
       +sorted((root/'pdf_docx_docente').glob('*.pdf'))
       +sorted((root/'pdf_pptx').glob('*.pdf')))
tiles=[];sheet_index=0;page_count=0
def save_sheet(items,index):
 if not items:return
 w,h=280,245;cols=5;rows=math.ceil(len(items)/cols)
 canvas=Image.new('RGB',(cols*w,rows*h),'#e9e9e9');draw=ImageDraw.Draw(canvas)
 for i,(img,label) in enumerate(items):
  x=(i%cols)*w;y=(i//cols)*h
  canvas.paste(img,(x+8,y+8));draw.text((x+8,y+213),label[:37],fill='#151515')
 canvas.save(out/('pages_%03d.jpg'%index),quality=85)
for pdf in files:
 with fitz.open(pdf) as doc:
  for n,page in enumerate(doc):
   pix=page.get_pixmap(matrix=fitz.Matrix(.29,.29),alpha=False)
   im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
   im.thumbnail((264,196))
   tiles.append((im,pdf.parent.name+'/'+pdf.stem[:16]+' p'+str(n+1)))
   page_count+=1
   if len(tiles)==50:
    save_sheet(tiles,sheet_index);sheet_index+=1;tiles=[]
save_sheet(tiles,sheet_index)
print('Rendered page thumbnails:',page_count,'contact sheets:',sheet_index+bool(tiles))
