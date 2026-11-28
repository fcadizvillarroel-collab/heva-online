const { inflateRawSync } = require('node:zlib');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { applyCors } = require('./_cors.cjs');

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_BASE64 = Math.ceil(MAX_BYTES / 3) * 4;
const MAX_XML = 4 * 1024 * 1024;
const MAX_PAGES = 40;
const MAX_TEXT = 20000;
const decoder = new TextDecoder('utf-8', { fatal: true });

function invalidArchive() {
  return new Error('Archivo Office inválido');
}

function readOfficeEntries(data) {
  if (data.length < 22) throw invalidArchive();
  const earliestFooter = Math.max(0, data.length - 22 - 65535);
  let footer = data.length - 22;
  for (; footer >= earliestFooter; footer--) {
    if (data.readUInt32LE(footer) === 0x06054b50 &&
        footer + 22 + data.readUInt16LE(footer + 20) === data.length) break;
  }
  if (footer < earliestFooter || data.readUInt32LE(footer + 4) !== 0) throw invalidArchive();

  const total = data.readUInt16LE(footer + 10);
  const size = data.readUInt32LE(footer + 12);
  let cursor = data.readUInt32LE(footer + 16);
  const start = cursor;
  if (total < 1 || total > 2048 || total !== data.readUInt16LE(footer + 8) ||
      cursor + size !== footer) throw invalidArchive();

  const entries = new Map();
  for (let index = 0; index < total; index++) {
    if (cursor + 46 > footer || data.readUInt32LE(cursor) !== 0x02014b50) throw invalidArchive();
    const nameLength = data.readUInt16LE(cursor + 28);
    const next = cursor + 46 + nameLength + data.readUInt16LE(cursor + 30) + data.readUInt16LE(cursor + 32);
    if (next > footer || data.readUInt16LE(cursor + 34) !== 0) throw invalidArchive();

    const name = data.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    if (entries.has(name) || /(?:^|\/)vbaProject\.bin$/i.test(name)) throw invalidArchive();
    entries.set(name, {
      flags: data.readUInt16LE(cursor + 8),
      method: data.readUInt16LE(cursor + 10),
      compressed: data.readUInt32LE(cursor + 20),
      expanded: data.readUInt32LE(cursor + 24),
      offset: data.readUInt32LE(cursor + 42),
      archiveEnd: start,
    });
    cursor = next;
  }
  if (cursor !== footer || !entries.has('[Content_Types].xml')) throw invalidArchive();
  return entries;
}

function readOfficeXml(data, entry, name, remainingBytes) {
  const { flags, method, compressed, expanded, offset, archiveEnd } = entry;
  if (expanded > remainingBytes || (flags & 0x41) || ![0, 8].includes(method) ||
      offset + 30 > archiveEnd || data.readUInt32LE(offset) !== 0x04034b50 ||
      data.readUInt16LE(offset + 6) !== flags || data.readUInt16LE(offset + 8) !== method) throw invalidArchive();
  const nameLength = data.readUInt16LE(offset + 26);
  const start = offset + 30 + nameLength + data.readUInt16LE(offset + 28);
  if (start + compressed > archiveEnd || data.toString('utf8', offset + 30, offset + 30 + nameLength) !== name) {
    throw invalidArchive();
  }
  const bytes = data.subarray(start, start + compressed);
  const xml = method === 8 ? inflateRawSync(bytes, { maxOutputLength: Math.max(1, expanded) }) : bytes;
  if (xml.length !== expanded) throw invalidArchive();
  return decoder.decode(xml);
}

function decodeXmlText(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return value.replace(/&(amp|lt|gt|quot|apos|#\d{1,7}|#x[\da-fA-F]{1,6});/g, (_, entity) => {
    if (entity[0] !== '#') return named[entity];
    const code = entity[1] === 'x' ? Number.parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '';
  });
}

function extractXmlText(xml, presentation) {
  // Office exports these namespaces with their conventional prefixes. Treat all text as data.
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) throw invalidArchive();
  const tags = presentation
    ? /<a:(p|t|br)(?=[\s/>])[^<>]*>|<\/a:(p|t)\s*>|<!--|<!\[CDATA\[|<[^<>]*>|[^<]+|</g
    : /<w:(p|t|tab|br|cr)(?=[\s/>])[^<>]*>|<\/w:(p|t)\s*>|<!--|<!\[CDATA\[|<[^<>]*>|[^<]+|</g;
  const output = [];
  let paragraph = null;
  let textRun = false;
  let token;
  while ((token = tags.exec(xml))) {
    const [tag, opening, closing] = token;
    if (tag === '<!--' || tag === '<![CDATA[') {
      const terminator = tag === '<!--' ? '-->' : ']]>';
      const end = xml.indexOf(terminator, tags.lastIndex);
      if (end < 0) throw invalidArchive();
      if (tag === '<![CDATA[' && textRun) paragraph += xml.slice(tags.lastIndex, end);
      tags.lastIndex = end + terminator.length;
      continue;
    }
    if (opening === 'p' || closing === 'p') {
      if (paragraph?.trim()) output.push(paragraph.trim());
      paragraph = opening ? '' : null;
      textRun = false;
    } else if (paragraph !== null) {
      if (opening === 't' || closing === 't') textRun = Boolean(opening) && !tag.endsWith('/>');
      else if (opening) paragraph += opening === 'tab' ? ' ' : '\n';
      else if (textRun && !tag.startsWith('<')) paragraph += decodeXmlText(tag);
    }
  }
  return output.join('\n');
}

function extractOffice(data, presentation) {
  const entries = readOfficeEntries(data);
  let remaining = MAX_XML;
  function readPart(name) {
    const entry = entries.get(name);
    if (!entry) throw invalidArchive();
    const xml = readOfficeXml(data, entry, name, remaining);
    remaining -= entry.expanded;
    return xml;
  }
  let parts = ['word/document.xml'];
  if (presentation) {
    const manifest = readPart('ppt/presentation.xml');
    const relations = readPart('ppt/_rels/presentation.xml.rels');
    const slidePath = /^slides\/slide[1-9]\d{0,5}\.xml$/;
    const targets = new Map();
    for (const [tag] of relations.matchAll(/<(?:[\w.-]+:)?Relationship\b[^<>]*>/g)) {
      const attrs = readXmlAttributes(tag);
      if (attrs.Type?.endsWith('/slide') && attrs.TargetMode !== 'External' && slidePath.test(attrs.Target)) {
        targets.set(attrs.Id, 'ppt/' + attrs.Target);
      }
    }
    parts = [...manifest.matchAll(/<(?:[\w.-]+:)?sldId\b[^<>]*>/g)].map(([tag]) => {
      const attrs = readXmlAttributes(tag);
      const reference = Object.keys(attrs).find(key => key.endsWith(':id'));
      return targets.get(attrs[reference]);
    });
    if (!parts.length || parts.some(name => !name || !entries.has(name))) throw invalidArchive();
  }
  const texts = parts.slice(0, MAX_PAGES).map(name => extractXmlText(readPart(name), presentation));
  return { text: texts.filter(Boolean).join('\n\n'), limitedPages: parts.length > MAX_PAGES };
}

function readXmlAttributes(tag) {
  const attrs = Object.create(null);
  for (const [, name, , value] of tag.matchAll(/([\w.:-]+)\s*=\s*(["'])(.*?)\2/g)) attrs[name] = value;
  return attrs;
}

async function extractPdf(data) {
  if (data.toString('ascii', 0, 5) !== '%PDF-') throw new Error('Archivo PDF inválido');
  const { PDFParse } = require('pdf-parse');
  PDFParse.setWorker(pathToFileURL(path.join(path.dirname(require.resolve('pdf-parse')), 'pdf.worker.mjs')).href);
  const parser = new PDFParse({
    data: new Uint8Array(data),
    isEvalSupported: false,
    enableXfa: false,
    useSystemFonts: false,
    disableFontFace: true,
  });
  try {
    const result = await parser.getText({ first: MAX_PAGES, pageJoiner: '' });
    return { text: result.text, limitedPages: result.total > MAX_PAGES };
  } finally {
    await parser.destroy();
  }
}

module.exports = async function documentImport(req, res) {
  applyCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const fail = (status, error) => res.status(status).json({ exito: false, error });
  if (req.method !== 'POST') return fail(405, 'Método no permitido.');
  const { nombre, contenidoBase64 } = req.body || {};
  if (typeof nombre !== 'string' || nombre.length > 255 ||
      typeof contenidoBase64 !== 'string' || !contenidoBase64) {
    return fail(400, 'Envía un archivo PDF, DOCX o PPTX con su nombre.');
  }
  const match = /^(.+)\.(pdf|docx|pptx)$/i.exec(nombre);
  if (!match) return fail(400, 'Formato no compatible. Usa PDF, DOCX o PPTX.');
  if (contenidoBase64.length > MAX_BASE64) return fail(413, 'El archivo supera el máximo de 2 MB.');
  if (contenidoBase64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(contenidoBase64)) {
    return fail(400, 'El contenido del archivo no es válido.');
  }
  const data = Buffer.from(contenidoBase64, 'base64');
  if (data.length > MAX_BYTES) return fail(413, 'El archivo supera el máximo de 2 MB.');
  if (data.toString('base64') !== contenidoBase64) return fail(400, 'El contenido del archivo no es válido.');

  const format = match[2].toLowerCase();
  let extracted;
  try {
    extracted = format === 'pdf' ? await extractPdf(data) : extractOffice(data, format === 'pptx');
  } catch {
    return fail(422, 'No se pudo leer el archivo. Comprueba que abra bien, que no esté protegido y que no contenga macros.');
  }
  const text = extracted.text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  if (!text) return fail(422, 'No se encontró texto seleccionable. Si es un escaneo, importa una versión con texto o pégalo en HEVA.');
  const advertencias = [];
  if (extracted.limitedPages) advertencias.push('Se leyeron las primeras 40 páginas o diapositivas.');
  if (text.length > MAX_TEXT) advertencias.push('Se conservaron hasta 20.000 caracteres.');
  const titulo = match[1].split(/[\\/]/).at(-1).trim().slice(0, 120) || 'Documento importado';
  return res.status(200).json({
    exito: true,
    documento: { titulo, texto: text.slice(0, MAX_TEXT).replace(/[\uD800-\uDBFF]$/, '') },
    advertencias,
  });
};
