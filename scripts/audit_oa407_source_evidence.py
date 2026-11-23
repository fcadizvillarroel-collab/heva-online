#!/usr/bin/env python3
"""Read-only evidence matrix: limited checked historical claims are not 407 source-approved lessons."""
import csv,json,sys
from collections import Counter
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit
from oa_case_sources import SOURCES
ROOT=Path(__file__).resolve().parents[1]
ALLOW={"www.memoriachilena.gob.cl","treaties.un.org","history.state.gov"}
FIELDS=["clave_interna","asignatura","nivel","marco","afirmaciones_cotejadas","fuentes_focalizadas","urls_fuentes","fecha_contraste","estado_cotejo_factual","validacion_documental_completa","aprobacion_docente","pendiente"]
def validate_source(key,entry):
    parsed=urlsplit(entry.get("url",""))
    if parsed.scheme!="https" or parsed.hostname not in ALLOW or parsed.username or parsed.password:
        raise ValueError("Source URL outside institutional allowlist: "+key)
    if not all(str(entry.get(field,"")).strip() for field in ("titulo","hecho_contrastado","evidencia_localizada","tipo_cotejo","fecha_cotejo","alcance")):
        raise ValueError("Source lacks claim-level provenance: "+key)
    when=date.fromisoformat(entry["fecha_cotejo"])
    if when>date.today():raise ValueError("Future verification date: "+key)
    if len(entry["evidencia_localizada"])>220:raise ValueError("Source excerpt is unexpectedly long: "+key)
    if entry["tipo_cotejo"] not in ("HECHO_FOCALIZADO_EN_HTML","REGISTRO_DE_TRATADO_HTML","HISTORIA_INSTITUCIONAL_HTML"):
        raise ValueError("Unknown source verification scope: "+key)
def audit(output):
    catalog=json.loads((ROOT/"catalogo-publicado.json").read_text(encoding="utf-8"))
    keys={x["clave_interna"] for x in catalog}
    if len(catalog)!=407 or len(keys)!=407:raise ValueError("Catalog is not the unchanged 407-OA snapshot")
    if set(SOURCES)-keys:raise ValueError("Source mapped to unrecognized OA key")
    rows=[]
    for oa in catalog:
        key=oa["clave_interna"];found=SOURCES.get(key,[])
        if found:
            for entry in found:validate_source(key,entry)
        rows.append({"clave_interna":key,"asignatura":oa["asignatura"],"nivel":oa["nivel"],"marco":oa["marco"],
          "afirmaciones_cotejadas":len(found),"fuentes_focalizadas":" | ".join(s["titulo"] for s in found),
          "urls_fuentes":" | ".join(s["url"] for s in found),
          "fecha_contraste":" | ".join(sorted(set(s["fecha_cotejo"] for s in found))),
          "estado_cotejo_factual":"ALGUNOS_HECHOS_CONTRASTADOS" if found else "SIN_COTEJO_INDIVIDUAL",
          "validacion_documental_completa":"NO_ACREDITADA","aprobacion_docente":"NO_ACREDITADA",
          "pendiente":"Contrastar todas las afirmaciones del material, fuentes, derechos de uso y OA; revisión de revisor competente"})
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    with (output/"matriz_evidencia_factual_407.csv").open("w",encoding="utf-8-sig",newline="") as file:
        writer=csv.DictWriter(file,fieldnames=FIELDS);writer.writeheader();writer.writerows(rows)
    focused=[r for r in rows if r["afirmaciones_cotejadas"]]
    summary={"oa_totales":407,"oa_con_algun_hecho_cotejado":len(focused),
      "afirmaciones_cotejadas_focalmente":sum(r["afirmaciones_cotejadas"] for r in focused),
      "oa_sin_cotejo_individual":407-len(focused),"revisiones_documentales_completas":0,
      "aprobaciones_docentes":0,"fecha_cotejo_focalizado":"2026-11-23",
      "alcance":"Cinco correspondencias con fuentes primarias/institucionales HTML para tres OA; no son validaciones integrales de los 407 materiales ni autorizaciones de imágenes."}
    (output/"resumen_evidencia_factual_407.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False))
    return summary
if __name__=="__main__":audit(sys.argv[1] if len(sys.argv)>1 else "out/evidencia_factual")
