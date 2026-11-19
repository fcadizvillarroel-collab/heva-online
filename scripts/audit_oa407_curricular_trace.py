#!/usr/bin/env python3
"""Verify literal curricular coverage and individual case uniqueness in 407 rendered files.

This checks deterministic identity and content presence; it does not claim factual correctness.
"""
import argparse, csv, json, hashlib, re
from pathlib import Path
from docx import Document
from pptx import Presentation

def normalize(s):
    return re.sub(r"\s+", " ", str(s)).strip()

def run(root, output):
    catalog=json.loads((Path(__file__).resolve().parents[1]/"catalogo-publicado.json").read_text(encoding="utf-8"))
    report=json.loads((root/"report.json").read_text(encoding="utf-8"))
    from sys import path
    path.insert(0,str(Path(__file__).resolve().parent))
    from oa_lessons import lesson
    if len(catalog)!=407 or len(report["records"])!=407:
        raise ValueError("Coverage mismatch")
    by_id={o["clave_interna"]:o for o in catalog}
    rows=[];scenario_hashes={}
    for record in report["records"]:
        key=record["oa"]
        oa=by_id[key]
        l=lesson(oa)
        scenario_hash=hashlib.sha256(normalize(l["scenario"]).encode()).hexdigest()
        scenario_hashes.setdefault(scenario_hash,[]).append(key)
        student=Document(root/"docx"/record["docx"])
        teacher=Document(root/"docx_docente"/record["docx_docente"])
        ppt=Presentation(root/"pptx"/record["pptx"])
        student_text=normalize(" ".join(p.text for p in student.paragraphs))
        teacher_text=normalize(" ".join(p.text for p in teacher.paragraphs))
        ppt_text=normalize(" ".join(shape.text for slide in ppt.slides for shape in slide.shapes if shape.has_text_frame))
        checks={
          "objetivo_literal_guia": normalize(oa["texto_literal"]) in student_text,
          "objetivo_literal_ppt": normalize(oa["texto_literal"]) in ppt_text,
          "caso_individual_guia": normalize(l["scenario"]) in student_text,
          "caso_individual_ppt": normalize(l["scenario"]) in ppt_text,
          "solucion_pauta_docente": normalize(l["answer_guide"][0]) in teacher_text,
          "transferencia_guia": normalize(l["transfer"]) in student_text,
          "fuente_curricular_guia": "Referencia oficial para cotejo:" in student_text,
          "fuente_curricular_ppt": "Referencia oficial:" in ppt_text,
        }
        rows.append({"clave_interna":key,**checks,"fallas":"|".join(k for k,v in checks.items() if not v)})
    duplicates={k:v for k,v in scenario_hashes.items() if len(v)>1}
    output.mkdir(parents=True,exist_ok=True)
    with (output/"trazabilidad_curricular_407.csv").open("w",encoding="utf-8-sig",newline="") as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
    summary={
      "objetivos_auditados":len(rows),
      "sin_fallas_de_trazabilidad":sum(not r["fallas"] for r in rows),
      "con_fallas_de_trazabilidad":sum(bool(r["fallas"]) for r in rows),
      "casos_identicos_repetidos":sum(len(v)-1 for v in duplicates.values()),
      "alcance":"Presencia exacta de OA, caso, transferencia y pauta en archivos reales; no certifica exactitud pedagógica."
    }
    (output/"resumen_trazabilidad_curricular.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False))
    if summary["con_fallas_de_trazabilidad"] or summary["casos_identicos_repetidos"]:
        raise SystemExit("Content traceability audit failed")

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("root");p.add_argument("output");a=p.parse_args()
    run(Path(a.root),Path(a.output))
