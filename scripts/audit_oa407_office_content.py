#!/usr/bin/env python3
"""Automated 407-OA content/accessibility checks on generated Office files.

A technical audit, not a substitute for specialist pedagogical or human visual review.
"""
import argparse, csv, json, re
from pathlib import Path
from docx import Document
from pptx import Presentation

def audit(root, output):
    report = json.loads((root / "report.json").read_text(encoding="utf-8"))
    records = report["records"]
    if len(records) != 407:
        raise ValueError("Expected 407 records")
    rows = []
    for rec in records:
        student = Document(root / "docx" / rec["docx"])
        teacher = Document(root / "docx_docente" / rec["docx_docente"])
        slides = Presentation(root / "pptx" / rec["pptx"])
        student_text = "\n".join(p.text for p in student.paragraphs)
        teacher_text = "\n".join(p.text for p in teacher.paragraphs)
        ppt_text = "\n".join(shape.text for slide in slides.slides for shape in slide.shapes if shape.has_text_frame)
        problems = []
        if "Pauta docente: soluciones y criterios de revisión" in student_text:
            problems.append("TEACHER_KEY_IN_STUDENT_GUIDE")
        if "Pauta docente: soluciones y criterios de revisión" not in teacher_text:
            problems.append("MISSING_TEACHER_KEY")
        if "Autoevaluación" not in student_text:
            problems.append("MISSING_STUDENT_SELF_ASSESSMENT")
        if "Referencia oficial para cotejo:" not in student_text:
            problems.append("MISSING_CURRICULAR_REFERENCE_DOCX")
        if "Referencia oficial:" not in ppt_text:
            problems.append("MISSING_CURRICULAR_REFERENCE_PPTX")
        if len(slides.slides) != 9:
            problems.append("UNEXPECTED_SLIDE_COUNT")
        if not any(p.text.startswith("Apoyo de accesibilidad") for p in student.paragraphs):
            problems.append("MISSING_ACCESSIBILITY_SUPPORT")
        if not any(p.text.startswith("Actividades de práctica") for p in student.paragraphs):
            problems.append("MISSING_PRACTICE")
        doc_images = student.inline_shapes
        if not doc_images:
            problems.append("MISSING_DOCX_DIAGRAM")
        if not any("descr" in shape._element.xml for slide in slides.slides for shape in slide.shapes if shape.shape_type == 13):
            problems.append("MISSING_PPT_IMAGE_ALT")
        rows.append({
            "clave_interna": rec["oa"],
            "guia_estudiante": rec["docx"],
            "pauta_docente": rec["docx_docente"],
            "presentacion": rec["pptx"],
            "revisiones_automatizadas": 10,
            "resultado": "APROBADO_TECNICAMENTE" if not problems else "REVISAR",
            "hallazgos": "|".join(problems),
            "revision_pedagogica_experta": "NO_ACREDITADA",
            "revision_visual_humana": "NO_ACREDITADA",
        })
    output.mkdir(parents=True, exist_ok=True)
    with (output / "auditoria_accesibilidad_contenido_407.csv").open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    summary = {
        "objetivos": len(rows),
        "sin_hallazgos_automaticos": sum(r["resultado"] == "APROBADO_TECNICAMENTE" for r in rows),
        "con_hallazgos": sum(r["resultado"] == "REVISAR" for r in rows),
        "hallazgos_por_tipo": {p: sum(p in r["hallazgos"].split("|") for r in rows) for p in sorted(set("|".join(r["hallazgos"] for r in rows).split("|")) - {""})},
        "alcance": "Controles de presencia y separación de contenido, referencia, accesibilidad y estructura; no prueba calidad disciplinar."
    }
    (output / "resumen_accesibilidad_contenido.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))
    if summary["con_hallazgos"]:
        raise SystemExit("Automated findings in " + str(summary["con_hallazgos"]) + " OA")
    return summary

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("root")
    parser.add_argument("output")
    args = parser.parse_args()
    audit(Path(args.root), Path(args.output))
