#!/usr/bin/env python3
"""Independent deterministic checks of 407 HEVA OA lessons; flags are review leads, not expert verdicts."""
import csv, json, re, sys, unicodedata
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from oa_lessons import lesson

def norm(s):
    return " ".join("".join(c for c in unicodedata.normalize("NFD",s.lower()) if unicodedata.category(c)!="Mn").split())

def audit(output):
    catalog=json.loads((ROOT/"catalogo-publicado.json").read_text(encoding="utf-8"))
    assert len(catalog)==407 and len({x["clave_interna"] for x in catalog})==407
    lessons=[(oa,lesson(oa)) for oa in catalog]
    scenarios=Counter(norm(m["scenario"]) for _,m in lessons)
    solutions=Counter(norm(m["answer_guide"][0]) for _,m in lessons)
    rows=[]
    for oa,m in lessons:
        issues=[]
        sc=norm(m["scenario"])
        so=norm(m["answer_guide"][0])
        if scenarios[sc]>1: issues.append("ESCENARIO_REPETIDO")
        if solutions[so]>1: issues.append("SOLUCION_REPETIDA")
        if len(m["scenario"].strip())<65: issues.append("ESCENARIO_BREVE")
        if len(m["answer_guide"][0].strip())<85: issues.append("PAUTA_BREVE")
        if "solucion del caso presentado" not in so: issues.append("SIN_SOLUCION_DESARROLLADA")
        if m["scenario"].strip() not in m["explanation"] and m["worked"].strip() not in m["explanation"]: issues.append("EXPLICACION_DESVINCULADA")
        if len(set(norm(q) for q in m["questions"]))!=len(m["questions"]): issues.append("PREGUNTAS_DUPLICADAS")
        if not m["accessibility"].strip(): issues.append("SIN_ACCESIBILIDAD")
        rows.append({"clave_interna":oa["clave_interna"],"asignatura":oa["asignatura"],"nivel":oa["nivel"],"marco":oa["marco"],"alertas":"|".join(issues),"estado":"REVISAR" if issues else "SIN_ALERTAS_HEURISTICAS","revision_disciplinar":"NO_ACREDITADA"})
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    with (output/"matriz_calidad_didactica_407.csv").open("w",encoding="utf-8-sig",newline="") as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    counts=Counter(flag for row in rows for flag in row["alertas"].split("|") if flag)
    summary={"oa":407,"con_alertas":sum(bool(row["alertas"]) for row in rows),"alertas":dict(sorted(counts.items())),"aprobaciones_expertas":0,"alcance":"Heuristicas de coherencia, variedad y completitud. No certifica exactitud factual, normativa ni pedagogica."}
    (output/"resumen_calidad_didactica.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False))
    return summary

if __name__=="__main__":
    audit(sys.argv[1] if len(sys.argv)>1 else "out/calidad_didactica")
