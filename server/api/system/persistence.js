import fs from 'fs';
import path from 'path';

const STORAGE_PATH = path.resolve(process.cwd(), 'production-submodule', 'tmp', 'persistence.json');

function ensureStorage() {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORAGE_PATH)) fs.writeFileSync(STORAGE_PATH, JSON.stringify({}), 'utf8');
}

async function tryServiceGateway() {
  try {
    const sg = await import('../../../src/services/ServiceGateway.js');
    if (sg && typeof sg.saveDocument === 'function' && typeof sg.getDocuments === 'function') return sg;
  } catch (e) {
    // ignore
  }
  return null;
}

export async function saveDocument(collection, id, doc) {
  const sg = await tryServiceGateway();
  if (sg) {
    try { return await sg.saveDocument(collection, id, doc); } catch (e) { /* fallback to file */ }
  }
  ensureStorage();
  const raw = fs.readFileSync(STORAGE_PATH, 'utf8');
  const store = JSON.parse(raw || '{}');
  store[collection] = store[collection] || {};
  store[collection][id] = doc;
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(store, null, 2), 'utf8');
  return { ok: true, id };
}

export async function getDocuments(collection) {
  const sg = await tryServiceGateway();
  if (sg) {
    try { return await sg.getDocuments(collection); } catch (e) { /* fallback */ }
  }
  ensureStorage();
  const raw = fs.readFileSync(STORAGE_PATH, 'utf8');
  const store = JSON.parse(raw || '{}');
  const coll = store[collection] || {};
  return Object.values(coll);
}

export default { saveDocument, getDocuments };
