# HEVA B — laboratorio Z.ai GLM-4.7

Esta rama es un experimento. NO hacer merge en main hasta contrastar materiales.
La versión A sigue en https://heva-online.vercel.app/.

## Configuración de vista previa Vercel
En Vercel > heva-online > Settings > Environment Variables, agregar **solo a Preview**:
- `ZAI_API_KEY`: clave privada obtenida en https://z.ai/ (no compartirla en chats ni ponerla en GitHub).
- `ZAI_MODEL`: `glm-4.7` (opcional, valor por defecto). Para experimentar con variante económica, usar `glm-4.7-flash`, sujeto a disponibilidad.
Luego redeplegar la rama experimental. La clave se lee únicamente en el backend.

**IMPORTANTE:** El modelo GLM-4.7 no es necesariamente gratuito; consultar precios, condiciones y límites en Z.ai. No se habilitan compras ni planes de pago automáticamente por este código. No introducir datos identificatorios de estudiantes en solicitudes a terceros.

## Cómo funciona
En HEVA B, Z.ai es el primer proveedor cuando ZAI_API_KEY está configurada; Gemini y Groq siguen como respaldo, igual que en main. La versión A no cambia. Se usa el mismo contrato pedagógico y la misma exportación Word/PowerPoint.
La revisión de IA admite la autoría `zai` y excluye ese proveedor al pedir revisión independiente. La API `/api/status` añade diagnóstico de conectividad Z.ai.

## Comparación equivalente A / B
Crear el mismo tema, OA, nivel y parámetros en ambas versiones, para GUIA, PRUEBA, PRESENTACION, PLANIFICACION y ACCESIBLE. Registrar en una tabla:
- Tasa de éxito estructural, número de reintentos y tiempo.
- Correspondencia OA/marco curricular y exactitud de contenidos respaldada en documentos originales.
- Claridad de explicación, diversidad de ejercicios, distractores y accesibilidad.
- Visualización real de archivos DOCX/PPTX (la mejora del modelo no cambia el exportador).
- Costo real en tokens/importe y cuotas.
- Autoría IA indicada en el material; si B usa fallback, la prueba no cuenta como generación Z.ai.

## Prueba técnica
`npm test` incluye `tests/zai-b.test.cjs` con una respuesta simulada (sin clave real). Eso prueba el encaminamiento, no la calidad pedagógica ni la conectividad real.
