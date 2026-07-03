import { collection, addDoc } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { getModuleIdForOdooModel } from './moduleRegistry.js'

const subscribers = []

function requireDb() {
  if (!db) {
    throw new Error('Firestore is not initialized. Ensure VITE_FIREBASE_* values are configured.')
  }
  return db
}

function generateEventId() {
  if (typeof crypto !== 'undefined' && crypto?.randomUUID) {
    return crypto.randomUUID()
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function buildTenantEventPayload({ tenantId, eventType, action, odooModel, odooId, actorUid, payload = {}, moduleId }) {
  if (!tenantId) {
    throw new Error('Module event must include tenantId.')
  }
  if (!eventType || !action || !odooModel || !actorUid) {
    throw new Error('Module event must include eventType, action, odooModel, and actorUid.')
  }

  return {
    eventId: generateEventId(),
    eventType,
    action,
    odooModel,
    odooId: odooId || null,
    actorUid,
    moduleId: moduleId || getModuleIdForOdooModel(odooModel) || null,
    tenantId,
    ts: new Date().toISOString(),
    payload: typeof payload === 'object' && payload !== null ? payload : {},
  }
}

export async function emitModuleEvent(eventInput) {
  const event = buildTenantEventPayload(eventInput)
  const dbRef = collection(requireDb(), 'module_events')

  await addDoc(dbRef, event)
  await addDoc(collection(requireDb(), 'audit_log'), {
    ...event,
    auditSource: 'event_bus',
  })

  subscribers.forEach((subscriber) => {
    try {
      subscriber(event)
    } catch {
      // subscriber failures are non-critical
    }
  })

  return event
}

export function onModuleEvent(handler) {
  if (typeof handler !== 'function') {
    throw new Error('onModuleEvent requires a function handler.')
  }
  subscribers.push(handler)
  return () => {
    const index = subscribers.indexOf(handler)
    if (index !== -1) subscribers.splice(index, 1)
  }
}

export function buildOdooWriteEvent({ tenantId, action, odooModel, odooId, actorUid, payload, moduleId }) {
  return buildTenantEventPayload({
    tenantId,
    eventType: 'odoo.write',
    action,
    odooModel,
    odooId,
    actorUid,
    payload,
    moduleId,
  })
}

export default {
  emitModuleEvent,
  onModuleEvent,
  buildOdooWriteEvent,
}
