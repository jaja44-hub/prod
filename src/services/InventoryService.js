export const InventoryService = {
  async listItems() {
    try {
      return await GW.listTenantCollection('inventory_items');
    } catch (err) {
      return [];
    }
  },

  async getItem(id) {
    return GW.getTenantDoc('inventory_items', id);
  },

  async createItem(payload) {
    const doc = {
      sku: payload.sku || null,
      name: payload.name || '',
      description: payload.description || '',
      quantity: Number(payload.quantity || 0),
      unit: payload.unit || 'pcs',
      location: payload.location || 'default',
      metadata: payload.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return GW.saveTenantDoc('inventory_items', doc);
  },

  async updateItem(id, changes) {
    changes.updatedAt = new Date().toISOString();
    return GW.updateTenantDoc('inventory_items', id, changes);
  },
};

export default InventoryService;
