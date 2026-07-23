# Firebase Migration Plan

## Current State
- HR: Uses Neon (api/hr.js) - needs Firebase Realtime DB for attendance
- Inventory: Uses Neon (api/inventory.js) - needs Firebase Realtime DB for live sync

## Migration Steps

### Phase 1: Firebase Setup
- Create Firebase Realtime DB structure for HR/attendance
- Create Firebase Realtime DB structure for Inventory

### Phase 2: API Updates
- Create api/firebase-hr.js for Firebase-based HR endpoints
- Create api/firebase-inventory.js for Firebase-based inventory endpoints
- Update firebase-bridge.js for bidirectional sync

### Phase 3: UI Updates
- Update Employees.jsx to use Firebase API
- Update Inventory.jsx to use Firebase API
- Keep Neon for payroll (ACID compliance)

### Phase 4: Data Migration
- Migrate employees from Neon to Firebase
- Migrate inventory from Neon to Firebase
- Verify sync via firebase-bridge

## Notes
- Per architecture: Firebase for live sync, Neon for ACID compliance
- Attendance data in Firebase → Firestore aggregates → Neon Analytics
- Inventory stock in Firebase → Neon Analytics for reporting
