#!/usr/bin/env python3
"""Self-test for read-only 407-OA pedagogical QA. No Supabase writes."""
import csv
import tempfile
from pathlib import Path
from audit_oa407_didactic_quality import audit

with tempfile.TemporaryDirectory() as tmp:
    report=audit(tmp)
    assert report["oa"]==407
    assert report["aprobaciones_expertas"]==0
    assert report["con_alertas"]>=1
    assert report["alertas"].get("EXPLICACION_CON_ESTRUCTURA_PLANTILLA",0)>=1
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
print("PASS: 407 OA, plantilla didáctica marcada, QA de solo lectura y 0 aprobaciones inventadas")
