#!/usr/bin/env python3
"""Regression tests: no 407-OA expert validation can be inferred from rendering."""
import csv
import json
import tempfile
from pathlib import Path
from close_stage2_evidence import run, FIELDS

with tempfile.TemporaryDirectory() as folder:
    root = Path(folder)
    summary = run(root)
    assert summary["total_oa"] == 407
    assert summary["casos_con_solucion_y_transferencia"] == 407
    assert summary["validados_con_evidencia"] == 0
    assert summary["pendientes"] == 407
    assert summary["etapa2_cerrada"] is False
    rows = list(csv.DictReader((root / "matriz_cierre_etapa2_407.csv").open(encoding="utf-8-sig")))
    assert len(rows) == 407
    assert len({r["clave_interna"] for r in rows}) == 407
    assert all(r["estado_final"] == "NO_VALIDADO" for r in rows)
    assert all("revision_pedagogica" in r["pendientes"] for r in rows)
    assert all("revision_documental" in r["pendientes"] for r in rows)
    assert all("revision_visual" in r["pendientes"] for r in rows)
    assert all("revision_respuestas" in r["pendientes"] for r in rows)
    # Explicitly approving without named reviewers or evidence must never close a row.
    for r in rows:
        r["revision_pedagogica"] = "APROBADO"
        r["revision_documental"] = "APROBADO"
        r["revision_visual"] = "APROBADO"
        r["revision_respuestas"] = "APROBADO"
    reviews = root / "incomplete_approvals.csv"
    with reviews.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)
    summary = run(root / "rechecked", reviews)
    assert summary["validados_con_evidencia"] == 0
    print("407/407 case checks passed; 0 fabricated expert approvals")
