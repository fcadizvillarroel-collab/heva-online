#!/usr/bin/env python3
"""Self-test for read-only 407-OA pedagogical QA. No Supabase writes."""
import csv
import tempfile
from pathlib import Path
from audit_oa407_didactic_quality import audit
from oa_lessons import lesson
import json

with tempfile.TemporaryDirectory() as tmp:
    report=audit(tmp)
    assert report["oa"]==407
    assert report["aprobaciones_expertas"]==0
    assert report["con_alertas"]>=0
    assert report["alertas"].get("EXPLICACION_CON_ESTRUCTURA_PLANTILLA",0)==0
    assert report["alertas"].get("EXPLICACION_SIN_CASO_RESUELTO_Y_TRANSFERENCIA",0)==0
    assert report["alertas"].get("EXPLICACION_SIN_PROFUNDIDAD_MINIMA",0)==0
    assert report["alertas"].get("PREGUNTA_PLANTILLA_ENTRE_OA",0)<407, "Las 407 consignas no deben permanecer idénticas"
    folder=Path(tmp)
    rows=list(csv.DictReader((folder/"matriz_calidad_didactica_407.csv").open(encoding="utf-8-sig")))
    assert len(rows)==407
    assert len({row["clave_interna"] for row in rows})==407
    assert all(row["revision_disciplinar"]=="NO_ACREDITADA" for row in rows)
    assert all("preguntas_repetidas_entre_oa" in row for row in rows)
    summary=(folder/"resumen_calidad_didactica.md").read_text(encoding="utf-8")
    assert "## Alertas por tipo\n" in summary
    assert "\\n" not in summary, "Markdown must use actual line breaks"
    assert "Supabase" in summary
catalog=json.loads((Path(__file__).resolve().parents[1]/"catalogo-publicado.json").read_text(encoding="utf-8"))
supports=[lesson(oa)["accessibility"] for oa in catalog]
assert all(lesson(oa)["scenario"].strip() in lesson(oa)["explanation"] for oa in catalog), "Complete expanded cases must be present in all 407 explanations"
assert len(set(supports))>=9,"Accessibility must differ by curricular discipline"
assert all("respuesta oral" in s and "teléfonos" in s and "ciegos" in s and "alto contraste" in s for s in supports)
for subject,keyword in [("Estudios Sociales","cronologías"),("Educación Matemática","operación"),("Lengua Castellana","vocabulario"),("Ciencias Naturales","observaciones"),("Inglés","inglés")]:
    match=next(oa for oa in catalog if subject.lower() in oa["asignatura"].lower())
    assert keyword in lesson(match)["accessibility"],subject
print("PASS: 407 OA, original case/solution/transfer and discipline-specific low-vision/offline support")
