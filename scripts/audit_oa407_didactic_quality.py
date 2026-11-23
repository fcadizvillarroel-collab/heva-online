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
    shared_questions=Counter(norm(q) for _,m in lessons for q in m['questions'] if norm(q))
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
        # Repetition across different OA is not detected by per-lesson duplication.
        # A prompt repeated in 10+ lessons requires a subject-specific rewrite.
        repeated=[q for q in m["questions"] if shared_questions[norm(q)]>=10 and len(norm(q))>=28]
        if repeated: issues.append("PREGUNTA_PLANTILLA_ENTRE_OA")
        explanation=norm(m.get("explanation",""))
        if explanation.startswith("contenido curricular del objetivo:") and "orientacion didactica:" in explanation and "evidencia esperada:" in explanation:
            issues.append("EXPLICACION_CON_ESTRUCTURA_PLANTILLA")
        rows.append({"clave_interna":oa["clave_interna"],"asignatura":oa["asignatura"],"nivel":oa["nivel"],"marco":oa["marco"],"alertas":"|".join(issues),"estado":"REVISAR" if issues else "SIN_ALERTAS_HEURISTICAS","revision_disciplinar":"NO_ACREDITADA","preguntas_repetidas_entre_oa":len(repeated),"preguntas_totales":len(m["questions"])})
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    with (output/"matriz_calidad_didactica_407.csv").open("w",encoding="utf-8-sig",newline="") as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    counts=Counter(flag for row in rows for flag in row["alertas"].split("|") if flag)
    summary={"oa":407,"con_alertas":sum(bool(row["alertas"]) for row in rows),"alertas":dict(sorted(counts.items())),"aprobaciones_expertas":0,"preguntas_recurrentes_entre_oa":sum(1 for q,n in shared_questions.items() if n>=10 and len(q)>=28),"alcance":"Heuristicas de coherencia, variedad y completitud. El catálogo se lee como instantánea; Supabase es la autoridad curricular. No certifica exactitud factual, normativa ni pedagogica."}
    (output/"resumen_calidad_didactica.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    markdown=["# Auditoría didáctica HEVA · 407 OA (cribado heurístico)","",
      "No equivale a validación pedagógica de los materiales ni a aprobación de fuentes.",
      "Fuente de autoridad: Supabase HEVA. El catálogo JSON se usa aquí como instantánea local de solo lectura.","",
      f"OA analizados: {summary['oa']} · con alertas: {summary['con_alertas']} · aprobaciones docentes verificadas: 0","",
      "## Alertas por tipo",""]
    markdown.extend(f"- {flag}: {value} OA" for flag,value in sorted(counts.items(),key=lambda x:(-x[1],x[0])))
    markdown.extend(["","## Próximas acciones","Corregir primero las consignas repetidas entre distintos OA, aportar ejemplos disciplinares y pautas justificadas, y validar las fuentes antes de atribuirles procedencia.","La ausencia de alertas automáticas no equivale a aprobación humana."])
    (output/"resumen_calidad_didactica.md").write_text("\\n".join(markdown)+"\\n",encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False))
    return summary

if __name__=="__main__":
    audit(sys.argv[1] if len(sys.argv)>1 else "out/calidad_didactica")
