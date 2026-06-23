# Comprehensive Code Review Checklist

# Leave Request Management System — Next.js + Supabase

## Purpose

Dokumen ini digunakan sebagai panduan code review untuk source code **Leave Request Management System** yang dibangun menggunakan:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Supabase Storage
- PostgreSQL Functions / RPC
- TanStack Table
- FullCalendar

Checklist ini dapat digunakan untuk source code yang dibuat secara manual maupun menggunakan AI Coding Assistant seperti Antigravity CLI, Gemini CLI, Amazon Q, GitHub Copilot, Cursor, atau Claude Code.

Tujuan utama code review:

- Memastikan fitur berjalan sesuai PRD
- Mengurangi functional defect
- Menjaga data integrity
- Mengidentifikasi security vulnerability
- Memastikan RLS dan authorization berjalan benar
- Meningkatkan maintainability
- Menjaga performance aplikasi
- Memastikan UI konsisten dengan BNI Brutalist Theme
- Mengidentifikasi risiko khusus pada code hasil AI

---

# Project Context

## Application

```text
Leave Request Management System
```

## Roles

```text
ADMIN
MANAGER
EMPLOYEE
```

## Main Features

- Supabase authentication
- Employee management
- Employee account provisioning
- Department management
- Leave type management
- Holiday management
- Leave balance and ledger
- Leave request CRUD
- Manager approval workflow
- Shared employee leave calendar
- Notification
- Audit log
- Supabase Storage attachment
- BNI Brutalist UI theme

## Main Business Flow

```text
Admin creates employee
→ Admin optionally creates Auth account
→ Employee signs in
→ Employee checks balance
→ Employee creates leave request
→ Pending balance is reserved
→ Manager approves or rejects
→ Balance and ledger are updated
→ Notification and audit log are created
→ Approved leave appears in calendar
```

---

# 1. Functional Correctness

## Tujuan

Memastikan seluruh fitur bekerja sesuai PRD, business rule, dan workflow aplikasi.

## Requirement Coverage

Review:

- Apakah seluruh requirement pada PRD telah diimplementasikan?
- Apakah task pada `task.md` sesuai implementasi nyata?
- Apakah ada task yang ditandai selesai tetapi belum benar-benar selesai?
- Apakah ada placeholder route seperti:

```text
Page not found.
This section will be added in future updates.
```

- Apakah Quick Create menuju halaman create leave request?
- Apakah menu All Requests tersedia?
- Apakah seluruh menu sesuai role?
- Apakah tombol atau icon header benar-benar memiliki fungsi?

## Employee Management

Review:

- Admin dapat membuat employee tanpa Auth account
- Admin dapat membuat employee dengan Auth account
- Employee code unik
- Work email unik
- Employee dapat diaktifkan dan dinonaktifkan
- Employee inactive tidak dapat login
- Employee tidak dapat menjadi manager dirinya sendiri
- Employee tidak di-hard delete jika memiliki historical data
- Supabase Auth user tidak orphan jika profile creation gagal
- `employees.auth_user_id` konsisten dengan `auth.users.id`

## Employee Query Relationship

Review error:

```text
Could not embed because more than one relationship was found
for 'employees' and 'departments'
```

Pastikan:

- Query menggunakan explicit foreign key hint
- Relationship yang dipakai tidak ambigu
- Generated database types terbaru
- Department employee dibedakan dari department manager
- Query tetap mendukung pagination dan filter

Contoh:

```typescript
departments!employees_department_id_fkey(...)
```

Jangan menghilangkan join hanya untuk menyembunyikan error.

## Leave Request

Review:

- Employee dapat membuat leave request
- Leave type wajib dipilih
- Start date dan end date wajib
- End date tidak boleh sebelum start date
- Weekend dan holiday dihitung sesuai requirement
- Half-day dihitung sebagai `0.5`
- Database/RPC menghitung authoritative requested days
- Client tidak dipercaya untuk total hari
- Request tidak overlap dengan Pending atau Approved
- Request tidak melebihi available balance
- Pending request dapat diedit dan dibatalkan
- Approved, Rejected, dan Cancelled tidak dapat diedit
- Status transition valid

## Leave Balance

Review formula:

```text
remaining = entitled_days + adjustment_days - used_days
available_to_request = remaining - pending_days
```

Pastikan:

- Pending request menambah `pending_days`
- Approved memindahkan pending ke used
- Rejected melepaskan pending
- Cancelled membalik nilai sesuai status
- Adjustment selalu membuat ledger
- Balance tidak dimodifikasi langsung dari client
- Ledger append-only
- Numeric precision mendukung half-day
- Negative balance hanya jika leave type mengizinkan

## Approval Workflow

Review:

- Employee tidak dapat approve atau reject
- Manager hanya melihat direct report
- Manager tidak dapat approve request sendiri
- Admin dapat memproses seluruh request
- Hanya Pending yang dapat diproses
- Rejection reason wajib
- Approval dan balance update atomik
- Duplicate approval tidak menggandakan balance
- Notification dibuat
- Audit log dibuat

## Calendar

Review:

- Hanya Approved request yang tampil
- Pending, Rejected, dan Cancelled tidak tampil
- Query hanya visible date range
- Filter department, employee, dan leave type bekerja
- Sensitive leave type ditampilkan sebagai `Out of Office`
- Reason, attachment, balance, dan rejection reason tidak dikirim ke client calendar

## Authentication

Review:

- Login dan logout bekerja
- Protected route tidak dapat dibuka anonymous
- Inactive account ditolak
- `must_change_password` bekerja
- Public sign-up dinonaktifkan
- Session divalidasi server-side
- Redirect aman
- Auth callback tidak open redirect

## Edge Cases

Review:

- Null employee profile
- Employee tanpa Auth account
- Manager tanpa direct report
- Empty balance atau list
- Invalid UUID
- Duplicate submission
- Double click submit
- Stale page setelah mutation
- Concurrent approval
- Concurrent leave request pada balance yang sama
- Employee inactive saat request Pending
- File upload gagal setelah metadata berhasil
- Metadata gagal setelah Storage upload berhasil

## Data Integrity

Review:

- Tidak ada orphan Auth user
- Tidak ada orphan balance atau ledger
- Tidak ada orphan attachment metadata
- Tidak ada request tanpa employee
- Tidak ada duplicate balance untuk employee, leave type, dan year
- Historical request tidak hilang ketika configuration dinonaktifkan

---

# 2. Security Review — OWASP and Supabase

## Authentication

Review:

- Tidak ada hardcoded credential, token, atau API key
- Tidak ada `SUPABASE_SECRET_KEY` di client bundle
- Service-role key tidak memakai prefix `NEXT_PUBLIC_`
- Session menggunakan cookie-based SSR
- User divalidasi server-side
- Public sign-up disabled
- Password dan temporary password tidak dicatat
- Auth redirect allowlist benar
- Session tidak disimpan manual di Local Storage

## Authorization

Review:

- Setiap Server Action melakukan auth dan permission check
- Middleware bukan satu-satunya authorization layer
- Employee hanya melihat data sendiri
- Manager hanya melihat direct report
- Admin-only route benar-benar protected
- Role dan employee ID tidak dipercaya dari payload
- Manager tidak dapat self-approve
- Hiding menu tidak dianggap sebagai security control

## Row Level Security

Review:

- RLS aktif pada seluruh exposed business table
- Policy Anonymous, Employee, Manager, dan Admin benar
- Direct balance mutation ditolak
- Direct ledger mutation ditolak
- Direct audit mutation ditolak
- Storage policy aktif
- Policy tidak recursive tanpa sengaja
- Helper function menggunakan safe `search_path`
- `security definer` hanya dipakai jika perlu
- Policy tidak mempercayai editable `user_metadata`

## Input Validation

Review:

- Semua Server Action memakai Zod
- Query parameter dan UUID divalidasi
- Sorting column menggunakan allowlist
- Pagination limit dibatasi
- File MIME dan size divalidasi
- Redirect URL divalidasi
- RPC parameter tidak dibangun melalui string SQL

## OWASP Risks

### Broken Access Control

- IDOR pada employee detail, request, balance, dan attachment
- Direct URL ke Admin page
- Manager mengakses non-direct report
- Employee mengakses audit log
- Role escalation melalui payload

### Injection

- Tidak ada raw SQL dengan interpolation
- Tidak ada dynamic SQL dari user input
- Sorting/filter column di-allowlist
- Tidak ada unsafe HTML rendering

### Security Misconfiguration

- Public sign-up masih aktif
- Storage bucket public
- RLS disabled
- Service key digunakan untuk normal query
- Stack trace tampil
- Development credential aktif di deployment

### Authentication Failures

- Session stale setelah deactivation
- Auth user tanpa employee profile
- Login error terlalu detail
- Account enumeration

### Logging Failures

- Approval, balance adjustment, attachment, dan employee change tidak tercatat
- Error tidak memiliki reference ID
- Audit metadata mengandung sensitive data

---

# 3. Performance Review

## Rendering Performance

Review:

- Unnecessary re-render
- Client Component terlalu besar
- Seluruh page memakai `"use client"`
- Expensive calculation saat render
- FullCalendar rerender berlebihan
- Skeleton tidak sesuai layout final

## Server Component Usage

Review:

- Server Components digunakan secara default
- Client Component hanya untuk interaksi
- Data awal tidak di-fetch ulang di `useEffect`
- Tidak ada client-side waterfall
- Data besar tidak diserialisasi tanpa kebutuhan

## Supabase Query Performance

Review:

- Tidak ada duplicate query
- Tidak ada N+1 query
- Hindari `select("*")`
- Hanya field diperlukan yang diambil
- Explicit relationship digunakan
- Filter dan pagination dilakukan di database
- Index tersedia
- Calendar query dibatasi visible range
- Dashboard memakai aggregate query/RPC
- Notification dan audit dipaginasi

## Loading State

### List Skeleton

Pastikan tersedia pada:

- Employee list
- Leave request list
- Approval list
- Notification list
- Audit list

Skeleton harus menyerupai final layout dan tidak menyebabkan layout shift besar.

### Button Loading

Review:

- Submit disabled saat processing
- Spinner atau loading text tampil
- Double submit dicegah
- Approve, Reject, Cancel, Upload, dan Quick Create memiliki loading state yang benar
- Button kembali normal setelah error

## Network

Review:

- Tidak ada duplicate API call
- Search memakai debounce
- Filter tidak memicu request berlebihan
- Calendar tidak fetch satu tahun penuh
- Attachment tidak di-load sebelum dibutuhkan
- Signed URL tidak dibuat massal

## Memory

Review:

- Realtime subscription di-unsubscribe
- Event listener dan timer dibersihkan
- Tidak ada repeated Supabase client instance
- Tidak ada memory leak pada calendar

---

# 4. Architecture Review

## Expected Layering

```text
Page / Server Component
↓
Server Action or Server Query
↓
Domain Service
↓
Supabase Server Client or RPC
↓
Supabase Postgres
```

Review:

- UI terpisah dari business logic
- Permission logic terpusat
- Validation schema terpisah
- Client Component tidak mengakses admin client
- Page tidak berisi SQL/business logic
- Supabase query tidak tersebar tanpa pola
- RPC menangani mutation transactional
- Tidak ada circular dependency
- Tidak ada mega-service atau dumping-ground utility

## Route Structure

Review:

- Route sesuai App Router
- Loading/error/not-found tersedia
- Placeholder route tidak tersisa
- Quick Create mengarah ke route benar
- All Requests route tersedia
- Navigation sesuai role
- Auth route tidak duplikatif

## Supabase Client Architecture

- Browser client terpisah
- Server client terpisah
- Admin client terpisah
- Admin client memakai `server-only`
- Tidak ada duplicate client factory
- Cookie handling sesuai SSR pattern

---

# 5. Maintainability Review

## Naming

Review:

- Component, function, action, RPC, schema, dan type memiliki nama jelas
- File naming konsisten
- Tidak ada nama generik seperti `data`, `stuff`, `handler2`, atau `temp`

## Duplication

Review:

- Duplicate role check
- Duplicate Supabase query
- Duplicate status mapping
- Duplicate date formatting
- Duplicate form schema
- Duplicate skeleton
- Duplicate BNI color hardcode

## Dead Code

Review:

- Old auth pages `v1/` dan `v2/`
- Unused template pages
- Demo dashboard code
- Old branding `Studio Admin`
- Placeholder route
- Unused BNI logo variant

## Technical Debt

Review:

- Deferred RPC integration test
- Deferred concurrency test
- Deferred Storage policy test
- Manual public sign-up verification
- Missing Playwright
- Temporary workaround

Setiap debt harus memiliki owner, severity, dan target resolution.

---

# 6. Type Safety Review

Hindari:

```typescript
any
as any
@ts-ignore
```

Gunakan:

```typescript
unknown
Employee
LeaveRequest
LeaveBalance
ActionResult<T>
Database
```

Review:

- `database.types.ts` terbaru
- Generated types tidak diedit manual
- RPC return type benar
- Enum konsisten
- Nullability sesuai schema
- Tidak menggunakan non-null assertion tanpa validasi

---

# 7. Error Handling Review

Gunakan kategori:

```text
VALIDATION_ERROR
UNAUTHENTICATED
FORBIDDEN
NOT_FOUND
CONFLICT
BUSINESS_RULE_ERROR
INTERNAL_ERROR
```

Review:

- Error tidak ditelan
- Raw Supabase/Postgres error tidak tampil
- Stack trace tidak tampil
- Error memiliki reference ID
- Empty state berbeda dengan error state
- Mutation failure mempertahankan input
- Upload partial failure ditangani

Contoh user feedback:

```text
Failed to load employees.
Please try again or contact the administrator with reference ID ABC123.
```

---

# 8. Validation Review

## Employee

- Employee code required dan unique
- Full name minimum length
- Valid dan unique email
- Department dan position required
- Manager tidak boleh self
- Role dan status allowlist

## Leave Request

- Leave type required
- Valid date range
- Requested days > 0
- Overlap check
- Balance check
- Active employee dan leave type
- Attachment required jika configured
- Reason length valid

## Balance

- Year valid
- Adjustment tidak zero
- Reason required
- Numeric limit
- Negative policy

## Approval

- Pending only
- Correct manager scope
- No self-approval
- Rejection reason required
- Balance dan overlap divalidasi ulang

## File

- MIME allowlist
- File size
- Private bucket
- Ownership
- Pending status
- Safe filename dan path

---

# 9. UI/UX Review

## BNI Brutalist Theme

Review:

- Branding BNI konsisten
- Tidak ada “Studio Admin”
- Logo BNI konsisten
- Login page dan app shell memakai BNI branding
- Warna mengikuti BNI theme
- Brutalist style tidak mengorbankan usability
- Border, typography, radius, dan spacing konsisten
- Screenshot hanya digunakan sebagai color direction

## Navigation

Review:

- Quick Create menuju `/leave/requests/new`
- All Requests route tersedia
- Employee route tersedia
- Active navigation benar
- Icon email memiliki fungsi jelas
- Jika icon adalah notification, gunakan icon dan tooltip yang tepat
- Icon dekoratif tanpa fungsi harus dihapus

## Tables and Lists

- Filter, sorting, pagination benar
- Skeleton, empty state, error state tersedia
- Mobile strategy tersedia
- Action menu jelas
- Tidak ada layout shift

## Forms

- Label jelas
- Error message jelas
- Submit loading
- Button disabled
- Success feedback
- Date picker usable
- Mobile layout baik

---

# 10. Accessibility Review

Review:

- Semantic HTML
- Keyboard navigation
- Semua input memiliki label
- Icon-only button memiliki `aria-label`
- Status tidak bergantung warna saja
- BNI color contrast cukup
- Dialog mengelola focus
- Calendar event keyboard accessible
- Skeleton tidak dibaca sebagai data

---

# 11. Dependency Review

Review:

- Dependency benar-benar digunakan
- Tidak ada duplicate library
- Tidak ada second auth framework, ORM, form, table, atau calendar library
- Lockfile konsisten
- Version compatible
- Tidak ada package critical vulnerability

Commands:

```bash
npm audit
npm outdated
```

Review bundle:

- FullCalendar hanya pada calendar route
- Chart library tidak di-import global
- Supabase admin code tidak masuk client bundle
- Unused template module dihapus

---

# 12. Logging and Observability

Boleh log:

- Reference ID
- Operation
- Sanitized employee/entity ID
- Error category
- Duration

Jangan log:

```text
Password
Temporary password
Access token
Refresh token
Supabase secret
Service-role key
OTP
Recovery link
Medical document
Full private leave reason
```

Audit event:

- Employee created/updated/deactivated
- Account created
- Role changed
- Leave created/edited/cancelled
- Leave approved/rejected
- Balance adjusted
- Attachment uploaded/removed
- Configuration changed

---

# 13. AI-Generated Code Review

## Hallucination

Review:

- Supabase function yang tidak ada
- shadcn component yang tidak ada
- Next.js API salah versi
- FullCalendar option tidak valid
- RPC dipanggil tetapi migration tidak ada
- Relationship name salah
- Route/import/script tidak ada

## Fake Security

Review:

- Role check hanya di client
- RLS disebut ada tetapi migration tidak ada
- Private data di-fetch lalu disembunyikan CSS
- Button disabled dianggap authorization
- Middleware dianggap cukup
- `security definer` tanpa authorization

## Fake Performance

Review:

- Pagination UI tetapi fetch semua data
- Skeleton ada tetapi query tetap lambat
- Cache tanpa user scoping
- `useMemo` sembarangan
- Seluruh page jadi client component

## AI Output Integrity

Review:

- Command diklaim berhasil tanpa output
- Test ditandai pass padahal tidak dijalankan
- Task ditandai selesai terlalu cepat
- Risk ditutup tanpa evidence
- Migration disebut applied padahal belum
- Dashboard setting disebut selesai tanpa manual verification

---

# 14. Database and Supabase Review

## Migration

Review:

- Semua schema change memiliki migration
- Migration dapat dijalankan dari database kosong
- `supabase db reset` lokal berhasil
- Generated types diperbarui
- Seed reproducible dan development-only

## Schema

Review:

- Primary key
- Foreign key
- Unique constraint
- Check constraint
- Index
- Timestamps
- Delete behavior
- Numeric precision

## RPC

Review:

- `initialize_employee_balances`
- `adjust_leave_balance`
- `create_leave_request`
- `update_pending_leave_request`
- `cancel_leave_request`
- `approve_leave_request`
- `reject_leave_request`

Pastikan:

- `auth.uid()` digunakan
- Actor scope divalidasi
- `FOR UPDATE` digunakan untuk race-sensitive row
- Safe `search_path`
- Return minimal data
- Transactional
- Audit dan ledger konsisten

## Storage

Review:

- Bucket private
- Path aman
- Policy owner, manager, dan admin
- MIME dan size limit
- Signed URL expiry
- Orphan cleanup
- Calendar tidak expose attachment

---

# 15. Test Review

## Unit Tests

- Leave day calculation
- Weekend dan holiday exclusion
- Half-day
- Overlap
- Permission helper
- Status transition
- Balance formula
- Error mapping

## Database/RPC Tests

- RPC berjalan pada DB nyata/lokal
- Request, balance, ledger, notification, dan audit diverifikasi bersama
- Unauthorized actor ditolak
- Duplicate decision ditolak
- Concurrent operation diuji
- `FOR UPDATE` efektif

## RLS Tests

Review role:

- Anonymous
- Employee
- Manager
- Admin

Review resource:

- Employee
- Balance
- Request
- Approval
- Calendar
- Notification
- Audit
- Storage

## E2E Critical Flow

```text
Admin login
→ Create employee + Auth account
→ Employee change password
→ Employee create leave request
→ Manager approve
→ Balance updates
→ Notification appears
→ Audit log created
→ Calendar shows approved leave
→ Unrelated employee cannot view private reason or attachment
```

---

# 16. Deployment Review

## Vercel Environment Variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
NEXT_PUBLIC_APP_URL
```

Review:

- Secret tidak public
- Production/Preview scope benar
- Redeploy setelah env berubah
- Build berhasil

## Supabase Auth URLs

Review:

- Site URL benar
- Localhost callback terdaftar
- Vercel callback terdaftar
- Change-password URL terdaftar
- Wildcard tidak terlalu luas
- Public sign-up disabled

## Migration Deployment

Review:

```bash
supabase migration list
supabase db push
```

Pastikan:

- Backup tersedia
- Tidak menggunakan `db reset` pada remote
- Initial Admin dibuat aman
- Smoke test dilakukan

---

# Severity Classification

## Critical

Dampak:

- Data breach
- Authentication bypass
- Service-role key exposed
- RLS bypass
- Data corruption
- Unauthorized approval
- Private attachment exposure

Action:

```text
Release Blocker
```

## High

Dampak:

- Main workflow gagal
- Employee list tidak dapat dimuat
- Approval gagal
- Balance salah
- Route utama tidak ada
- Major performance issue

Action:

```text
Fix Before Deployment
```

## Medium

Dampak:

- Maintainability issue
- Minor performance issue
- Missing loading/skeleton
- Incomplete error handling
- Accessibility issue

Action:

```text
Fix During Sprint
```

## Low

Dampak:

- Naming issue
- Cosmetic inconsistency
- Minor refactor
- Documentation gap

Action:

```text
Backlog
```

---

# Review Report Template

| Area | Status | Severity | Finding | Evidence | Recommendation | Owner | Target |
|---|---|---|---|---|---|---|---|
| Functional Correctness | PASS/FAIL | Critical/High/Medium/Low | Temuan | File/test/log | Rekomendasi | PIC | Date |
| Security | PASS/FAIL | Critical/High/Medium/Low | Temuan | File/test/log | Rekomendasi | PIC | Date |
| Performance | PASS/FAIL | Critical/High/Medium/Low | Temuan | File/test/log | Rekomendasi | PIC | Date |
| Architecture | PASS/FAIL | Critical/High/Medium/Low | Temuan | File/test/log | Rekomendasi | PIC | Date |
| Maintainability | PASS/FAIL | Critical/High/Medium/Low | Temuan | File/test/log | Rekomendasi | PIC | Date |
| Type Safety | PASS/FAIL | Critical/High/Medium/Low | Temuan | File/test/log | Rekomendasi | PIC | Date |
| Error Handling | PASS/FAIL | Critical/High/Medium/Low | Temuan | File/test/log | Rekomendasi | PIC | Date |
| Validation | PASS/FAIL | Critical/High/Medium/Low | Temuan | File/test/log | Rekomendasi | PIC | Date |
| UI/UX | PASS/FAIL | Critical/High/Medium/Low | Temuan | Screenshot | Rekomendasi | PIC | Date |
| Accessibility | PASS/FAIL | Critical/High/Medium/Low | Temuan | Audit/test | Rekomendasi | PIC | Date |
| Dependency Review | PASS/FAIL | Critical/High/Medium/Low | Temuan | Audit output | Rekomendasi | PIC | Date |
| Logging & Observability | PASS/FAIL | Critical/High/Medium/Low | Temuan | Log config | Rekomendasi | PIC | Date |
| Supabase Database | PASS/FAIL | Critical/High/Medium/Low | Temuan | Migration/RLS | Rekomendasi | PIC | Date |
| Testing | PASS/FAIL | Critical/High/Medium/Low | Temuan | Test result | Rekomendasi | PIC | Date |
| Deployment | PASS/FAIL | Critical/High/Medium/Low | Temuan | Vercel/Supabase | Rekomendasi | PIC | Date |
| AI Generated Code | PASS/FAIL | Critical/High/Medium/Low | Temuan | Source diff | Rekomendasi | PIC | Date |

---

# Detailed Finding Template

## Finding ID

```text
LRM-CR-001
```

## Title

```text
Employee list query uses ambiguous Supabase relationship
```

## Area

```text
Functional Correctness / Performance
```

## Severity

```text
High
```

## Description

Jelaskan masalah secara spesifik.

## Evidence

```text
File:
src/...

Function:
...

Error:
Could not embed because more than one relationship was found...
```

## Impact

Jelaskan dampak terhadap user, data, atau deployment.

## Root Cause

Jelaskan penyebab teknis.

## Recommendation

Jelaskan solusi spesifik.

## Acceptance Criteria

```text
- Employee list loads successfully
- Department relationship is explicit
- No duplicate query
- Pagination still works
- Test added
```

## Status

```text
OPEN
IN PROGRESS
RESOLVED
ACCEPTED RISK
```

---

# Final Recommendation

Pilih salah satu:

- APPROVED
- APPROVED WITH MINOR CHANGES
- REQUEST CHANGES
- REJECTED

## Decision Rules

### APPROVED

- Tidak ada Critical
- Tidak ada High
- Mandatory test lulus
- Build lulus
- RLS dan Auth verified

### APPROVED WITH MINOR CHANGES

- Tidak ada Critical
- Tidak ada High
- Hanya Medium/Low non-blocking

### REQUEST CHANGES

- Ada High
- Main flow belum stabil
- Test penting belum lulus
- RLS belum lengkap

### REJECTED

- Ada Critical
- Data exposure
- Auth bypass
- Service-role leak
- Data corruption

---

# Reviewer Information

| Field | Value |
|---|---|
| Reviewer | |
| Review Date | |
| Application | Leave Request Management System |
| Version | |
| Repository | Training-VibeCode/employee-leave-system |
| Branch | |
| Commit | |
| Environment | Local / Preview / Vercel |
| Supabase Project | |

---

# Summary

## Total Findings

| Severity | Count |
|---|---:|
| Critical | |
| High | |
| Medium | |
| Low | |

## Deferred Risks

| Risk | Status | Owner | Target |
|---|---|---|---|
| DB-level RPC integration tests | | | |
| Concurrent race-condition testing | | | |
| Supabase public sign-up verification | | | |
| Storage policy integration tests | | | |
| Playwright E2E | | | |

## Conclusion

Tuliskan ringkasan hasil review, risiko utama, dan keputusan akhir.

---

# Suggested Review Execution Order

```text
1. Read PRD, Project Rules, Implementation Plan, and task.md
2. Inspect repository structure
3. Run lint and typecheck
4. Run unit tests
5. Run Supabase local migrations
6. Run RLS/RPC tests
7. Run Storage policy tests
8. Run Playwright E2E
9. Review Auth and authorization
10. Review data integrity and balance logic
11. Review performance
12. Review UI/UX and accessibility
13. Review deployment configuration
14. Produce findings
15. Classify severity
16. Give final recommendation
```

---

# Antigravity Code Review Prompt

```text
Read these files completely:

- leave-request-management-prd-supabase.md
- leave-request-management-project-rules-supabase.md
- implementation-plan-supabase.md
- task.md
- comprehensive-code-review-checklist-leave-management.md

Perform a comprehensive code review of the current repository.

Do not modify code yet.

Review:
1. Functional correctness
2. Security and Supabase RLS
3. Performance
4. Architecture
5. Maintainability
6. Type safety
7. Error handling
8. Validation
9. UI/UX
10. Accessibility
11. Dependencies
12. Logging and observability
13. Supabase schema, RPC, and Storage
14. Tests
15. Deployment readiness
16. AI-generated code risks

Requirements:
- Inspect the actual repository.
- Run available verification commands.
- Do not invent command results.
- Cite exact files, functions, migrations, policies, and routes.
- Classify each finding as Critical, High, Medium, or Low.
- Separate confirmed findings from assumptions.
- Do not fix anything yet.
- Produce the review report using the template in this document.
- Give one final recommendation:
  APPROVED
  APPROVED WITH MINOR CHANGES
  REQUEST CHANGES
  REJECTED
```
