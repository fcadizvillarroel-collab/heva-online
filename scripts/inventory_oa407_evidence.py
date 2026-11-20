#!/usr/bin/env python3
"""Evidence inventory of every actual rendered page, curricular source metadata and visual flags.

These are reproducible measurements, NOT claims of human inspection or source fact-checking.
"""
import argparse, csv, json, hashlib
from collections import Counter
from pathlib import Path
import fitz

BCN="https://www.bcn.cl/leychile/navegar?idNorma=1005224"
MINEDUC="https://epja.mineduc.cl/documentos-curriculares-epja/"
def run(root, output):
    catalog=json.loads((Path(__file__).resolve().parents[1]/"catalogo-publicado.json").read_text(encoding="utf-8"))
    report=json.loads((root/"report.json").read_text(encoding="utf-8"))
    byid={o["clave_interna"]:o for o in catalog}
    if len(byid)!=407 or len(report["records"])!=407:
        raise ValueError("Expected 407 unique OA")
    rows=[];pages=[]
    for rec in report["records"]:
        oa=byid[rec["oa"]]
        page=str(oa.get("pagina_oficial","")).strip()
        source=BCN if "257" in oa["marco"] else MINEDUC
        notes=[]
        if not page.isdigit():
            notes.append("CURRICULAR_PAGE_NOT_NUMERIC")
        if not oa["texto_literal"].strip():
            notes.append("MISSING_LITERAL_OA")
        if not oa.get("fuente_documento"):
            notes.append("MISSING_SOURCE_LABEL")
        row={"clave_interna":rec["oa"],"marco":oa["marco"],"fuente_catalogo":oa.get("fuente_documento",""),
             "pagina_catalogo":page,"enlace_referencia":source,
             "cotejo_literal_con_documento_oficial":"NO_ACREDITADO",
             "cotejo_exactitud_disciplinar":"NO_ACREDITADO",
             "fuentes_especificas_del_caso":"COTEJO_FOCALIZADO_DE_HECHOS_NO_EXHAUSTIVO" if rec.get("fuentes_cotejadas_para_hechos_puntuales") else "NO_ACREDITADAS",
             "enlaces_de_cotejo_focalizado":" | ".join(item["url"] for item in rec.get("fuentes_cotejadas_para_hechos_puntuales",[])),
             "hallazgos_metadatos":"|".join(notes)}
        for folder,filename in (("pdf_docx",rec["docx"]),("pdf_docx_docente",rec["docx_docente"]),("pdf_pptx",rec["pptx"])):
            path=root/folder/(Path(filename).stem+".pdf")
            with fitz.open(path) as pdf:
                for n,p in enumerate(pdf):
                    text=p.get_text()
                    spans=[s for b in p.get_text("dict")["blocks"] if "lines" in b for line in b["lines"] for s in line["spans"] if s["text"].strip()]
                    min_font=round(min((s["size"] for s in spans),default=0),1)
                    n_chars=len(text.strip())
                    bounds=any((s["bbox"][0]<-1 or s["bbox"][1]<-1 or s["bbox"][2]>p.rect.width+1 or s["bbox"][3]>p.rect.height+1) for s in spans)
                    flags=[]
                    if min_font<10:flags.append("FONT_UNDER_10PT")
                    if folder=="pdf_pptx" and min_font<14:flags.append("SLIDE_FONT_UNDER_14PT")
                    if n_chars<45 and not p.get_images():flags.append("NEARLY_EMPTY")
                    if bounds:flags.append("TEXT_OUT_OF_PAGE")
                    pages.append({"clave_interna":rec["oa"],"tipo":folder,"archivo_pdf":path.name,"pagina":n+1,
                                  "caracteres":n_chars,"fuente_min_pt":min_font,
                                  "imagenes":len(p.get_images()),"hallazgos": "|".join(flags),
                                  "inspeccion_visual_humana":"NO_ACREDITADA"})
        rows.append(row)
    output.mkdir(parents=True,exist_ok=True)
    for name,data in (("procedencia_curricular_407.csv",rows),("inventario_visual_paginas_407.csv",pages)):
        with (output/name).open("w",encoding="utf-8-sig",newline="") as f:
            w=csv.DictWriter(f,fieldnames=list(data[0]));w.writeheader();w.writerows(data)
    visual_counts=Counter(flag for p in pages for flag in p["hallazgos"].split("|") if flag)
    summary={"alertas_visuales_por_tipo":dict(sorted(visual_counts.items())),"objetivos":len(rows),"paginas_pdf_inventariadas":len(pages),
             "paginas_con_alertas_visuales_automaticas":sum(bool(p["hallazgos"]) for p in pages),
             "objetivos_con_metadatos_incompletos":sum(bool(r["hallazgos_metadatos"]) for r in rows),
             "cotejos_oficiales_independientes":0,
             "casos_con_cotejo_focalizado_de_hechos":sum(bool(r.get("fuentes_cotejadas_para_hechos_puntuales")) for r in report["records"]),
             "revisiones_visuales_humanas":0,
             "advertencia":"Mediciones por página y enlaces oficiales no acreditan revisión documental ni juicio pedagógico."}
    (output/"resumen_inventario_visual_y_fuentes.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False))
    return summary
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("root");p.add_argument("output");a=p.parse_args()
    run(Path(a.root),Path(a.output))
