# Si-Lussi v2 Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default Deny Catch-All**: Any path outside `/inspector_accounts/{accountId}`, `/activity_logs/{logId}`, and `/test/{docId}` is strictly denied (`allow read, write: if false;`).
2. **Strict ID Format**: Every `accountId` and `logId` must match `^[a-zA-Z0-9_\-]+$` with length between 1 and 128 characters, and `incoming().id == accountId` (or `logId`).
3. **No Shadow Fields**: `InspectorAccount` and `ActivityLog` writes must pass `hasAll` and `hasOnly` key checks.
4. **Role & Status Constraints**:
   - `role` must be in `['admin', 'inspector']`. Only `'usr-admin-01'` may hold `role == 'admin'`.
   - `status` must be in `['pending', 'approved', 'rejected']`.
   - `balaiPsda` must be one of the 6 official Balai PSDA in Central Java.
5. **Immutable Identity Fields**: `id` cannot be mutated during updates, and `delete` is forbidden on both collections.

## 2. The "Dirty Dozen" Payloads
1. **Ghost/Shadow Field Injection**: `{ id: "usr-1", ..., isSuperAdmin: true }` -> Rejected by `hasOnly()`.
2. **Privilege Escalation (Non-Admin ID claiming Admin role)**: `{ id: "usr-rogue", role: "admin", ... }` -> Rejected because `role == 'admin'` is restricted to `accountId == 'usr-admin-01'`.
3. **Invalid Status Value**: `{ id: "usr-1", status: "hacked", ... }` -> Rejected by enum check `status in ['pending', 'approved', 'rejected']`.
4. **Invalid Balai PSDA Enum**: `{ id: "usr-1", balaiPsda: "Balai Palsu", ... }` -> Rejected by enum check.
5. **Oversized Name String (Denial of Wallet)**: `{ id: "usr-1", name: "A".repeat(5000), ... }` -> Rejected by `name.size() <= 160`.
6. **ID Mismatch Between Path and Payload**: Path `/inspector_accounts/usr-1` with payload `{ id: "usr-2", ... }` -> Rejected by `data.id == accountId`.
7. **Malformed Path ID (Regex Poisoning)**: Path `/inspector_accounts/usr$bad!id` -> Rejected by `isValidId()`.
8. **Missing Required Field**: Payload missing `nip` or `password` -> Rejected by `keys().hasAll(...)`.
9. **Unauthorized Delete on Account**: `delete /inspector_accounts/usr-1` -> Rejected (`allow delete: if false`).
10. **ActivityLog Invalid ActionType**: `{ id: "log-1", actionType: "DROP_DB", ... }` -> Rejected by enum check.
11. **ActivityLog Mutation**: `update /activity_logs/log-1` -> Rejected (`allow update, delete: if false`).
12. **Update Mutating Immutable Account ID**: `update /inspector_accounts/usr-1` changing `id` -> Rejected by `incoming().id == existing().id`.
