#!/usr/bin/env python3
"""Regression test for the stage-3 individualized curricular review matrix."""
import csv,json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as temp:
 subprocess.run([sys.executable,str(ROOT/"scripts/stage3_epja_specialization.py"),temp],check=True,capture_output=True,text=True)
 with (Path(temp)/"matriz_especializacion_epja_407.csv").open(encoding="utf-8-sig",newline="") as f:
  rows=list(csv.DictReader(f))
 summary=json.loads((Path(temp)/"resumen_etapa3.json").read_text(encoding="utf-8"))
 assert len(rows)==407 and len({r["clave_interna"] for r in rows})==407
 assert sum(summary["familias"].values())==407
 assert all(len(r["criterio_especifico_para_revisor"])>=90 for r in rows)
 assert all(r["caso"] and r["modelamiento"] and r["transferencia"] for r in rows)
 assert all(r["verificacion_disciplinar"]=="PENDIENTE_REVISION_INDEPENDIENTE" for r in rows)
 assert all(not r["decision"] and not r["revisor"] for r in rows)
 assert summary["etapa3_cerrada"] is False
 assert sum(summary["objetivos_por_prioridad"].values())==407
 assert sum(bool(r["alertas"]) for r in rows)==summary["objetivos_con_alertas"]
 assert all(r["tipo_alertas"]=="REQUISITO_DE_VERIFICACION" for r in rows if r["alertas"])
 assert all(r["prioridad"] in ("ALTA","MEDIA","NORMAL") for r in rows)
 print("PASS: 407 unique OA, six subject checklists, no fabricated reviewer approval")
