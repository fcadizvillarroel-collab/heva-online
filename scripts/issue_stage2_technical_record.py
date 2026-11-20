#!/usr/bin/env python3
"""Consolidate machine-verifiable stage-2 evidence without inventing expert sign-off."""
import argparse,csv,json
from pathlib import Path

def run(root,output):
    evidence=root/"technical_evidence"
    sources=[
      "resumen_evidencia_tecnica.json",
      "resumen_accesibilidad_contenido.json",
      "resumen_trazabilidad_curricular.json",
      "resumen_inventario_visual_y_fuentes.json"
    ]
    d=[json.loads((evidence/x).read_text(encoding="utf-8")) for x in sources]
    assert d[0]["oa_tecnicamente_verificados"]==407
    assert d[0]["archivos_office_con_sha256"]==1221
    assert d[1]["sin_hallazgos_automaticos"]==407 and d[1]["con_hallazgos"]==0
    assert d[2]["sin_fallas_de_trazabilidad"]==407 and d[2]["casos_identicos_repetidos"]==0
    assert d[3]["paginas_pdf_inventariadas"]>0
    assert d[3]["paginas_con_alertas_visuales_automaticas"]==0
    ppt_file=evidence/"resumen_legibilidad_ppt_407.json"
    ppt=json.loads(ppt_file.read_text(encoding="utf-8")) if ppt_file.exists() else None
    if ppt is not None:
      assert ppt["objetivos"]==407
      sources.append("resumen_legibilidad_ppt_407.json")
    report={
      "etapa":"2",
      "estado":"CONTROLES_TECNICOS_COMPLETOS_VALIDACION_EXPERTA_PENDIENTE",
      "oa":407,"archivos_office_verificados":1221,
      "paginas_pdf_auditadas_automaticamente":d[3]["paginas_pdf_inventariadas"],
      "alertas_visuales_automaticas":0,
      "fallas_trazabilidad":0,
      "revisiones_documentales_independientes":0,
      "revisiones_visuales_humanas":0,
      "aprobaciones_pedagogicas_expertas":0,
      "alertas_legibilidad_ppt":ppt["diapositivas_con_cuerpo_menor_20_pt"] if ppt else None,
      "ppt_con_poca_evidencia_visual":ppt["presentaciones_con_pocos_visuales"] if ppt else None,
      "etapa2_cerrada":False,
      "fuentes_de_evidencia":sources,
      "nota":"El resultado automático no acredita revisión de fuentes originales, exactitud disciplinar ni firma de revisores."
    }
    output.mkdir(parents=True,exist_ok=True)
    (output/"acta_estado_etapa2.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False))
    return report
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("root");p.add_argument("output");a=p.parse_args()
    run(Path(a.root),Path(a.output))
