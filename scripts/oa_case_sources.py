"""Primary/official reference pointers for *specific statements* in selected OA examples.

Only these exact claims have received a targeted public-source comparison.
These citations do not constitute exhaustive review of the lesson, legal compliance
or an expert sign-off; no other OA is represented as documentary-verified.
"""
SOURCES = {
    "D257|MED|Estudios Sociales|N1|2": [
        {
            "titulo": "Biblioteca Nacional de Chile – Documentos oficiales (1810–1879)",
            "url": "https://www.memoriachilena.gob.cl/602/w3-article-96058.html",
            "hecho_contrastado": "Primera Junta Nacional de Gobierno de 1810 y declaración oficial de independencia de 1818.",
            "evidencia_localizada": "Primera Junta Nacional de Gobierno de 1810; independencia oficial el 12 de febrero de 1818",
            "tipo_cotejo": "HECHO_FOCALIZADO_EN_HTML",
            "fecha_cotejo": "2026-11-23",
            "alcance": "Solo fecha e identificación del hecho; no se revisó la lección completa ni derechos de imágenes.",
        },
    ],
    "D257|MED|Estudios Sociales|N2|6": [
        {
            "titulo": "Naciones Unidas · Registro de tratados (Carta, entrada en vigor)",
            "url": "https://treaties.un.org/Pages/ViewDetails.aspx?chapter=1&mtdsg_no=I-1&src=TREATY",
            "hecho_contrastado": "La Carta de la ONU entró en vigor el 24 de octubre de 1945.",
            "evidencia_localizada": "Entry into force : 24 October 1945",
            "tipo_cotejo": "REGISTRO_DE_TRATADO_HTML",
            "fecha_cotejo": "2026-11-23",
            "alcance": "Confirma la entrada en vigor de la Carta; no coteja otras afirmaciones sobre la ONU.",
        },
        {
            "titulo": "Office of the Historian (EE. UU.) – Berlin Wall and USSR dissolution",
            "url": "https://history.state.gov/departmenthistory/short-history/berlinwall",
            "hecho_contrastado": "Caída del Muro de Berlín en noviembre de 1989 y disolución de la URSS en diciembre de 1991.",
            "evidencia_localizada": "November 9, 1989; December 25, 1991",
            "tipo_cotejo": "HISTORIA_INSTITUCIONAL_HTML",
            "fecha_cotejo": "2026-11-23",
            "alcance": "Página archivada y no mantenida; se comprueban solo las fechas citadas.",
        },
    ],
    "D257|BÁS|Estudios Sociales|N3|2": [
        {
            "titulo": "Naciones Unidas · Registro de tratados (Carta, entrada en vigor)",
            "url": "https://treaties.un.org/Pages/ViewDetails.aspx?chapter=1&mtdsg_no=I-1&src=TREATY",
            "hecho_contrastado": "Entrada en vigor de la Carta fundacional de las Naciones Unidas el 24 de octubre de 1945.",
            "evidencia_localizada": "Entry into force : 24 October 1945",
            "tipo_cotejo": "REGISTRO_DE_TRATADO_HTML",
            "fecha_cotejo": "2026-11-23",
            "alcance": "Solo fecha de la Carta, no toda la historia institucional.",
        },
        {
            "titulo": "Office of the Historian (EE. UU.) – Berlin Wall and USSR dissolution",
            "url": "https://history.state.gov/departmenthistory/short-history/berlinwall",
            "hecho_contrastado": "Caída del Muro de Berlín en noviembre de 1989 y disolución de la URSS en diciembre de 1991.",
            "evidencia_localizada": "November 9, 1989; December 25, 1991",
            "tipo_cotejo": "HISTORIA_INSTITUCIONAL_HTML",
            "fecha_cotejo": "2026-11-23",
            "alcance": "Página archivada y no mantenida; se comprueban solo las fechas citadas.",
        },
    ],
}
def sources_for(oa):
    key = oa["clave_interna"] if isinstance(oa, dict) else oa
    return SOURCES.get(key, [])
