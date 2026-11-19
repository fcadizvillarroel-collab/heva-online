#!/usr/bin/env python3
"""Issue traceable, *technical-only* evidence for each rendered OA.

Does not assert human inspection, disciplinary correctness, or documentary verification.
"""
import argparse, csv, hashlib, json
from pathlib import Path

def run(report_path, output):
    report = json.loads(Path(report_path).read_text(encoding="utf-8"))
    records = report["records"]
    if report["generated"] != 407 or len(records) != 407 or report["passed"] != 407 or report["failed"]:
        raise ValueError("407/407 successful real renders required")
    if not report["rendered"]:
        raise ValueError("Cannot attest without PDF rendering")
    seen = set()
    rows = []
    root = Path(report_path).parent
    for item in records:
        key = item["oa"]
        if key in seen:
            raise ValueError("Repeated OA: " + key)
        seen.add(key)
        artifacts = {}
        for sub, field in (("docx", "docx"), ("docx_docente", "docx_docente"), ("pptx", "pptx")):
            filename = item[field]
            path = root / sub / filename
            if not path.is_file():
                raise ValueError("Missing artifact: " + str(path))
            artifacts[sub] = hashlib.sha256(path.read_bytes()).hexdigest()
        if item["pass"] is not True:
            raise ValueError("Unsuccessful rendering: " + key)
        for field in ("render_docx", "render_docx_docente", "render_pptx"):
            if item[field].get("error") or item[field].get("issues"):
                raise ValueError("Render finding: " + key + " " + field)
        rows.append({
            "clave_interna": key,
            "estado_tecnico": "RENDER_VERIFICADO",
            "sha256_guia_estudiante": artifacts["docx"],
            "sha256_pauta_docente": artifacts["docx_docente"],
            "sha256_presentacion": artifacts["pptx"],
            "paginas_guia": item["render_docx"]["pages"],
            "paginas_pauta": item["render_docx_docente"]["pages"],
            "diapositivas": item["render_pptx"]["pages"],
            "fuentes_documentales": "SIN_VERIFICAR",
            "revision_visual_humana": "SIN_ACREDITAR",
            "validacion_pedagogica_experta": "SIN_ACREDITAR",
        })
    output.mkdir(parents=True, exist_ok=True)
    path = output / "evidencia_tecnica_407.csv"
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    summary = {
        "oa_tecnicamente_verificados": len(rows),
        "archivos_office_con_sha256": 3 * len(rows),
        "fuentes_documentales_verificadas": 0,
        "revisiones_visuales_humanas": 0,
        "validaciones_pedagogicas_expertas": 0,
        "alcance": "Integridad de artefactos Office, identidad por OA y renderizado PDF sin hallazgos automáticos",
        "no_acredita": ["exactitud disciplinar", "procedencia documental", "inspección humana de cada página"]
    }
    (output / "resumen_evidencia_tecnica.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))
    return summary

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("report")
    parser.add_argument("output")
    args = parser.parse_args()
    run(args.report, Path(args.output))
