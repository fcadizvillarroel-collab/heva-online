#!/usr/bin/env python3
"""HEVA: independent, reproducible prevalidation of 407 hand-authored EPJA cases.

This is a *screening* tool. It checks calculations, curricular thematic evidence,
and factual/source risks; it never marks a case as expert approved.
"""
import csv
import json
import re
import sys
import unicodedata
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from oa_curated_cases import CASES

NUMBER = r"\$?\s*(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?"
ARITHMETIC = re.compile(
    rf"(?<![\w\d])(?P<a>{NUMBER})\s*(?P<op>[+\-−–×*÷/])\s*"
    rf"(?P<b>{NUMBER})\s*=\s*(?P<c>{NUMBER})(?![\w\d])"
)
STOP = set("""desarrollar comprender analizar reconocer identificar aplicar evaluar
utilizar explicar participar demostrar conocer relacionar comunicar resolver
interpretar describir formular establecer construir proponer reflexionar
distinguir promover considerar valorar emplear trabajar representar explorar
mediante traves sobre para entre desde donde cuando otros otras forma manera
diferentes distintos situaciones contextos ejemplos aspectos elementos procesos
personas propias diversos diversas conocimiento conocimientos habilidades
actitudes capacidad informacion acciones actividades relaciones social sociales
propio propia acuerdo partir objetivo aprendizaje criterios utilizando""".split())
LEGAL = re.compile(r"\b(?:ley(?:es)?|decreto|art[ií]culo\s+\d+|c[oó]digo\s+del\s+trabajo|"
                   r"afp|cotizaci[oó]n|impuesto|previsi[oó]n|tributari|reglamento)\b", re.I)
DATE = re.compile(r"(?<!\d)(?:18\d{2}|19\d{2}|20\d{2})(?!\d)")
STAT = re.compile(r"\b\d+(?:[,.]\d+)?\s*%")
REFERENCES = re.compile(r"\b(?:fuentes?\s+(?:hist[oó]ricas?|documentales?|primarias?|secundarias?)|"
                        r"noticia|estad[ií]stica|investigaci[oó]n|archivo|documentos?\s+hist[oó]ricos?)\b", re.I)

def number(value):
    raw = value.replace("$", "").replace(" ", "").replace(".", "").replace(",", ".")
    return Decimal(raw)

def arithmetic_errors(text):
    """Only check literal binary arithmetic equality; do not infer missing data."""
    problems = []
    for match in ARITHMETIC.finditer(text):
        try:
            a, b, c = (number(match.group(p)) for p in ("a", "b", "c"))
            op = match.group("op")
            calculated = {
                "+": lambda: a + b,
                "-": lambda: a - b,
                "−": lambda: a - b,
                "–": lambda: a - b,
                "×": lambda: a * b,
                "*": lambda: a * b,
                "÷": lambda: a / b,
                "/": lambda: a / b,
            }[op]()
            tolerance = max(Decimal("0.011"), abs(c) * Decimal("0.0001"))
            if abs(calculated - c) > tolerance:
                problems.append(match.group(0).strip() + " [calculado: " + str(calculated) + "]")
        except (InvalidOperation, ZeroDivisionError):
            problems.append(match.group(0).strip() + " [operación no válida]")
    return problems

def words(text):
    text = "".join(ch for ch in unicodedata.normalize("NFD", text.lower())
                   if unicodedata.category(ch) != "Mn")
    return set(re.findall(r"[a-z]{5,}", text)) - STOP

def screen(oa, case):
    scenario, answer, transfer = case
    objective = oa["texto_literal"]
    alerts = []
    faults = arithmetic_errors(scenario + " " + answer)
    if faults:
        alerts.append("CALCULO_A_VERIFICAR")
    required = words(objective)
    explicit = words(scenario + " " + answer + " " + transfer)
    overlap = sorted(required & explicit)
    # Paraphrases and inflected forms can legitimately give low overlap.
    if len(required) >= 3 and not overlap:
        alerts.append("ALINEACION_TEMATICA_A_COTEJAR")
    if LEGAL.search(scenario + " " + answer) or LEGAL.search(objective):
        alerts.append("NORMATIVA_A_COTEJAR")
    if DATE.search(answer) or STAT.search(answer):
        alerts.append("FECHA_O_CIFRA_A_COTEJAR")
    if REFERENCES.search(objective):
        alerts.append("FUENTES_AUTENTICAS_A_COTEJAR")
    if len(scenario.strip()) < 65:
        alerts.append("ENUNCIADO_ORIGINAL_BREVE")
    if len(answer.strip()) < 85:
        alerts.append("PAUTA_ORIGINAL_BREVE")
    risk = ("CRITICO_VERIFICAR" if faults else "ALTA_REVISION"
            if any(a in alerts for a in ("ALINEACION_TEMATICA_A_COTEJAR", "NORMATIVA_A_COTEJAR"))
            else "REVISION_FOCALIZADA" if alerts else "SIN_ALERTAS_DE_CRIBADO")
    return {"clave_interna": oa["clave_interna"],
            "asignatura": oa["asignatura"], "nivel": oa["nivel"],
            "marco": oa["marco"], "objetivo_literal": objective,
            "prioridad": risk, "alertas": "|".join(alerts),
            "terminos_oa_en_caso": ", ".join(overlap[:20]),
            "comprobaciones_aritmeticas_pendientes": " | ".join(faults),
            "enunciado_original": scenario, "solucion_propuesta": answer,
            "actividad_transferencia": transfer,
            "fuente_especifica_verificada": "NO_ACREDITADA",
            "revision_disciplinar_independiente": "PENDIENTE",
            "aprobacion_institucional": "PENDIENTE"}

def audit(output):
    catalog = json.loads((ROOT / "catalogo-publicado.json").read_text(encoding="utf-8"))
    ids = {o["clave_interna"] for o in catalog}
    if len(catalog) != 407 or len(ids) != 407 or ids != set(CASES):
        raise ValueError("El catálogo y los 407 casos originales no corresponden")
    rows = [screen(oa, CASES[oa["clave_interna"]]) for oa in catalog]
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    with (output / "prevalidacion_disciplinar_407.csv").open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    counts = Counter(flag for row in rows for flag in row["alertas"].split("|") if flag)
    summary = {"objetivos": len(rows),
               "casos_revisados_por_reglas": len(rows),
               "alertas_por_tipo": dict(sorted(counts.items())),
               "con_alertas": sum(bool(r["alertas"]) for r in rows),
               "calculos_sospechosos": counts["CALCULO_A_VERIFICAR"],
               "aprobaciones_expertas": 0,
               "alcance": "Cribado de cálculos explícitos, alineación léxica y riesgo documental. No certifica veracidad factual ni calidad pedagógica."}
    (output / "resumen_prevalidacion_disciplinar.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))
    return summary

if __name__ == "__main__":
    audit(sys.argv[1] if len(sys.argv) > 1 else ROOT / "out" / "prevalidacion_disciplinar")
