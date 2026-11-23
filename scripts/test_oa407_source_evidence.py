#!/usr/bin/env python3
"""Evidence tests: the five verified statements are not overall expert sign-offs."""
import csv,tempfile
from pathlib import Path
from copy import deepcopy
from audit_oa407_source_evidence import audit,validate_source
from oa_case_sources import SOURCES
with tempfile.TemporaryDirectory() as d:
    s=audit(d)
    assert s["oa_totales"]==407
    assert s["oa_con_algun_hecho_cotejado"]==3
    assert s["afirmaciones_cotejadas_focalmente"]==5
    assert s["oa_sin_cotejo_individual"]==404
    assert s["revisiones_documentales_completas"]==s["aprobaciones_docentes"]==0
    rows=list(csv.DictReader((Path(d)/"matriz_evidencia_factual_407.csv").open(encoding="utf-8-sig")))
    assert len(rows)==407
    assert sum(r["estado_cotejo_factual"]=="ALGUNOS_HECHOS_CONTRASTADOS" for r in rows)==3
    assert all(r["validacion_documental_completa"]=="NO_ACREDITADA" for r in rows)
    key=next(iter(SOURCES))
    test=deepcopy(SOURCES[key][0])
    test["url"]="https://unofficial.example.net/claim"
    try:validate_source(key,test)
    except ValueError:pass
    else:raise AssertionError("Non-institutional sources must not pass review")
print("PASS: 407 OA, 3 with targeted checks, 404 without, 0 invented approvals")
