-- Phase 6: Add budget reference to purchase orders
-- This migration allows purchase orders to reference a budget record directly.

ALTER TABLE purchase_orders
ADD COLUMN budget_id INTEGER REFERENCES budgets(id);

CREATE INDEX idx_purchase_orders_budget ON purchase_orders(budget_id);
