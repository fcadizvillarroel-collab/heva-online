# HEVA · Cotejo puntual de hechos con fuentes institucionales (23-11-2026)

**Alcance estricto:** se contrastaron algunas afirmaciones históricas asociadas a **3 de los 407 OA EPJA**; los otros 404 no tienen un cotejo factual individual documentado en esta matriz. No equivale a aprobar las 3 lecciones completas, las imágenes, las normativas ni las respuestas por un revisor experto.

| OA exacto | Afirmación cotejada | Documento institucional | Evidencia localizada / limitación |
| --- | --- | --- | --- |
| `D257|MED|Estudios Sociales|N1|2` | Junta de Gobierno de 1810; declaración oficial de independencia de Chile de febrero de 1818 | [Memoria Chilena, Biblioteca Nacional](https://www.memoriachilena.gob.cl/602/w3-article-96058.html) | La página sitúa la Junta en 1810 y fecha la independencia oficial el 12 de febrero de 1818; NO autoriza reutilizar automáticamente objetos digitales |
| `D257|MED|Estudios Sociales|N2|6` | Entrada en vigor de la Carta de Naciones Unidas el 24 de octubre de 1945 | [Colección de Tratados de la ONU](https://treaties.un.org/Pages/ViewDetails.aspx?chapter=1&mtdsg_no=I-1&src=TREATY) | Registro depositario de la Carta con fecha de entrada en vigor; distingue la firma de junio de su vigencia en octubre |
| `D257|BÁS|Estudios Sociales|N3|2` | Entrada en vigor de la Carta en 1945 | [Colección de Tratados de la ONU](https://treaties.un.org/Pages/ViewDetails.aspx?chapter=1&mtdsg_no=I-1&src=TREATY) | Confirma solo este hito, no la exactitud global del material |
| Dos OA anteriores de estudios sociales sobre la Guerra Fría | Caída del Muro de Berlín en 1989 y disolución de la URSS en 1991 | [Office of the Historian, Departamento de Estado estadounidense](https://history.state.gov/departmenthistory/short-history/berlinwall) | Página que indica noviembre de 1989 y diciembre de 1991; **serie archivada, ya no se mantiene** |

## Qué se mejoró
El archivo `scripts/oa_case_sources.py` consigna fecha del cotejo, afirmación precisa, evidencia localizable, tipo de página institucional y alcance de cada comprobación. La matriz `scripts/audit_oa407_source_evidence.py` distribuye **407 filas con 3 OA parcialmente cotejados y 404 pendientes** y rechaza URLs fuera de las instituciones permitidas. Las citas corresponden a páginas HTML, no a inspecciones completas de PDF ni a derechos sobre fotografías.

## Qué permanece pendiente
- Contrastar todas las afirmaciones disciplinares de cada uno de los 407 materiales con fuentes originales.
- Verificar por recurso visual su licencia individual, autoría, pertinencia curricular y condiciones de reutilización.
- Inspeccionar visualmente las páginas renderizadas y documentar dictamen de revisores competentes.
- No clasificar como «APROBADO» un material por tener un URL institucional, por aprobar pruebas de formato, o por coincidir literalmente con el OA de Supabase.

Este registro es un insumo real para cotejo y priorización, **no una certificación general**.
