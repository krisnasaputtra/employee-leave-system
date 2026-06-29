# 📋 Production Smoke-Test Checklist — Manual Testing

> Run through this checklist after every production deployment to verify critical functionality.
> Centang `[x]` setelah setiap item berhasil diverifikasi.

## 🔐 Akun Test

| Role | Email | Password |
|------|-------|----------|
| 🔴 Admin | `admin@company.com` | `Admin123!` |
| 🟡 Manager | `manager@test.com` | `Test12345!` |
| 🟢 Employee | `employee@test.com` | `Test12345!` |

## Prerequisites

- [ ] Supabase project accessible & running
- [ ] Aplikasi sudah deploy dan bisa diakses
- [ ] Minimal 1 akun ADMIN, 1 MANAGER, 1 EMPLOYEE tersedia
- [ ] Public sign-up disabled (Supabase Dashboard → Authentication → Settings)
- [ ] SQL migrations terbaru sudah di-apply

---

## 1. Authentication & Session

### 1.1 Login
- [ ] Halaman login tampil (`/login`) — ada form email & password
- [ ] Admin login berhasil → redirect ke `/dashboard`
- [ ] Manager login berhasil → redirect ke `/dashboard`
- [ ] Employee login berhasil → redirect ke `/dashboard`
- [ ] Invalid credentials → tampil error message (bukan raw error)
- [ ] Email kosong → validasi error
- [ ] Password kosong → validasi error

### 1.2 Session & Security
- [ ] Session persist setelah page refresh
- [ ] Akses `/dashboard` tanpa login → redirect ke `/login`
- [ ] Akses `/dashboard/employees` tanpa login → redirect ke `/login`
- [ ] Logout → clear session & redirect ke `/login`

### 1.3 Switch Account (Cache Clear)
- [ ] Login sebagai Employee1 → lihat data Employee1 di halaman Cuti
- [ ] Logout → Login sebagai Manager → halaman Cuti tampil data Manager (BUKAN Employee1)
- [ ] Tidak ada data stale dari user sebelumnya

---

## 2. Dashboard

### 2.1 Employee Dashboard
- [ ] Dashboard load → tampil metric cards (sisa cuti, pending, terpakai)
- [ ] Data sesuai dengan balance employee yang login
- [ ] Quick action "Ajukan Cuti" berfungsi

### 2.2 Manager Dashboard
- [ ] Dashboard load → tampil team metrics + pending approvals count
- [ ] Jumlah pending approvals sesuai dengan yang ada di halaman Approvals

### 2.3 Admin Dashboard
- [ ] Dashboard load → tampil organization-wide metrics
- [ ] Chart/grafik tampil dengan benar

---

## 3. Employee Management (Admin Only)

### 3.1 CRUD Employee
- [ ] Admin bisa akses `/dashboard/employees` → tampil tabel employee
- [ ] Tabel punya search — cari nama employee berfungsi
- [ ] Tabel punya filter status (Active/Inactive)
- [ ] Pagination berfungsi (jika data > 10)
- [ ] Admin bisa create employee TANPA akun login
- [ ] Admin bisa create employee DENGAN akun login (temp password)
- [ ] Form create: field Team tampil **nama team** (bukan UUID)
- [ ] Form create: field Manager tampil **nama manager** (bukan UUID)
- [ ] Admin bisa edit employee → form pre-filled dengan data existing
- [ ] Form edit: Team & Manager tampil nama (bukan UUID)
- [ ] Admin bisa deactivate employee
- [ ] Admin bisa activate employee kembali

### 3.2 Employee Detail
- [ ] Klik nama employee → detail page load
- [ ] Detail menampilkan: info personal, team, position, status
- [ ] Tab/section leave balance tampil (jika ada)

### 3.3 Access Control
- [ ] Employee TIDAK bisa akses `/dashboard/employees` → redirect
- [ ] Manager TIDAK bisa akses `/dashboard/employees` → redirect

---

## 4. Team Page

### 4.1 Sebagai Manager
- [ ] `/dashboard/team` load → tampil tabel anggota tim
- [ ] Tampil nama, posisi, status, team
- [ ] Tampil kolom leave balance (entitled, used, remaining)
- [ ] Badge "On Leave" tampil untuk yang sedang cuti hari ini
- [ ] Badge "Pending" tampil jika ada request pending
- [ ] Tombol "View" → navigasi ke detail employee
- [ ] Tombol "Approve" → navigasi ke approvals page

### 4.2 Sebagai Employee
- [ ] `/dashboard/team` load → tampil rekan satu tim
- [ ] Tampil nama & posisi colleagues
- [ ] TIDAK tampil kolom leave balance (privacy)
- [ ] TIDAK tampil tombol View/Approve

---

## 5. Leave Balances

### 5.1 My Leave Balance (Employee)
- [ ] `/dashboard/leave/balances` load → tampil saldo cuti
- [ ] Tampil: entitled days, used days, pending days, remaining days
- [ ] Data sesuai per jenis cuti

### 5.2 Manage Balances (Admin)
- [ ] `/dashboard/leave/balances/manage` load → tampil tabel semua employee
- [ ] Search by name/employee code berfungsi
- [ ] Filter by team/department berfungsi
- [ ] Pagination berfungsi
- [ ] Warna badge remaining: hijau (cukup), kuning (sedikit), merah (habis)
- [ ] Admin bisa initialize balance untuk employee
- [ ] Admin bisa adjust balance (tambah/kurang hari)
- [ ] Ledger entry tercatat setelah adjustment

---

## 6. Leave Requests (Employee)

### 6.1 Create Leave Request
- [ ] `/dashboard/leave/requests/new` load → form tampil
- [ ] Form ada: leave type (combobox), tanggal mulai, tanggal selesai, alasan
- [ ] Pilih leave type → tampil sisa balance
- [ ] Weekend otomatis di-exclude dari perhitungan hari
- [ ] Holiday otomatis di-exclude dari perhitungan hari
- [ ] Half-day option berfungsi
- [ ] Submit berhasil → redirect ke list requests dengan data baru
- [ ] Request baru berstatus PENDING
- [ ] Pending days bertambah di balance
- [ ] Toast success notification tampil

### 6.2 Validasi
- [ ] Tanggal overlapping dengan request lain → ditolak
- [ ] Saldo tidak cukup → ditolak
- [ ] Tanggal mulai > tanggal selesai → ditolak
- [ ] Form kosong → validasi error tampil

### 6.3 Edit & Cancel
- [ ] Employee bisa edit request PENDING
- [ ] Employee bisa cancel request PENDING
- [ ] Cancel → pending days dikembalikan ke balance
- [ ] Employee TIDAK bisa edit request APPROVED/REJECTED

### 6.4 My Requests List
- [ ] `/dashboard/leave/requests` → tabel list request
- [ ] Tampil: nomor request, jenis cuti, tanggal, status, hari
- [ ] Pagination berfungsi

### 6.5 All Requests (Admin)
- [ ] `/dashboard/leave/all` → tabel semua request dari semua employee
- [ ] Search by nama employee berfungsi
- [ ] Filter by status berfungsi

---

## 7. Approval Workflow

### 7.1 Sebagai Manager
- [ ] `/dashboard/approvals` load → tampil pending requests dari tim
- [ ] Hanya tampil request dari direct reports (tim sendiri)
- [ ] TIDAK tampil request sendiri (self-approval prevention)
- [ ] Bisa approve request → status berubah ke APPROVED
- [ ] Approve: pending days → used days, notification ke employee
- [ ] Bisa reject request dengan alasan → status berubah ke REJECTED
- [ ] Reject: pending days dilepas, notification ke employee
- [ ] Bulk approve berfungsi (select multiple → approve semua)
- [ ] Bulk reject berfungsi

### 7.2 Sebagai Admin
- [ ] `/dashboard/approvals` load → tampil SEMUA pending requests
- [ ] Bisa approve/reject semua request

### 7.3 Sebagai Employee (dengan Delegation)
- [ ] `/dashboard/approvals` accessible (tidak redirect)
- [ ] Jika ada delegation aktif → tampil request yang didelegasikan
- [ ] Jika tidak ada delegation → tampil empty state
- [ ] Bisa approve/reject request yang didelegasikan

### 7.4 Approval Badge di Sidebar
- [ ] Badge merah muncul di menu "Approvals" dengan jumlah pending
- [ ] Jumlah termasuk request dari delegation (jika ada)
- [ ] Badge otomatis update setelah approve/reject
- [ ] Badge hilang jika tidak ada pending

---

## 8. Delegation

### 8.1 Sebagai Manager
- [ ] `/dashboard/delegations` load → form delegasi tampil
- [ ] Dropdown delegate hanya menampilkan anggota tim sendiri
- [ ] Bisa create delegation baru (pilih delegate + tanggal)
- [ ] Delegation tampil di daftar delegasi aktif
- [ ] Bisa deactivate delegation

### 8.2 Sebagai Employee
- [ ] `/dashboard/delegations` accessible
- [ ] Bisa melihat delegation yang diterima
- [ ] TIDAK bisa membuat delegation sendiri (hanya manager/admin)

### 8.3 Cross-department
- [ ] Manager TIDAK bisa delegate ke anggota tim lain
- [ ] Admin BISA delegate cross-department (exception)

---

## 9. Calendar

- [ ] `/dashboard/calendar` load → kalender tampil
- [ ] Hanya menampilkan APPROVED leave (bukan pending/rejected/cancelled)
- [ ] Holiday tampil di kalender
- [ ] Filter by department berfungsi
- [ ] Filter by leave type berfungsi
- [ ] Klik event → detail popup tampil

---

## 10. Settings (Admin Only)

### 10.1 Teams/Departments
- [ ] `/dashboard/settings/departments` load → tabel teams
- [ ] Admin bisa create team baru
- [ ] Admin bisa edit team
- [ ] Admin bisa toggle active/inactive team

### 10.2 Leave Types
- [ ] `/dashboard/settings/leave-types` load → daftar jenis cuti
- [ ] Admin bisa create leave type baru
- [ ] Admin bisa edit leave type
- [ ] Admin bisa toggle active/inactive

### 10.3 Holidays
- [ ] `/dashboard/settings/holidays` load → daftar hari libur
- [ ] Admin bisa create holiday baru
- [ ] Admin bisa edit holiday
- [ ] Admin bisa toggle active/inactive

### 10.4 Access Control
- [ ] Employee TIDAK bisa akses settings → redirect
- [ ] Manager TIDAK bisa akses settings → redirect

---

## 11. Notifications

- [ ] Bell icon di header tampil jumlah unread
- [ ] `/dashboard/notifications` load → daftar notifikasi
- [ ] Notifikasi tampil: judul, pesan, timestamp
- [ ] Klik notifikasi → mark as read
- [ ] "Mark All Read" berfungsi
- [ ] Notifikasi muncul setelah: submit request, approve, reject, cancel

---

## 12. Audit Logs (Admin Only)

- [ ] `/dashboard/audit-logs` load → tabel log
- [ ] Tampil: action, user, timestamp, detail
- [ ] Log tercatat untuk: create request, approve, reject, cancel, employee CRUD
- [ ] Employee/Manager TIDAK bisa akses audit logs

---

## 13. Analytics & Reports (Admin/Manager)

- [ ] `/dashboard/analytics-reports` load → chart/grafik tampil
- [ ] Chart menampilkan data yang relevan
- [ ] Export functionality berfungsi (jika ada)

---

## 14. Profile

- [ ] `/dashboard/profile` load → info profil tampil
- [ ] Tampil: nama, email, posisi, team
- [ ] Employee bisa edit profil sendiri
- [ ] Perubahan tersimpan setelah submit

---

## 15. i18n (Multi-Language)

### 15.1 Language Switch
- [ ] Language switcher (Globe icon) tampil di header
- [ ] Switch ke Bahasa Indonesia → UI berubah ke ID
- [ ] Switch ke English → UI berubah ke EN
- [ ] Preferensi bahasa persist setelah refresh

### 15.2 Coverage Bahasa Indonesia
- [ ] Sidebar navigation dalam Bahasa Indonesia
- [ ] Dashboard labels dalam Bahasa Indonesia
- [ ] Form labels dalam Bahasa Indonesia
- [ ] Button text dalam Bahasa Indonesia
- [ ] Error messages dalam Bahasa Indonesia

---

## 16. Theme & Layout

- [ ] Theme switcher berfungsi (Brutalist/Soft Pop/Tangerine)
- [ ] Dark mode toggle berfungsi
- [ ] Layout responsive di mobile (sidebar collapse)
- [ ] Sidebar variant options berfungsi

---

## 17. Export CSV

- [ ] Export employee list ke CSV (Admin)
- [ ] Export leave requests ke CSV
- [ ] Export audit logs ke CSV (Admin)
- [ ] File CSV berisi data yang benar

---

## 18. Security

- [ ] Tidak ada raw Supabase/Postgres error di UI
- [ ] Service role key TIDAK muncul di browser Network tab
- [ ] Tidak bisa akses dashboard tanpa authentication
- [ ] Tidak bisa manipulasi URL untuk akses data user lain
- [ ] Rate limiting aktif pada endpoint login (coba login salah 10x berturut)
- [ ] Security headers aktif (CSP, X-Frame-Options, dll)

---

## 19. Performance

- [ ] Login → dashboard load < 3 detik
- [ ] Navigasi antar halaman < 2 detik
- [ ] Search/filter response < 1 detik
- [ ] Tidak ada loading spinner stuck (infinite loading)
- [ ] Skeleton loading tampil saat halaman loading

---

## ❌ Failure Handling

Jika ada test yang gagal:
1. **Screenshot** halaman yang bermasalah
2. **Catat** error message yang muncul
3. **Cek** Supabase logs (Dashboard → Logs → Edge Functions / Auth)
4. **Cek** browser console untuk JavaScript errors
5. **Verifikasi** RLS policies aktif (Supabase → Database → Tables → RLS)
6. **JANGAN** disable RLS untuk fix issues
7. Buat hotfix migration jika diperlukan
8. Re-run smoke test setelah fix

---

## ✅ Sign-off

| Item | Value |
|------|-------|
| **Tanggal Test** | ______________ |
| **Tester** | ______________ |
| **Environment** | ☐ Local / ☐ Staging / ☐ Production |
| **URL** | ______________ |
| **Total Pass** | ______ / 150+ |
| **Total Fail** | ______ |
| **Status** | ☐ PASS / ☐ FAIL |
| **Catatan** | ______________ |
