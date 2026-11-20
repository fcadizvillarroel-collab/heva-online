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
from oa_case_sources import sources_for

# Check complete expressions (including multi-term budgets), not misleading sub-expressions.
NUMBER = r"\$?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?"
ARITHMETIC = re.compile(
    rf"(?<![\w\d])(?P<expr>{NUMBER}(?:\s*[+\-−–×*÷/]\s*{NUMBER}){{1,7}})"
    rf"\s*=\s*(?P<c>{NUMBER})(?![\w\d])"
)
TOKEN = re.compile(rf"{NUMBER}|[+\-−–×*÷/]")
FRACTION_PERCENT = re.compile(
    rf"(?<![\w\d])(?P<a>{NUMBER})\s*/\s*(?P<b>{NUMBER})\s*=\s*"
    rf"(?P<pct>\d+(?:,\d+)?)\s*%"
)
DECIMAL_PERCENT = re.compile(
    rf"(?<![\w\d])(?P<a>{NUMBER})\s*[×*]\s*100\s*=\s*"
    rf"(?P<pct>\d+(?:,\d+)?)\s*%"
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

def compute_expression(expression):
    """Evaluate only simple written arithmetic: no code, variables or parentheses."""
    tokens = TOKEN.findall(expression)
    values = [number(x) for x in tokens[::2]]
    operators = tokens[1::2]
    if len(values) != len(operators) + 1:
        raise InvalidOperation("Unexpected arithmetic expression")
    i = 0
    while i < len(operators):
        op = operators[i]
        if op in ("×", "*", "÷", "/"):
            values[i:i+2] = [values[i] * values[i+1] if op in ("×", "*")
                             else values[i] / values[i+1]]
            operators.pop(i)
        else:
            i += 1
    result = values[0]
    for op, value in zip(operators, values[1:]):
        result = result + value if op == "+" else result - value
    return result

def arithmetic_errors(text):
    """Check complete equalities; omit embedded terms, fractions and percent notation."""
    problems = []
    for match in ARITHMETIC.finditer(text):
        before = text[:match.start()].rstrip()
        after = text[match.end():].lstrip()
        if before and before[-1] in "+−–-×*/,.":
            continue  # inside a longer expression or a decimal
        if after and after[0] in "+−–-×*/%":
            continue  # equation continues, fraction or percent unit
        try:
            calculated = compute_expression(match.group("expr"))
            expected = number(match.group("c"))
            tolerance = max(Decimal("0.011"), abs(expected) * Decimal("0.0001"))
            if abs(calculated - expected) > tolerance:
                problems.append(match.group(0).strip() + " [calculado: " + str(calculated) + "]")
        except (InvalidOperation, ZeroDivisionError, IndexError):
            problems.append(match.group(0).strip() + " [operación no válida]")
    # Percent statements can be mathematically checked without an external source.
    for match in FRACTION_PERCENT.finditer(text):
        try:
            predicted = number(match.group("a")) / number(match.group("b")) * 100
            if abs(predicted - number(match.group("pct"))) > Decimal("0.11"):
                problems.append(match.group(0).strip() + " [porcentaje calculado: " + str(predicted) + "]")
        except (InvalidOperation, ZeroDivisionError):
            problems.append(match.group(0).strip() + " [porcentaje no válido]")
    for match in DECIMAL_PERCENT.finditer(text):
        try:
            predicted = number(match.group("a")) * 100
            if abs(predicted - number(match.group("pct"))) > Decimal("0.11"):
                problems.append(match.group(0).strip() + " [porcentaje calculado: " + str(predicted) + "]")
        except InvalidOperation:
            problems.append(match.group(0).strip() + " [porcentaje no válido]")
    return problems

def words(text):
    text = "".join(ch for ch in unicodedata.normalize("NFD", text.lower())
                   if unicodedata.category(ch) != "Mn")
    return set(re.findall(r"[a-z]{5,}", text)) - STOP

def screen(oa, case):
    scenario, answer, transfer = case
    refs = sources_for(oa)
    objective = oa["texto_literal"]
    alerts = []
    faults = arithmetic_errors(answer)  # Student prompts can intentionally contain mistakes to correct.
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
    # Invented measurements and classroom computations are not external statistics.
    area = oa["asignatura"].lower()
    is_history = "historia" in area or "estudios sociales" in area
    invented = bool(re.search(r"fictici|simulad|ejemplo inventado", scenario, re.I))
    if is_history and not invented and (DATE.search(answer) or STAT.search(answer)):
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
            "fuente_especifica_verificada": "COTEJO_FOCALIZADO_DE_HECHOS" if refs else "NO_ACREDITADA",
            "referencias_de_cotejo": " | ".join(r["titulo"] + ": " + r["url"] for r in refs),
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
               "casos_con_cotejo_focalizado_de_hechos": sum(r["fuente_especifica_verificada"] == "COTEJO_FOCALIZADO_DE_HECHOS" for r in rows),
               "aprobaciones_expertas": 0,
               "alcance": "Cribado de cálculos explícitos, alineación léxica y riesgo documental. No certifica veracidad factual ni calidad pedagógica."}
    (output / "resumen_prevalidacion_disciplinar.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))
    return summary

if __name__ == "__main__":
    audit(sys.argv[1] if len(sys.argv) > 1 else ROOT / "out" / "prevalidacion_disciplinar")
