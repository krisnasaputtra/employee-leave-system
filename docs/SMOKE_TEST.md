# Production Smoke-Test Checklist

> Run through this checklist after every production deployment to verify critical functionality.

## Prerequisites

- [ ] Supabase project is accessible
- [ ] Application is deployed and reachable
- [ ] At least one ADMIN account exists
- [ ] Public sign-up is disabled (Supabase Dashboard → Authentication → Settings → "Enable sign up" = OFF)

---

## 1. Authentication

- [ ] Admin can sign in with email/password
- [ ] Invalid credentials show error (not raw error)
- [ ] After login, redirected to dashboard (not /dashboard/default)
- [ ] Session persists on page refresh
- [ ] Logout clears session and redirects to /login
- [ ] Unauthenticated access to /dashboard redirects to /login

## 2. Employee Management (Admin only)

- [ ] Admin can create employee WITHOUT login account
- [ ] Admin can create employee WITH login account (temp password)
- [ ] Employee with temp password is forced to change password on first login
- [ ] Admin can update employee details
- [ ] Admin can deactivate employee
- [ ] Non-admin users cannot access employee management

## 3. Configuration (Admin only)

- [ ] Admin can create/edit/toggle departments
- [ ] Admin can create/edit/toggle leave types
- [ ] Admin can create/edit/toggle holidays
- [ ] Non-admin users cannot access settings

## 4. Leave Balances (Admin only)

- [ ] Admin can initialize balances for an employee
- [ ] Admin can adjust balance (add/subtract days)
- [ ] Balance page shows entitled, used, pending, available
- [ ] Ledger entries are created for each change

## 5. Leave Requests (Employee)

- [ ] Employee can create leave request
- [ ] Form shows live balance preview
- [ ] Weekend days are excluded from calculation
- [ ] Holiday days are excluded from calculation
- [ ] Half-day option works correctly
- [ ] Overlapping dates are rejected
- [ ] Insufficient balance is rejected
- [ ] Request created with PENDING status
- [ ] Pending days increase in balance
- [ ] Employee can edit PENDING request
- [ ] Employee can cancel PENDING request
- [ ] Cancel releases pending days back to balance

## 6. Approval Workflow (Manager/Admin)

- [ ] Manager sees only direct-report requests in approval inbox
- [ ] Admin sees all pending requests
- [ ] Manager can approve employee request
- [ ] Approval: status → APPROVED, pending → used, notification created
- [ ] Manager can reject with reason
- [ ] Rejection: status → REJECTED, pending released, notification created
- [ ] Manager CANNOT approve own request
- [ ] Employee CANNOT approve requests

## 7. Shared Calendar

- [ ] Calendar shows APPROVED leave only
- [ ] Calendar does NOT show pending/rejected/cancelled
- [ ] Private leave reason is NOT visible to other employees
- [ ] Sensitive leave types show as "Out of Office"
- [ ] Date range filter works
- [ ] Department filter works
- [ ] Leave type filter works

## 8. Dashboard

- [ ] Employee dashboard shows own metrics (remaining, pending, used)
- [ ] Manager dashboard shows team metrics + pending approvals
- [ ] Admin dashboard shows organization metrics + charts
- [ ] All dashboard data is real (no fake/demo data)

## 9. Notifications

- [ ] Bell icon shows unread count
- [ ] Notification list shows title, message, timestamp
- [ ] Click notification marks as read
- [ ] "Mark All Read" works

## 10. Audit Logs (Admin only)

- [ ] Admin can access audit log page
- [ ] Non-admin redirected away
- [ ] Audit entries show for critical operations
- [ ] Metadata is sanitized (no raw HTML)

## 11. Attachments

- [ ] Employee can upload PDF/JPEG/PNG to PENDING request
- [ ] Upload rejected for invalid file types
- [ ] Upload rejected for files > 5 MB
- [ ] Employee can remove own attachment from PENDING request
- [ ] Owner can download own attachment (signed URL)
- [ ] Manager can download direct-report's attachment
- [ ] Admin can download any attachment
- [ ] Unrelated employee CANNOT download attachment
- [ ] Calendar does NOT expose attachment data

## 12. Security

- [ ] No raw Supabase/Postgres errors visible in UI
- [ ] Service role key not in browser network tab
- [ ] Cannot access /dashboard without authentication
- [ ] Cannot modify URL to access other employee's data
- [ ] Rate limiting active on login endpoint

---

## Failure Handling

If any check fails:
1. Document the failure with screenshots
2. Check Supabase logs for errors
3. Verify RLS policies are active (Supabase Dashboard → Database → Tables → each table → RLS)
4. Do NOT disable RLS to fix issues
5. Create a hotfix migration if needed
