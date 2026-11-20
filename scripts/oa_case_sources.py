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
        },
    ],
    "D257|MED|Estudios Sociales|N2|6": [
        {
            "titulo": "Naciones Unidas – Historia de la ONU",
            "url": "https://www.un.org/about-us/history-of-the-un",
            "hecho_contrastado": "La ONU comenzó oficialmente el 24 de octubre de 1945.",
        },
        {
            "titulo": "Office of the Historian (EE. UU.) – Berlin Wall and USSR dissolution",
            "url": "https://history.state.gov/departmenthistory/short-history/berlinwall",
            "hecho_contrastado": "Caída del Muro de Berlín en 1989 y disolución de la URSS en 1991.",
        },
    ],
    "D257|BÁS|Estudios Sociales|N3|2": [
        {
            "titulo": "Naciones Unidas – Historia de la ONU",
            "url": "https://www.un.org/about-us/history-of-the-un",
            "hecho_contrastado": "Fundación de las Naciones Unidas en 1945.",
        },
        {
            "titulo": "Office of the Historian (EE. UU.) – Berlin Wall and USSR dissolution",
            "url": "https://history.state.gov/departmenthistory/short-history/berlinwall",
            "hecho_contrastado": "Caída del Muro en 1989 y disolución de la URSS en 1991.",
        },
    ],
}
def sources_for(oa):
    key = oa["clave_interna"] if isinstance(oa, dict) else oa
    return SOURCES.get(key, [])
