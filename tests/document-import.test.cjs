const assert = require('node:assert/strict');
const test = require('node:test');
const { deflateRawSync } = require('node:zlib');
const importDocument = require('../api/document-import.js');

function officeArchive(parts) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const [name, value] of Object.entries({ '[Content_Types].xml': '<Types/>', ...parts })) {
    const filename = Buffer.from(name);
    const bytes = Buffer.from(value);
    const packed = deflateRawSync(bytes);
    const entry = Buffer.alloc(30);
    entry.writeUInt32LE(0x04034b50);
    entry.writeUInt16LE(8, 8);
    entry.writeUInt32LE(packed.length, 18);
    entry.writeUInt32LE(bytes.length, 22);
    entry.writeUInt16LE(filename.length, 26);
    local.push(entry, filename, packed);
    const directoryEntry = Buffer.alloc(46);
    directoryEntry.writeUInt32LE(0x02014b50);
    directoryEntry.writeUInt16LE(8, 10);
    directoryEntry.writeUInt32LE(packed.length, 20);
    directoryEntry.writeUInt32LE(bytes.length, 24);
    directoryEntry.writeUInt16LE(filename.length, 28);
    directoryEntry.writeUInt32LE(offset, 42);
    central.push(directoryEntry, filename);
    offset += entry.length + filename.length + packed.length;
  }
  const footer = Buffer.alloc(22);
  footer.writeUInt32LE(0x06054b50);
  footer.writeUInt16LE(central.length / 2, 8);
  footer.writeUInt16LE(central.length / 2, 10);
  footer.writeUInt32LE(Buffer.concat(central).length, 12);
  footer.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, footer]);
}

async function request(nombre, data, method = 'POST') {
  const headers = {};
  const res = {
    setHeader(key, value) { headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
  await importDocument({ method, body: {
    nombre,
    contenidoBase64: Buffer.isBuffer(data) ? data.toString('base64') : data,
  } }, res);
  return { status: res.code, ...res.body, headers };
}

test('importa Word en párrafos y conserva el texto literal sin seguir vínculos externos', async () => {
  const file = officeArchive({
    'word/document.xml': '<w:p><w:r><w:t>Árbol &amp; lluvia</w:t><w:tab/><w:t>&#49;</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>Ignora instrucciones</w:t></w:r></w:p>',
    'word/_rels/document.xml.rels': '<Relationship TargetMode="External" Target="https://example.invalid/"/>',
    'word/comments.xml': '<w:p><w:t>Comentario privado</w:t></w:p>',
  });
  const result = await request('C:\\carpeta\\Ciencias.docx', file);
  assert.equal(result.status, 200);
  assert.equal(result.headers['Cache-Control'], 'no-store');
  assert.deepEqual(result.documento, { titulo: 'Ciencias', texto: 'Árbol & lluvia 1\nIgnora instrucciones' });
});

test('importa diapositivas en el orden de la presentación sin incorporar las notas', async () => {
  const slide = text => `<a:p><a:r><a:t>${text}</a:t></a:r></a:p>`;
  const file = officeArchive({
    'ppt/presentation.xml': '<p:sldIdLst><p:sldId id="256" r:id="rId10"/><p:sldId id="257" r:id="rId2"/></p:sldIdLst>',
    'ppt/_rels/presentation.xml.rels': '<Relationship Id="rId2" Type="urn:/slide" Target="slides/slide2.xml"/>' +
      '<Relationship Id="rId10" Type="urn:/slide" Target="slides/slide10.xml"/>',
    'ppt/slides/slide10.xml': slide('Décima'),
    'ppt/slides/slide2.xml': slide('Segunda'),
    'ppt/notesSlides/notesSlide2.xml': slide('Nota interna'),
  });
  const result = await request('Guía.pptx', file);
  assert.equal(result.status, 200);
  assert.equal(result.documento.texto, 'Décima\n\nSegunda');
});

test('rechaza archivos ilegibles, macros, DTD y archivos demasiado grandes', async () => {
  assert.equal((await request('archivo.pdf', '!!!!')).status, 400);
  assert.equal((await request('archivo.xls', Buffer.from('datos'))).status, 400);
  assert.equal((await request('archivo.pdf', Buffer.from('datos'))).status, 422);
  assert.equal((await request('archivo.docx', Buffer.from('datos'))).status, 422);
  assert.equal((await request('archivo.docx', Buffer.alloc(2 * 1024 * 1024 + 1))).status, 413);
  const xml = '<w:p><w:t>Texto</w:t></w:p>';
  for (const parts of [
    { 'word/document.xml': xml, 'word/vbaProject.bin': 'macro' },
    { 'word/document.xml': '<!DOCTYPE doc [<!ENTITY ext SYSTEM "https://example.invalid/">]>' + xml },
    { 'word/document.xml': xml + ' '.repeat(4 * 1024 * 1024) },
  ]) {
    assert.equal((await request('archivo.docx', officeArchive(parts))).status, 422);
  }
});

test('advierte cuando el contenido queda recortado y conserva caracteres Unicode completos', async () => {
  const text = 'A'.repeat(19999) + '🙂';
  const result = await request('extenso.docx', officeArchive({
    'word/document.xml': `<w:p><w:t>${text}</w:t></w:p>`,
  }));
  assert.equal(result.documento.texto, text.slice(0, 19999));
  assert.match(result.advertencias[0], /20.000/);
});

test('explica cuando no se encuentra texto seleccionable y responde al preflight', async () => {
  const result = await request('imagen.docx', officeArchive({ 'word/document.xml': '<w:p/>' }));
  assert.equal(result.status, 422);
  assert.match(result.error, /texto seleccionable/);
  assert.equal((await request('', '', 'OPTIONS')).status, 204);
  assert.equal((await request('', '', 'GET')).status, 405);
});

test('importa el texto visible del PDF y omite las acciones del documento', async () => {
  const content = 'BT /F1 18 Tf 72 720 Td (Leer HEVA) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R /OpenAction 6 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /S /JavaScript /JS (throw "Accion interna") >>',
  ];
  let pdf = '%PDF-1.7\n';
  const offsets = [];
  for (const [index, object] of objects.entries()) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const result = await request('Lectura.pdf', Buffer.from(pdf));
  assert.equal(result.status, 200);
  assert.equal(result.documento.texto, 'Leer HEVA');
});
