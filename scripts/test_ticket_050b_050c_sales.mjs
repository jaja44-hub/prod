import { createQuote, getQuotes, convertQuoteToOrder } from '../server/api/sales/quotes.js';
import { createOrder, getOrders } from '../server/api/sales/orders.js';

(async () => {
  try {
    const tenant = 'test-tenant';
    const q = await createQuote(tenant, { name: 'Q-1', partnerId: 'cust-200', lines: [{ productId: 100, quantity: 5, unitPrice: 200 } ] });
    if (!q.quoteId) throw new Error('Quote did not create');
    const qs = await getQuotes(tenant);
    if (!Array.isArray(qs) || !qs.some((x) => x.quoteId === q.quoteId)) throw new Error('Quote list missing created quote');

    const conv = await convertQuoteToOrder(q.quoteId, tenant, 'test-user');
    if (!conv.order) throw new Error('Quote conversion failed');
    if (conv.quote.state !== 'converted') throw new Error('Quote state not updated to converted');

    const ord = await createOrder(tenant, { partnerId: 'cust-300', lines: [{ productId: 101, quantity: 2, unitPrice: 150 } ] });
    if (!ord.order) throw new Error('Order creation failed');

    const orders = await getOrders(tenant);
    if (!Array.isArray(orders)) throw new Error('Orders list retrieval failed');

    console.log('TICKET-050b/050c sales tests passed');
    process.exit(0);
  } catch (err) {
    console.error('TICKET-050b/050c sales tests failed', err);
    process.exit(2);
  }
})();
