# Database Verification Without Docker

Use this mitigation when `npm run test:db` cannot run because Docker or local Supabase is unavailable.

## SQL Editor Script

Run this file in the linked Supabase project:

```text
supabase/tests/cloud_sql_editor.test.sql
```

Steps:

1. Open Supabase Dashboard -> SQL Editor.
2. Paste the full contents of `supabase/tests/cloud_sql_editor.test.sql`.
3. Run the script against the target project.
4. Confirm the final summary row reports `ALL PASS`.
5. Save the SQL Editor result screenshot or copied result table as release evidence.

## Safety

- The script starts with `begin;` and ends with `rollback;`.
- Test data uses fixed test UUIDs and `@test.com` emails.
- The script deletes any stale rows with those fixed test IDs before setup.
- Do not remove the final `rollback;` when running against staging or production-like databases.

## Coverage

The SQL Editor script is a plain-SQL substitute for the Docker-backed pgTAP suite. It verifies:

- auth helper behavior for current employee and admin checks
- balance initialization and adjustment
- balance ledger creation
- leave request creation and pending reservation
- self-approval prevention
- manager approval of direct reports
- approval status transition and notification creation
- duplicate approval blocking
- reject and cancel transitions
- calendar visibility for approved leave
- approval audit log creation
- unrelated employee approval denial

## Limitations

- This does not replace local pgTAP diagnostics from `npm run test:db`.
- SQL Editor runs with elevated dashboard privileges, so some RLS behavior cannot be observed exactly like a real client session.
- Treat this as release mitigation evidence only when Docker-based DB tests are not available.
