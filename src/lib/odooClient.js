import axios from 'axios';

/**
 * Universal Odoo Client wrapper for React.
 * This securely routes all requests through the Vercel Serverless Function,
 * keeping the Odoo Master Password completely hidden from the browser.
 */
export const odooClient = {
  /**
   * Execute a method on an Odoo model.
   * 
   * @param {string} model - The Odoo model (e.g., 'res.partner')
   * @param {string} method - The method to call (e.g., 'search_read', 'create', 'write')
   * @param {Array} args - Positional arguments (e.g., [[['is_company', '=', true]]])
   * @param {Object} kwargs - Keyword arguments (e.g., { limit: 10, offset: 0, fields: ['name'] })
   * @returns {Promise<any>} - The data returned by Odoo
   */
  async execute(model, method, args = [], kwargs = {}) {
    try {
      // Calls the secure Vercel Serverless proxy
      const response = await axios.post('/api/odooProxy', {
        model,
        method,
        args,
        kwargs
      });

      return response.data.data;
    } catch (error) {
      console.error('[Odoo Client Error]', error?.response?.data || error.message);
      throw error;
    }
  }
};

// =========================================================
// USAGE EXAMPLES:
// =========================================================

// 1. SEARCH & READ (Fetching Data)
/*
  const partners = await odooClient.execute('res.partner', 'search_read', 
    [[['is_company', '=', true]]], // Domain filter
    { fields: ['id', 'name', 'email'], limit: 5 } // Options
  );
*/

// 2. CREATE (Inserting Data)
/*
  const newPartnerId = await odooClient.execute('res.partner', 'create', 
    [{ name: 'Addis Crown Corp', email: 'hello@addiscrown.com' }]
  );
*/

// 3. WRITE (Updating Data)
/*
  await odooClient.execute('res.partner', 'write', 
    [ [newPartnerId], { email: 'newemail@addiscrown.com' } ]
  );
*/
