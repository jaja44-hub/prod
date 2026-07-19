const express = require('express');
const router = express.Router();
const {
  createJournalEntryFromPO,
  createJournalEntryFromReceipt,
  getJournalEntries,
  getBudgetVariance
} = require('./journal');

router.post('/journal/from-po/:poId', async (req, res) => {
  try {
    const entry = await createJournalEntryFromPO(parseInt(req.params.poId));
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error('Error creating journal entry from PO:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/journal/from-receipt/:receiptId', async (req, res) => {
  try {
    const entry = await createJournalEntryFromReceipt(parseInt(req.params.receiptId));
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error('Error creating journal entry from receipt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/journal', async (req, res) => {
  try {
    const filters = {
      tenant_id: req.query.tenant_id,
      entry_type: req.query.entry_type,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    const entries = await getJournalEntries(filters);
    res.json({ success: true, data: entries, count: entries.length });
  } catch (error) {
    console.error('Error getting journal entries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/budget-variance', async (req, res) => {
  try {
    const variance = await getBudgetVariance(req.query.tenant_id, req.query.category_id ? parseInt(req.query.category_id) : null);
    res.json({ success: true, data: variance });
  } catch (error) {
    console.error('Error getting budget variance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
