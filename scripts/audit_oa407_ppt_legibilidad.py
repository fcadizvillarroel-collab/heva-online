#!/usr/bin/env python3
"""Per-slide QA of all 407 rendered HEVA presentations.

Measures PPTX body typography and text density in editable slide sources.
Flags are review/improvement leads, not human visual certification.
"""
import csv
import json
import sys
from collections import Counter
from pathlib import Path

from pptx import Presentation
from pptx.util import Inches

MIN_BODY_FONT = 20.0
MAX_BODY_CHARACTERS = 750

def inspect(root, output):
    report = json.loads((root / "report.json").read_text(encoding="utf-8"))
    records = report["records"]
    if len(records) != 407:
        raise ValueError("Expected 407 presentations")
    rows = []
    per_oa = []
    for rec in records:
        pptx = root / "pptx" / rec["pptx"]
        presentation = Presentation(pptx)
        picture_slides = 0
        flags_by_oa = set()
        for slide_idx, slide in enumerate(presentation.slides, 1):
            titles = [shape.text.strip() for shape in slide.shapes
                      if shape.has_text_frame and shape.top < Inches(1.1) and shape.text.strip()]
            bodies = [shape for shape in slide.shapes
                      if shape.has_text_frame and Inches(1.1) <= shape.top < Inches(6.45)]
            content = "\n".join(shape.text for shape in bodies)
            # The exporter sets font on the paragraph; runs often inherit that size.
            # Check both explicit run and inherited paragraph sizes to avoid false 0-alert reports.
            sizes = []
            for shape in bodies:
                for paragraph in shape.text_frame.paragraphs:
                    for run in paragraph.runs:
                        if run.text.strip():
                            effective_size = run.font.size or paragraph.font.size
                            if effective_size is not None:
                                sizes.append(effective_size.pt)
            pictures = sum(1 for shape in slide.shapes if shape.shape_type == 13)
            picture_slides += int(pictures > 0)
            slide_flags = []
            if sizes and min(sizes) < MIN_BODY_FONT:
                slide_flags.append("CUERPO_INFERIOR_20_PT")
            if not sizes and content.strip():
                slide_flags.append("CUERPO_SIN_TAMANO_EXPLICITO")
            if len(content.strip()) > MAX_BODY_CHARACTERS:
                slide_flags.append("EXCESO_TEXTO_EN_DIAPOSITIVA")
            if not content.strip() and not pictures:
                slide_flags.append("SIN_CONTENIDO_EXPLICATIVO")
            flags_by_oa.update(slide_flags)
            rows.append({
                "clave_interna": rec["oa"], "pptx": rec["pptx"], "diapositiva": slide_idx,
                "titulo": " | ".join(titles)[:180], "caracteres_cuerpo": len(content.strip()),
                "fuente_minima_cuerpo_pt": min(sizes) if sizes else "",
                "imagenes_o_diagramas": pictures, "alertas": "|".join(slide_flags),
                "inspeccion_visual_humana": "NO_ACREDITADA"})
        if picture_slides < 2:
            flags_by_oa.add("POCA_EVIDENCIA_VISUAL_VARIADA")
        per_oa.append({
            "clave_interna": rec["oa"], "pptx": rec["pptx"],
            "diapositivas": len(presentation.slides),
            "diapositivas_con_imagenes": picture_slides,
            "alertas": "|".join(sorted(flags_by_oa)),
            "revision_visual_humana": "PENDIENTE"})
    output.mkdir(parents=True, exist_ok=True)
    for name, data in (("auditoria_legibilidad_diapositivas_407.csv", rows),
                       ("prioridades_visuales_por_oa_407.csv", per_oa)):
        with (output / name).open("w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=list(data[0]))
            writer.writeheader()
            writer.writerows(data)
    counts = Counter(flag for row in rows for flag in row["alertas"].split("|") if flag)
    summary = {
        "objetivos": len(per_oa), "diapositivas_inspeccionadas": len(rows),
        "diapositivas_con_cuerpo_menor_20_pt": counts["CUERPO_INFERIOR_20_PT"],
        "diapositivas_con_exceso_texto": counts["EXCESO_TEXTO_EN_DIAPOSITIVA"],
        "presentaciones_con_pocos_visuales": sum(
            "POCA_EVIDENCIA_VISUAL_VARIADA" in x["alertas"] for x in per_oa),
        "presentaciones_con_alertas": sum(bool(x["alertas"]) for x in per_oa),
        "revisiones_visuales_humanas": 0,
        "alcance": "Medición programática de las diapositivas editables; no evalúa contrastes, precisión gráfica, diseño ni legibilidad por una persona."
    }
    (output / "resumen_legibilidad_ppt_407.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))
    return summary

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python audit_oa407_ppt_legibilidad.py <root> <output>")
    inspect(Path(sys.argv[1]), Path(sys.argv[2]))
