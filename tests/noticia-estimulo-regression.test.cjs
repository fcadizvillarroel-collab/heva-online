const test = require('node:test');
const assert = require('node:assert/strict');
const teaching = require('../heva-teaching.js');

test('noticia vacía o titular aislado no satisfacen preguntas dependientes', () => {
  for (const cuerpo of ['', 'Titular de prueba', '   ']) {
    const material = {
      noticiaDidactica: { cuerpo },
      preguntasAlternativas: [{ enunciado: 'Según la noticia, ¿qué ocurrió?' }]
    };
    assert.ok(teaching.inspect(material).issues.some(x => x.code === 'NOTICIA_ALT-1'));
  }
});

test('noticia con cuerpo suficiente satisface la presencia estructural', () => {
  const material = {
    noticiaDidactica: { cuerpo: 'En una localidad se realizó una reunión comunitaria para revisar el acceso a servicios públicos. Los participantes describieron dificultades, presentaron propuestas y acordaron nuevas acciones para el mes siguiente.' },
    preguntasAlternativas: [{ enunciado: 'Según la noticia, ¿qué acordaron los participantes?' }]
  };
  assert.ok(!teaching.inspect(material).issues.some(x => x.code === 'NOTICIA_ALT-1'));
});
