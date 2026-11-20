#!/usr/bin/env python3
"""Fast rendering smoke: long EPJA objectives must not become 14pt text walls."""
import json
import tempfile
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches
from build_407_oa_materials import diagram, evidence_diagram, create_ppt, split_slide_body

ROOT=Path(__file__).resolve().parents[1]
rows=json.loads((ROOT/"catalogo-publicado.json").read_text(encoding="utf-8"))
assert len(rows)==407
longest=max(rows,key=lambda x:len(x["texto_literal"]))
assert len(longest["texto_literal"])>750
assert len(split_slide_body("Palabra "*300))>2
with tempfile.TemporaryDirectory() as temp:
    base=Path(temp)
    oa=dict(longest,_index=1)
    a=diagram(oa,base/"organizador.png")
    b=evidence_diagram(oa,base/"evidencia.png")
    target=base/"leccion.pptx"
    expected=create_ppt(oa,a,b,target)
    slides=Presentation(target)
    assert expected==len(slides.slides)>=10,expected
    picture_slides=0
    for slide in slides.slides:
        pictures=[s for s in slide.shapes if s.shape_type==13]
        picture_slides+=bool(pictures)
        for shape in slide.shapes:
            if not shape.has_text_frame or not Inches(1.1)<=shape.top<Inches(6.45):
                continue
            for paragraph in shape.text_frame.paragraphs:
                for run in paragraph.runs:
                    if run.text.strip():
                        font=run.font.size or paragraph.font.size
                        assert font is not None and font.pt>=20,(
                            "Small slide body font", font.pt if font else None)
    assert picture_slides>=2,picture_slides
    all_text=" ".join(s.text for slide in slides.slides for s in slide.shapes if s.has_text_frame)
    assert "Referencia oficial:" in all_text
print("PASS: adaptive long-lesson PPT, 20pt+ body and 2 distinct visuals")
