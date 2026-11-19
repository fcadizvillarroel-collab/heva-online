#!/usr/bin/env python3
"""Stage 3: subject-specific EPJA review queue for all 407 objectives.

This is a curricular specialization audit, not a claim of expert approval.
"""
import csv,json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from oa_lessons import lesson
from close_stage2_evidence import risk_flags
catalog=json.loads((ROOT/"catalogo-publicado.json").read_text(encoding="utf-8"))
assert len(catalog)==407 and len({x["clave_interna"] for x in catalog})==407
SUBJECT_RULES={
 "MATEMATICA":r"calcul|ecuaci|proporci|medid|probabili|estad[ií]st|geometr|num[eé]r",
 "CIENCIAS":r"experimen|observ|hip[oó]tes|evidencia|biolog|qu[ií]mic|f[ií]sic|ambient",
 "LENGUAJE":r"lectur|texto|escrit|argument|comunic|comprensi[oó]n|interpret",
 "HISTORIA_CIUDADANIA":r"hist[oó]r|territori|fuente|ciudadan|democra|sociedad|econ[oó]m|derecho",
 "IDIOMAS":r"comunic|comprensi[oó]n|pronunci|vocabular|oral|escrit",
 "TP_LABORAL":r"seguridad|procedimiento|prevenci[oó]n|trabajo|empresa|laboral|t[eé]cnic"
}
def area(a):
 s=a.lower()
 if "matem" in s:return "MATEMATICA"
 if any(x in s for x in ("ciencia","biolog","físic","químic")):return "CIENCIAS"
 if any(x in s for x in ("lengua","comunicaci","literatura")):return "LENGUAJE"
 if any(x in s for x in ("historia","social","ciudadan","filosof")):return "HISTORIA_CIUDADANIA"
 if any(x in s for x in ("inglés","ingles","idioma")):return "IDIOMAS"
 return "TP_LABORAL"
rows=[]
for oa in catalog:
 l=lesson(oa)
 broad,auth,visual,legal=risk_flags(oa)
 category=area(oa["asignatura"])
 focus=oa["texto_literal"]
 warnings=[]
 if len(l["scenario"].strip())<100:warnings.append("CASO_BREVE")
 if len(l["worked"].strip())<100:warnings.append("MODELADO_BREVE")
 if not l["transfer"].strip():warnings.append("SIN_TRANSFERENCIA")
 if auth:warnings.append("COTEJAR_FUENTE_AUTENTICA")
 if legal:warnings.append("COTEJAR_NORMATIVA_VIGENTE")
 if visual:warnings.append("COTEJAR_RECURSO_VISUAL")
 if broad:warnings.append("COTEJAR_COBERTURA_DEL_OA")
 rows.append({"clave_interna":oa["clave_interna"],"asignatura":oa["asignatura"],"nivel":oa["nivel"],
 "familia_disciplinar":category,"objetivo":focus,"caso":l["scenario"],"modelamiento":l["worked"],
 "transferencia":l["transfer"],"criterio_especifico_para_revisor":SUBJECT_RULES[category],
 "alertas":"|".join(warnings),"verificacion_disciplinar":"PENDIENTE_REVISION_INDEPENDIENTE",
 "verificacion_documental":"PENDIENTE_REVISION_INDEPENDIENTE",
 "verificacion_visual":"PENDIENTE_INSPECCION_HUMANA",
 "version_material_revisada":"","evidencia_de_contraste":"","revisor":"","fecha":"","decision":""})
out=Path(sys.argv[1] if len(sys.argv)>1 else ROOT/"out"/"etapa3")
out.mkdir(parents=True,exist_ok=True)
with (out/"matriz_especializacion_epja_407.csv").open("w",encoding="utf-8-sig",newline="") as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
summary={"objetivos":len(rows),"familias":{k:sum(x["familia_disciplinar"]==k for x in rows) for k in SUBJECT_RULES},
"casos_con_modelamiento_y_transferencia":sum(bool(x["caso"] and x["modelamiento"] and x["transferencia"]) for x in rows),
"objetivos_con_alertas":sum(bool(x["alertas"]) for x in rows),
"validaciones_independientes":0,"etapa3_cerrada":False,
"alcance":"Matriz de especialización EPJA por disciplina con textos individuales; no reemplaza verificación de fuentes y revisión experta."}
(out/"resumen_etapa3.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(summary,ensure_ascii=False))
