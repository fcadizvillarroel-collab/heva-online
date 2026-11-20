#!/usr/bin/env python3
"""Unit tests: calculations, triage fidelity and honest statuses for 407 cases."""
from pathlib import Path
from tempfile import TemporaryDirectory
from prevalidar_oa407_contenido import arithmetic_errors, screen, audit

assert arithmetic_errors("10.000 − 7.500 = $2.500") == []
assert arithmetic_errors("0,15 × 20.000 = $3.000") == []
assert arithmetic_errors("3 × 1.800 = 5.400") == []
assert arithmetic_errors("1.200 ÷ 3 = 400") == []
assert arithmetic_errors("10.000 - 7.500 = $3.500")
assert arithmetic_errors("10 + 15 = 20")
assert arithmetic_errors("0,15 × 20.000 = 2.000")
assert arithmetic_errors("No se puede resolver 2x + 6 = 20") == []
oa = {"clave_interna":"TEST", "asignatura":"Educación Matemática",
      "nivel":"básico","marco":"Decreto 257",
      "texto_literal":"Calcular porcentajes y estimar costos en compras."}
case = ("Una compra cuesta $20.000 y recibe un descuento de 15 %.",
        "El descuento es 0,15 × 20.000 = $3.000. Precio final = $17.000.",
        "Explica por qué el descuento ayuda a comparar costos.")
row = screen(oa, case)
assert row["prioridad"] != "CRITICO_VERIFICAR"
assert row["revision_disciplinar_independiente"] == "PENDIENTE"
assert row["aprobacion_institucional"] == "PENDIENTE"
wrong = screen(oa, (case[0], "0,15 × 20.000 = $4.000.", case[2]))
assert wrong["prioridad"] == "CRITICO_VERIFICAR"
assert "CALCULO_A_VERIFICAR" in wrong["alertas"]
with TemporaryDirectory() as temp:
    summary = audit(Path(temp))
    assert summary["objetivos"] == 407
    assert summary["aprobaciones_expertas"] == 0
    assert (Path(temp)/"prevalidacion_disciplinar_407.csv").exists()
print("Pruebas de prevalidación: controles aritméticos y 407 filas completos")
