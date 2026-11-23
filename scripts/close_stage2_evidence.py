#!/usr/bin/env python3
"""Evidence-based stage-2 closure: 407 curricular objectives, no approval by assumption.

Automated checks are useful triage; human disciplinary/source/visual reviews
must have separate, traceable evidence before a lesson is called validated.
"""
import csv
import json
import re
import sys
from collections import Counter
from datetime import date
from urllib.parse import urlsplit
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from oa_curated_cases import CASES
from oa_lessons import lesson

CATALOG = json.loads((ROOT / "catalogo-publicado.json").read_text(encoding="utf-8"))
FIELDS = (
    "clave_interna", "asignatura", "nivel", "objetivo_literal",
    "fuente_curricular", "pagina_curricular", "caso_individual",
    "solucion_modelo", "actividad_transferencia",
    "alcance_amplio", "requiere_texto_o_fuente_autentica",
    "requiere_evidencia_visual_documental", "requiere_revision_normativa",
    "revision_pedagogica", "revision_documental", "revision_visual",
    "revision_respuestas", "revisor_pedagogico", "revisor_documental",
    "revisor_visual", "revisor_respuestas", "fecha_revision_pedagogica",
    "fecha_revision_documental", "fecha_revision_visual", "fecha_revision_respuestas",
    "evidencia_pedagogica", "evidencia_documental",
    "evidencia_visual", "evidencia_respuestas", "estado_final", "pendientes"
)
APPROVED = "APROBADO"
PENDING = "PENDIENTE"
GATES = (
    ("revision_pedagogica", "revisor_pedagogico", "evidencia_pedagogica", "fecha_revision_pedagogica"),
    ("revision_documental", "revisor_documental", "evidencia_documental", "fecha_revision_documental"),
    ("revision_visual", "revisor_visual", "evidencia_visual", "fecha_revision_visual"),
    ("revision_respuestas", "revisor_respuestas", "evidencia_respuestas", "fecha_revision_respuestas"),
)
def valid_reviewer(value):
    name=str(value or "").strip()
    return len(name)>=6 and " " in name and name.casefold() not in {"docente","revisor","por definir","pendiente","sin nombre","test","n/a"}

def valid_date(value):
    try:
        literal=str(value or "").strip()
        return date.fromisoformat(literal).isoformat()==literal and date.fromisoformat(literal)<=date.today()
    except ValueError:
        return False

def valid_evidence(value):
    literal=str(value or "").strip()
    if re.fullmatch(r"sha256:[0-9a-fA-F]{64}",literal):return True
    parsed=urlsplit(literal)
    return (parsed.scheme=="https" and bool(parsed.hostname) and "." in parsed.hostname
      and parsed.hostname not in ("example.org","example.com","example.net","localhost")
      and not parsed.username and not parsed.password and not any(x.isspace() for x in literal))

def completed_gate(row,review,reviewer,evidence,reviewed_at):
    return (row[review]==APPROVED and valid_reviewer(row[reviewer])
      and valid_evidence(row[evidence]) and valid_date(row[reviewed_at]))
def risk_flags(oa):
    text = oa["texto_literal"].lower()
    area = oa["asignatura"].lower()
    broad = bool(re.search(r"\b(?:proyecto|investigaci[oó]n|350|500|100|divers[oa]s|m[uú]ltiples|conjunto|a lo largo|procesos hist[oó]ricos)\b", text))
    authentic = bool(re.search(r"\b(?:fuentes|documentos|noticias|textos|obras|patrimonio|hist[oó]ric|actualizad|investigaci[oó]n|internet)\b", text)) or any(t in area for t in ("historia", "estudios sociales", "lengua", "lenguaje", "ciudadana", "filosofía"))
    visual = bool(re.search(r"\b(?:mapas|gr[aá]ficos|im[aá]genes|fotograf[ií]as|diagramas|planos|obras visuales)\b", text)) or "art" in area
    legal = bool(re.search(r"\b(?:ley|legal|derechos|deberes|normas|normativ|contrato|tributari|previsi[oó]n|municipal)\b", text))
    return broad, authentic, visual, legal

def run(output, reviews_path=None):
    previous = {}
    if reviews_path:
        with open(reviews_path, encoding="utf-8-sig", newline="") as f:
            for item in csv.DictReader(f):
                key = item.get("clave_interna", "")
                if not key or key in previous:
                    raise ValueError("Duplicate or missing review key: " + key)
                previous[key] = item
    catalog_ids = {oa["clave_interna"] for oa in CATALOG}
    if len(catalog_ids) != 407 or set(CASES) != catalog_ids:
        raise ValueError("407 exact OA coverage must pass before review")
    if set(previous) - catalog_ids:
        raise ValueError("Reviews refer to unknown OA keys")
    results = []
    for oa in CATALOG:
        key = oa["clave_interna"]
        lesson_data = lesson(oa)
        scenario, solution, transfer = CASES[key]
        old = previous.get(key, {})
        broad, authentic, visual, legal = risk_flags(oa)
        checks = [
            bool(scenario and solution and transfer),
            lesson_data["scenario"].startswith(scenario) and len(lesson_data["scenario"].strip()) >= 65,
            solution in lesson_data["worked"],
            solution in lesson_data["answer_guide"][0],
            lesson_data["status"] == "BORRADOR_DIDACTICO_NO_VALIDADO",
        ]
        if not all(checks):
            raise ValueError("Structural or solution mismatch: " + key)
        row = {
            "clave_interna": key,
            "asignatura": oa["asignatura"],
            "nivel": oa["nivel"],
            "objetivo_literal": oa["texto_literal"],
            "fuente_curricular": oa.get("fuente_documento", ""),
            "pagina_curricular": oa.get("pagina_oficial", ""),
            "caso_individual": "SI",
            "solucion_modelo": "SI",
            "actividad_transferencia": "SI",
            "alcance_amplio": "REVISAR" if broad else "",
            "requiere_texto_o_fuente_autentica": "REVISAR" if authentic else "",
            "requiere_evidencia_visual_documental": "REVISAR" if visual else "",
            "requiere_revision_normativa": "REVISAR" if legal else "",
        }
        for field in FIELDS:
            if field.startswith(("revision_", "revisor_", "evidencia_", "fecha_revision_")) and field not in row:
                row[field] = str(old.get(field) or (PENDING if field.startswith("revision_") else "")).strip()
        # All four sign-offs, INCLUDING teacher answer-key review, require
        # a named reviewer, a nonfuture date and a traceable review record.
        complete = all(completed_gate(row,*gate) for gate in GATES)
        gaps = [name for name,reviewer,evidence,reviewed_at in GATES
                if not completed_gate(row,name,reviewer,evidence,reviewed_at)]
        row["estado_final"] = "VALIDADO_CON_EVIDENCIAS" if complete else "NO_VALIDADO"
        row["pendientes"] = "|".join(gaps)
        results.append(row)
    output.mkdir(parents=True, exist_ok=True)
    with (output / "matriz_cierre_etapa2_407.csv").open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(results)
    approved = sum(r["estado_final"] == "VALIDADO_CON_EVIDENCIAS" for r in results)
    summary = {
        "total_oa": 407, "casos_con_solucion_y_transferencia": 407,
        "validados_con_evidencia": approved, "pendientes": 407 - approved,
        "banderas_alcance_amplio": sum(r["alcance_amplio"] == "REVISAR" for r in results),
        "banderas_fuentes": sum(r["requiere_texto_o_fuente_autentica"] == "REVISAR" for r in results),
        "banderas_visuales": sum(r["requiere_evidencia_visual_documental"] == "REVISAR" for r in results),
        "banderas_normativa": sum(r["requiere_revision_normativa"] == "REVISAR" for r in results),
        "criterio_cierre": "407/407 con revisión pedagógica, documental, visual y de respuestas, cada una con revisor, fecha no futura y referencia de evidencia",
        "etapa2_cerrada": approved == 407,
        "advertencia": "Los indicadores automáticos no sustituyen revisión independiente."
    }
    (output / "resumen_cierre_etapa2.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))
    return summary

if __name__ == "__main__":
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out" / "etapa2_cierre"
    previous = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    run(folder, previous)
