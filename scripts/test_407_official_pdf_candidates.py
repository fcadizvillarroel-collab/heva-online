#!/usr/bin/env python3
"""Candidate page hints must never be classified as exact curricular matches."""
from verify_407_official_pdfs import normalize,candidate_page
objective=("Caracterizar relaciones históricas entre los cambios políticos y sociales, "
 "reconociendo los efectos de distintas decisiones sobre comunidades a lo largo del tiempo.")
pages=[
 normalize("Esta página trata de electricidad, instrumentos y reacciones químicas."),
 normalize(objective.replace("cambios políticos y sociales,","cambios políticos y también algunos cambios sociales,")),
 normalize("Una página final sin relación con el aprendizaje previsto.")
]
page,anchors,total=candidate_page(objective,pages)
assert page==2,(page,anchors,total)
assert anchors>=2
assert total>=4
miss,count,den=candidate_page(objective,[pages[0],pages[2]])
assert miss is None and count<2
short,_,_=candidate_page("Leer",pages)
assert short is None
assert normalize("Educación Básica")=="educacionbasica"
print("PASS: probable pages are marked as nonverified human-review leads")
