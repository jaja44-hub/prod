import { collection, getDoc, getDocs, query, where, addDoc, updateDoc, doc, onSnapshot, orderBy, limit as fbLimit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getActiveTenant } from '../services/ServiceGateway';

function requireDb() {
  if (!db) {
    throw new Error('Firestore is not initialized. Ensure VITE_FIREBASE_* is configured.');
  }
  return db;
}

function resolveTenantId() {
  return getActiveTenant();
}

function applyTenantScope(collectionName, filters = []) {
  const tenantId = resolveTenantId();
  return query(
    collection(requireDb(), collectionName),
    where('tenantId', '==', tenantId),
    ...filters,
  );
}

export async function getDocument(collectionName, docId) {
  if (!collectionName || !docId) return null;
  const docSnap = await getDoc(doc(requireDb(), collectionName, docId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  if (data?.tenantId && data.tenantId !== resolveTenantId()) return null;
  return { id: docSnap.id, ...data };
}

export async function listDocuments(collectionName, filters = [], orderByField = 'createdAt', limitCount = 25) {
  const filterClauses = Array.isArray(filters) ? filters.map(([field, op, value]) => where(field, op, value)) : [];
  const orderClause = orderBy(orderByField || 'createdAt', 'desc');
  const limitClause = fbLimit(Number(limitCount || 25));
  const q = applyTenantScope(collectionName, [...filterClauses, orderClause, limitClause]);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createDocument(collectionName, payload) {
  if (!collectionName || !payload || typeof payload !== 'object') {
    throw new Error('createDocument requires a collection name and payload object.');
  }
  const docData = {
    ...payload,
    tenantId: payload.tenantId || resolveTenantId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deleted: false,
  };
  const ref = await addDoc(collection(requireDb(), collectionName), docData);
  return { id: ref.id, ...docData };
}

export async function updateDocument(collectionName, docId, changes) {
  if (!collectionName || !docId || !changes || typeof changes !== 'object') {
    throw new Error('updateDocument requires collectionName, docId, and changes object.');
  }
  const updatePayload = {
    ...changes,
    tenantId: resolveTenantId(),
    updatedAt: new Date().toISOString(),
  };
  await updateDoc(doc(requireDb(), collectionName, docId), updatePayload);
  return { id: docId, ...updatePayload };
}

export async function deleteDocument(collectionName, docId) {
  if (!collectionName || !docId) {
    throw new Error('deleteDocument requires collectionName and docId.');
  }
  await updateDoc(doc(requireDb(), collectionName, docId), {
    deleted: true,
    deletedAt: new Date().toISOString(),
    tenantId: resolveTenantId(),
  });
}

export function listenToCollection(collectionName, filters = [], callback) {
  if (!collectionName || typeof callback !== 'function') {
    throw new Error('listenToCollection requires collectionName and callback function.');
  }
  const filterClauses = Array.isArray(filters) ? filters.map(([field, op, value]) => where(field, op, value)) : [];
  const q = applyTenantScope(collectionName, filterClauses);
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
  return unsubscribe;
}
