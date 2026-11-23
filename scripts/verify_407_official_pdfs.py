#!/usr/bin/env python3
"""Compare each OA literally against text extracted from official EPJA PDFs.

A match is independent documentary evidence, not expert disciplinary approval.
PDF page labels in the catalog may differ from zero-based PDF page indices.
"""
import csv,hashlib,io,json,re,sys,unicodedata,urllib.request
from pathlib import Path
from pypdf import PdfReader
import fitz
ROOT=Path(__file__).resolve().parents[1]
SOURCES={
 "Decreto 257":("D257","https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-332178_recurso_pdf.pdf"),
 "Bases 2024":("EPJA2024","https://aprendoenlinea.mineduc.gob.cl/sites/default/files/adjuntos/recursos/2024-12/bbcc-EPJA_web_v11%20fi.pdf")
}
def normalize(s):
 s=unicodedata.normalize("NFKD",str(s)).lower()
 s="".join(x for x in s if not unicodedata.combining(x))
 return re.sub(r"[^a-z0-9]+","",s)
def candidate_page(literal,pages):
 # Candidate from long exact character anchors, not a textual match or approval.
 normalized=normalize(literal)
 if len(normalized)<45:return None,0,0
 width=min(42,max(26,len(normalized)//8))
 extent=len(normalized)-width
 starts=sorted({round(extent*i/7) for i in range(8)})
 anchors=[normalized[start:start+width] for start in starts]
 scored=[(sum(anchor in page for anchor in anchors),idx+1) for idx,page in enumerate(pages)]
 best_count,best_page=max(scored,key=lambda candidate:candidate[0],default=(0,0))
 return (best_page if best_count>=2 and best_count/len(anchors)>=0.25 else None,
         best_count,len(anchors))

def fetch(url):
 req=urllib.request.Request(url,headers={"User-Agent":"HEVA-EPJA-curricular-audit/1.0"})
 with urllib.request.urlopen(req,timeout=75) as f:
  data=f.read(35*1024*1024+1)
 if len(data)>35*1024*1024 or not data.startswith(b"%PDF"):
  raise ValueError("PDF unavailable or oversized")
 return data
def run(out):
 out.mkdir(parents=True,exist_ok=True)
 catalog=json.loads((ROOT/"catalogo-publicado.json").read_text(encoding="utf-8"))
 assert len(catalog)==407
 docs={};issues=[]
 for framework,(sid,url) in SOURCES.items():
  try:
   data=fetch(url)
   pdf=PdfReader(io.BytesIO(data))
   # Prefer PyMuPDF for layout and fall back to pypdf for encrypted PDFs.
   try:
    with fitz.open(stream=data,filetype="pdf") as f:
     pages=[normalize(page.get_text(sort=True)) for page in f]
   except Exception:
    pages=[normalize(p.extract_text() or "") for p in pdf.pages]
   # Some objectives cross a PDF page break. Search adjacent pages without inventing a page number.
   page_pairs=[pages[i]+(pages[i+1] if i+1<len(pages) else "") for i in range(len(pages))]
   docs[framework]={"id":sid,"url":url,"sha256":hashlib.sha256(data).hexdigest(),"pages":pages,"page_pairs":page_pairs}
  except Exception as e:
   issues.append({"fuente":framework,"problema":type(e).__name__+": "+str(e)[:160]})
 rows=[]
 for oa in catalog:
  framework=oa["marco"]
  doc=docs.get(framework)
  literal=normalize(oa["texto_literal"])
  # Compare with both engines when PDF text order differs from printed order.
  hits=[i+1 for i,p in enumerate(doc["pages"]) if literal and literal in p] if doc else []
  cross=[i+1 for i,p in enumerate(doc["page_pairs"][:-1]) if literal and literal in p and (i+1) not in hits] if doc and not hits else []
  # PDF extraction can split words across page boundaries; do not treat absence as factual contradiction.
  status="COINCIDENCIA_LITERAL_PDF" if hits else ("COINCIDENCIA_ENTRE_PAGINAS" if cross else ("NO_LOCALIZADO_EN_EXTRACCION" if doc else "PDF_NO_DISPONIBLE"))
  # A plausible source page is a queue for a human reader, NEVER a verified
  # match. It must not increase 'coincidencia_literal_pdf'.
  candidate,anchors,total_anchors=candidate_page(oa["texto_literal"],doc["pages"]) if doc and not (hits or cross) else (None,0,0)
  rows.append({"clave_interna":oa["clave_interna"],"marco":framework,"asignatura":oa["asignatura"],
   "pagina_catalogo":oa.get("pagina_oficial",""),"paginas_pdf_coincidentes":"|".join(map(str,hits or cross)),
   "pagina_pdf_candidata_no_verificada":candidate or "",
   "anclas_candidata":anchors,"anclas_probadas":total_anchors,
   "resultado":status,"url_original":doc["url"] if doc else SOURCES.get(framework,("", ""))[1],
   "sha256_pdf_original":doc["sha256"] if doc else "",
   "texto_objetivo":oa["texto_literal"]})
 with (out/"contraste_oa_fuentes_originales_407.csv").open("w",newline="",encoding="utf-8-sig") as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
 summary={"objetivos":len(rows),"coincidencia_literal_pdf":sum(r["resultado"]=="COINCIDENCIA_LITERAL_PDF" for r in rows),
 "coincidencia_entre_paginas":sum(r["resultado"]=="COINCIDENCIA_ENTRE_PAGINAS" for r in rows),
 "no_localizados_en_texto_extraido":sum(r["resultado"]=="NO_LOCALIZADO_EN_EXTRACCION" for r in rows),
 "pdf_no_disponible":sum(r["resultado"]=="PDF_NO_DISPONIBLE" for r in rows),
 "no_localizados_con_pagina_candidata":sum(r["resultado"]=="NO_LOCALIZADO_EN_EXTRACCION" and bool(r["pagina_pdf_candidata_no_verificada"]) for r in rows),
 "no_localizados_sin_pagina_candidata":sum(r["resultado"]=="NO_LOCALIZADO_EN_EXTRACCION" and not r["pagina_pdf_candidata_no_verificada"] for r in rows),
 "fuentes":[{"marco":k,"id":v["id"],"url":v["url"],"sha256":v["sha256"],"paginas":len(v["pages"])} for k,v in docs.items()],
 "problemas_descarga":issues,
 "alcance":"Coincidencias literales con PDF ministerial; las páginas candidatas por anclas son pistas NO VERIFICADAS, no prueba exactitud de explicaciones ni ejemplos."}
 (out/"resumen_contraste_fuentes.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
 print(json.dumps(summary,ensure_ascii=False))
 if summary["objetivos"]!=407:raise SystemExit(1)
if __name__=="__main__":run(Path(sys.argv[1] if len(sys.argv)>1 else "out/contraste_fuentes"))
