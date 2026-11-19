"""Concrete, self-contained worked examples. Applied only when the objective explicitly names the topic.
These examples are original didactic constructions; they are not claims of external expert approval.
"""
import re
import unicodedata

def _norm(value):
    return ''.join(c for c in unicodedata.normalize('NFD', value.lower()) if unicodedata.category(c) != 'Mn')

def specific_example(oa):
    text = _norm(oa['texto_literal'])
    subject = _norm(oa['asignatura'])
    if ('matematica' in subject or 'matematicas' in subject):
        if 'porcentaje' in text or 'descuento' in text:
            return ('Un producto cuesta $20.000 y tiene 15 % de descuento. Calcula el precio final.',
                    '15 % de $20.000 = 0,15 × 20.000 = $3.000. Precio final = $20.000 − $3.000 = $17.000. Comprobación: 17.000 + 3.000 = 20.000.',
                    'Si el descuento fuera 10 %, calcula y verifica el nuevo precio final.')
        if 'ecuacion' in text and ('primer grado' in text or 'lineal' in text or 'incognita' in text):
            return ('Resuelve 2x + 6 = 20 y comprueba el resultado.',
                    'Restar 6 a ambos lados: 2x = 14. Dividir por 2: x = 7. Sustitución: 2 × 7 + 6 = 20.',
                    'Resuelve 3x + 5 = 26 y verifica sustituyendo.')
        if 'conmutativ' in text or 'distributiv' in text:
            return ('Compara 4 + 7 y 7 + 4; después calcula 3 × (4 + 2) de dos maneras.',
                    '4 + 7 = 7 + 4 = 11: conmutatividad de la suma. 3 × (4 + 2) = 18 y 3 × 4 + 3 × 2 = 18: distributividad. La resta no es conmutativa: 7 − 4 ≠ 4 − 7.',
                    'Calcula 5 × (3 + 2) usando distributividad y explica por qué no puedes intercambiar siempre los términos de una resta.')
        if 'probabilidad' in text:
            return ('Se lanza un dado equilibrado de seis caras. Calcula la probabilidad de obtener un número par.',
                    'Resultados posibles: {1,2,3,4,5,6}; favorables: {2,4,6}. P(par) = 3/6 = 1/2 = 50 %.',
                    'Calcula la probabilidad de obtener un número mayor que 4 en el mismo dado.')
        if 'media aritmetica' in text or 'promedio' in text or 'mediana' in text:
            return ('Se registran los valores 2, 4 y 6. Calcula media y mediana.',
                    'Media = (2 + 4 + 6)/3 = 4. Ordenados 2, 4, 6, el valor central es 4: mediana = 4.',
                    'Calcula media y mediana para 3, 5 y 10; explica si coinciden.')
    if 'ciencias' in subject:
        if 'atomo' in text and ('particula' in text or 'estructura' in text):
            return ('Un átomo neutro tiene 6 protones y 6 neutrones. Identifica sus partículas y su carga neta.',
                    'Tiene 6 protones de carga positiva, 6 electrones de carga negativa y 6 neutrones sin carga. La carga neta es cero. Los protones y neutrones se encuentran en el núcleo; los electrones ocupan estados permitidos.',
                    'Describe cómo cambia la carga si el átomo pierde un electrón.')
        if 'cambio de estado' in text or 'estados de la materia' in text:
            return ('Un cubo de hielo se derrite dentro de un recipiente. ¿Cambia la sustancia?',
                    'El hielo y el agua líquida son H₂O. La fusión cambia el estado físico, no la identidad química de la sustancia.',
                    'Explica qué ocurre durante la evaporación del agua y qué se conserva.')
    if 'historia' in subject or 'estudios sociales' in subject:
        if 'guerra fria' in text:
            return ('Compara las estrategias internacionales de Estados Unidos y la Unión Soviética durante la Guerra Fría.',
                    'Tras la Segunda Guerra Mundial se consolidó una rivalidad política, ideológica y estratégica. Hubo alianzas, carrera armamentista y conflictos indirectos. No fue una guerra directa general entre ambos Estados.',
                    'Explica una consecuencia de la Guerra Fría para otro país e indica qué fuente histórica consultarías.')
        if 'globalizacion' in text:
            return ('Un teléfono se diseña en un país, utiliza componentes de varios países y se comercializa en Chile.',
                    'El caso evidencia cadenas productivas transnacionales y comercio internacional, dimensiones económicas de la globalización. También pueden analizarse circulación de información y desigualdad de beneficios.',
                    'Identifica una ventaja y un riesgo de esta interdependencia, justificando ambos.')
    if 'convivencia' in subject or 'responsabilidad personal' in subject:
        if 'conflicto' in text or 'negociacion' in text:
            return ('Una persona exige bajar el volumen de la televisión porque necesita descansar.',
                    'Posición: bajar el volumen. Interés o necesidad: descansar. Alternativas: acordar horarios o utilizar audífonos, si son apropiados. El acuerdo requiere escuchar a ambas partes y no imponer soluciones.',
                    'Propón otra solución que respete las necesidades de ambas personas y explica cómo verificar el acuerdo.')
    if 'consumo' in subject or 'financiera' in subject:
        if 'publicitari' in text or 'publicidad' in text:
            return ('Un anuncio afirma: «Solo hoy, 50 % de descuento», sin indicar el precio anterior ni condiciones.',
                    'El mensaje utiliza urgencia para persuadir. Para comprobar el ahorro se requiere precio anterior verificable, precio final, vigencia y restricciones. Sin estos datos no se puede confirmar el descuento real.',
                    'Redacta dos preguntas que harías al vendedor para verificar la publicidad.')
    if 'emprendimiento' in subject or 'laboral' in subject:
        if 'costo' in text or 'empresa' in text or 'emprendim' in text:
            return ('Un pequeño emprendimiento obtiene $100.000 en ventas y tiene $70.000 en costos del período.',
                    'Resultado antes de impuestos y otros gastos no incluidos = $100.000 − $70.000 = $30.000. No equivale necesariamente al dinero disponible ni a utilidad neta final.',
                    'Calcula el resultado si los costos aumentan a $85.000 y explica una medida para controlarlos.')
    return None
