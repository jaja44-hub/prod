# REPORT-TICKET-039

## Summary
Implemented TICKET-039 by routing the approvals workflow through a shared approval-logic context that sends connector-aware advisory and settlement requests into the logic gateway.

## What changed
- Added a shared helper in `src/lib/approvalLogicContext.js` to map approval records to the correct advisory and settlement logic contracts.
- Updated `src/pages/Approvals.jsx` so the Consult Oracle and Approve/Reject actions use that shared context rather than ad-hoc request construction.
- The approvals flow now sends tenant-aware, module-aware advisory and settlement requests to the logic gateway so the cross-repo connector path is exercised in the visible ERP workflow.
- Added a regression script at `scripts/test_ticket_039_workflow_wiring.mjs` to validate the flow contract mapping.

## Verification
- `node ./scripts/test_ticket_039_workflow_wiring.mjs` — passed
- `npm run build` — passed

## Notes
- The workflow now uses the same contract boundary previously validated by the connector regression tests.
- Existing fallback behavior remains intact when the connector is unavailable or returns an error.
