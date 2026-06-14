import * as GW from './ServiceGateway';
import { getDocs } from 'firebase/firestore';

export const WorkOrderService = {
  async listWorkOrders() {
    try {
      const q = GW.tenantQuery('work_orders');
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      return [];
    }
  },

  async getWorkOrder(id) {
    return GW.getTenantDoc('work_orders', id);
  },

  async createWorkOrder(payload) {
    const doc = {
      reference: payload.reference || `WO-${Date.now()}`,
      title: payload.title || 'New Work Order',
      description: payload.description || '',
      status: 'pending',
      priority: payload.priority || 'normal',
      items: payload.items || [],
      assignedTo: payload.assignedTo || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return GW.saveTenantDoc('work_orders', doc);
  },

  async updateWorkOrder(id, changes) {
    changes.updatedAt = new Date().toISOString();
    return GW.updateTenantDoc('work_orders', id, changes);
  },
};

export default WorkOrderService;
