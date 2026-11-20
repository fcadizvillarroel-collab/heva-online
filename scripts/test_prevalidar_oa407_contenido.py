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
# Avoid false findings in the many-term problems and fraction exercises.
assert arithmetic_errors("10.000 + 4.000 + 6.000 = $20.000") == []
assert arithmetic_errors("3 × 25.000 + 3 × 38.000 = $189.000") == []
assert arithmetic_errors("4 × 5 + 4 × 2 = 28") == []
assert arithmetic_errors("1/2 + 1/3 = 5/6") == []
assert arithmetic_errors("3/5 = 60 %") == []
assert arithmetic_errors("3/5 = 70 %")
assert arithmetic_errors("0,75 × 100 = 75 %") == []
assert arithmetic_errors("0,75 × 100 = 76 %")
assert arithmetic_errors("2 × 2 × 2 = 8") == []
assert arithmetic_errors("10.000 + 4.000 + 6.000 = $21.000")
assert arithmetic_errors("3 × 25.000 + 3 × 38.000 = $190.000")

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
# A deliberately incorrect prompt is a learning exercise, not a wrong teacher key.
misconception = screen(oa, ("Una persona afirma que 8+7=14. Explica el error.",
                            "La afirmación es falsa: 8+7=15, y se comprueba contando.",
                            "Corrige otra suma y explica el resultado."))
assert "CALCULO_A_VERIFICAR" not in misconception["alertas"]
fictional = dict(oa, asignatura="Ciencias Naturales",
                 texto_literal="Interpretar datos de un experimento simulado.")
fictional_row = screen(fictional, ("Un experimento ficticio usa 10 semillas.",
                                 "Germinan 8; entonces 8/10 = 80 % en esta muestra.",
                                 "Compara dos grupos de semillas."))
assert "FECHA_O_CIFRA_A_COTEJAR" not in fictional_row["alertas"]
history = dict(oa, asignatura="Estudios Sociales",
               texto_literal="Explicar hitos históricos del siglo XX.")
history_row = screen(history, ("El curso compara hitos internacionales.",
                               "La ONU inició su labor en 1945.",
                               "Busca una fuente documental sobre el hecho."))
assert "FECHA_O_CIFRA_A_COTEJAR" in history_row["alertas"]
with TemporaryDirectory() as temp:
    summary = audit(Path(temp))
    assert summary["objetivos"] == 407
    assert summary["casos_con_cotejo_focalizado_de_hechos"] == 3
    assert summary["aprobaciones_expertas"] == 0
    assert (Path(temp)/"prevalidacion_disciplinar_407.csv").exists()
print("Pruebas de prevalidación: controles aritméticos y 407 filas completos")
