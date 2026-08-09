-- Phase 6: Add budget reference to purchase orders
-- This migration allows purchase orders to reference a budget record directly.
-- Idempotent so it can safely run on a DB that already carries the column.

ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS budget_id INTEGER REFERENCES budgets(id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_budget ON purchase_orders(budget_id);
