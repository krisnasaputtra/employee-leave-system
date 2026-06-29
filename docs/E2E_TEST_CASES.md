# 🧪 E2E Test Cases — Detail Manual Testing

> Dokumen ini berisi test case detail untuk testing end-to-end secara manual.
> Setiap test case memiliki **precondition**, **steps**, dan **expected result** yang jelas.

---

## TC-AUTH: Authentication

### TC-AUTH-01: Login Admin Berhasil
| Item | Detail |
|------|--------|
| **Precondition** | Akun admin@company.com sudah ada, browser fresh (no cookies) |
| **Steps** | 1. Buka `/login`<br>2. Isi email: `admin@company.com`<br>3. Isi password: `Admin123!`<br>4. Klik "Sign In" |
| **Expected** | Redirect ke `/dashboard`, sidebar tampil dengan menu lengkap (Employees, Settings, Audit Logs) |

### TC-AUTH-02: Login Employee Berhasil
| Item | Detail |
|------|--------|
| **Precondition** | Akun employee@test.com sudah ada |
| **Steps** | 1. Buka `/login`<br>2. Isi email: `employee@test.com`<br>3. Isi password: `Test12345!`<br>4. Klik "Sign In" |
| **Expected** | Redirect ke `/dashboard`, sidebar TIDAK tampil menu Employees/Settings/Audit Logs |

### TC-AUTH-03: Login Manager Berhasil
| Item | Detail |
|------|--------|
| **Precondition** | Akun manager@test.com sudah ada |
| **Steps** | 1. Buka `/login`<br>2. Isi email: `manager@test.com`<br>3. Isi password: `Test12345!`<br>4. Klik "Sign In" |
| **Expected** | Redirect ke `/dashboard`, sidebar tampil menu Approvals & Team |

### TC-AUTH-04: Login Gagal — Credentials Salah
| Item | Detail |
|------|--------|
| **Precondition** | — |
| **Steps** | 1. Buka `/login`<br>2. Isi email: `wrong@email.com`<br>3. Isi password: `wrongpass`<br>4. Klik "Sign In" |
| **Expected** | Tetap di halaman login, tampil pesan error "Invalid email or password", BUKAN raw error |

### TC-AUTH-05: Logout & Cache Clear
| Item | Detail |
|------|--------|
| **Precondition** | Sudah login sebagai Employee |
| **Steps** | 1. Klik avatar di sidebar bawah<br>2. Klik "Log out"<br>3. Login sebagai Manager<br>4. Buka `/dashboard/leave/requests` |
| **Expected** | Data yang tampil adalah milik Manager, BUKAN Employee sebelumnya |

### TC-AUTH-06: Unauthenticated Access
| Item | Detail |
|------|--------|
| **Precondition** | Tidak ada session (cookies cleared) |
| **Steps** | 1. Buka langsung `/dashboard` |
| **Expected** | Redirect ke `/login` |

---

## TC-EMP: Employee Management

### TC-EMP-01: Create Employee Tanpa Login
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Admin, di halaman `/dashboard/employees` |
| **Steps** | 1. Klik "Add Employee"<br>2. Isi form: nama, email, employee code, team, posisi<br>3. JANGAN centang "Create login account"<br>4. Klik "Create" |
| **Expected** | Employee baru muncul di tabel, status ACTIVE, team tampil nama (bukan UUID) |

### TC-EMP-02: Create Employee Dengan Login
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Admin |
| **Steps** | 1. Klik "Add Employee"<br>2. Isi form lengkap<br>3. Centang "Create login account"<br>4. Set temporary password<br>5. Klik "Create" |
| **Expected** | Employee baru muncul di tabel dengan flag `must_change_password` |

### TC-EMP-03: Edit Employee — Team & Manager Display
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Admin, ada employee yang sudah ada |
| **Steps** | 1. Klik employee di tabel → klik Edit<br>2. Lihat field Team (Combobox)<br>3. Lihat field Manager (Combobox) |
| **Expected** | Team menampilkan **nama team** (bukan UUID). Manager menampilkan **nama manager** (bukan UUID) |

### TC-EMP-04: Search Employee
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Admin, ada beberapa employees |
| **Steps** | 1. Buka `/dashboard/employees`<br>2. Ketik nama employee di search box<br>3. Tunggu 300ms (debounce) |
| **Expected** | Tabel ter-filter tanpa page reload, hanya tampil employee yang cocok |

---

## TC-LEAVE: Leave Request

### TC-LEAVE-01: Create Leave Request
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Employee, punya saldo cuti tersisa |
| **Steps** | 1. Buka `/dashboard/leave/requests/new`<br>2. Pilih leave type dari combobox<br>3. Set tanggal mulai (hari kerja di masa depan)<br>4. Set tanggal selesai<br>5. Isi alasan<br>6. Klik Submit |
| **Expected** | Toast "Leave request LR-xxx created", redirect ke `/dashboard/leave/requests`, request baru tampil di list dengan status PENDING |

### TC-LEAVE-02: Leave Request Refresh Setelah Create
| Item | Detail |
|------|--------|
| **Precondition** | Baru saja submit leave request (TC-LEAVE-01) |
| **Steps** | 1. Perhatikan halaman list requests setelah redirect |
| **Expected** | Request baru LANGSUNG tampil di list tanpa perlu manual refresh browser |

### TC-LEAVE-03: Validasi Tanggal Overlap
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Employee, sudah ada request PENDING/APPROVED di tanggal tertentu |
| **Steps** | 1. Buat leave request baru dengan tanggal yang overlap |
| **Expected** | Error "overlapping" ditampilkan, request TIDAK dibuat |

### TC-LEAVE-04: Validasi Saldo Tidak Cukup
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Employee, saldo cuti hampir habis |
| **Steps** | 1. Buat leave request dengan hari lebih banyak dari sisa saldo |
| **Expected** | Error "insufficient balance" ditampilkan, request TIDAK dibuat |

### TC-LEAVE-05: Cancel Pending Request
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Employee, ada request PENDING |
| **Steps** | 1. Buka list requests<br>2. Klik detail request PENDING<br>3. Klik Cancel |
| **Expected** | Status berubah ke CANCELLED, pending days dikembalikan ke balance |

### TC-LEAVE-06: Request Number Unik
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Employee |
| **Steps** | 1. Submit leave request<br>2. Catat request number (LR-xxx)<br>3. Submit leave request lagi |
| **Expected** | Dua request punya nomor berbeda, TIDAK ada error "duplicate key" |

---

## TC-APPR: Approval Workflow

### TC-APPR-01: Manager Approve Request
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Manager, ada pending request dari anggota tim |
| **Steps** | 1. Buka `/dashboard/approvals`<br>2. Lihat pending requests<br>3. Klik "Approve" pada salah satu request |
| **Expected** | Status → APPROVED, pending days → used days, notifikasi ke employee |

### TC-APPR-02: Manager Reject Request
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Manager, ada pending request |
| **Steps** | 1. Buka `/dashboard/approvals`<br>2. Klik "Reject" pada request<br>3. Isi alasan rejection |
| **Expected** | Status → REJECTED, pending days dilepas, notifikasi ke employee |

### TC-APPR-03: Approval Badge
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Manager, ada pending requests |
| **Steps** | 1. Lihat sidebar menu "Approvals" |
| **Expected** | Badge merah dengan angka muncul di samping menu Approvals |

### TC-APPR-04: Self-Approval Prevention
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Manager |
| **Steps** | 1. Submit leave request sendiri<br>2. Buka halaman Approvals |
| **Expected** | Request sendiri TIDAK tampil di daftar pending approvals |

### TC-APPR-05: Employee Delegated Approval
| Item | Detail |
|------|--------|
| **Precondition** | Manager sudah delegate ke Employee, ada pending request dari tim Manager |
| **Steps** | 1. Login sebagai Employee yang didelegasi<br>2. Buka `/dashboard/approvals` |
| **Expected** | Halaman Approvals accessible, tampil request yang didelegasikan |

---

## TC-DELEG: Delegation

### TC-DELEG-01: Create Delegation
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Manager |
| **Steps** | 1. Buka `/dashboard/delegations`<br>2. Pilih employee delegate (dari tim sendiri)<br>3. Set tanggal mulai & selesai<br>4. Submit |
| **Expected** | Delegation baru tercatat, employee delegate bisa lihat menu Approvals |

### TC-DELEG-02: Cross-Department Restriction
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Manager |
| **Steps** | 1. Buka `/dashboard/delegations`<br>2. Cek dropdown delegate |
| **Expected** | Dropdown HANYA menampilkan anggota tim sendiri, BUKAN anggota tim lain |

### TC-DELEG-03: Employee Lihat Delegation
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Employee |
| **Steps** | 1. Buka `/dashboard/delegations` |
| **Expected** | Halaman accessible, bisa lihat delegation yang diterima |

---

## TC-TEAM: Team Page

### TC-TEAM-01: Manager Lihat Tim
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Manager, ada anggota tim |
| **Steps** | 1. Buka `/dashboard/team` |
| **Expected** | Tabel anggota tim tampil dengan kolom: nama, team, posisi, status, entitled, used, remaining, pending |

### TC-TEAM-02: Employee Lihat Tim
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Employee |
| **Steps** | 1. Buka `/dashboard/team` |
| **Expected** | Tampil daftar rekan satu tim, TANPA kolom balance (privacy), TANPA tombol approve |

### TC-TEAM-03: Team Page Tidak Kosong
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Employee, ada rekan satu tim |
| **Steps** | 1. Buka `/dashboard/team` |
| **Expected** | Halaman TIDAK kosong, tampil setidaknya 1 colleague |

---

## TC-NOTIF: Notifications

### TC-NOTIF-01: Bell Badge Count
| Item | Detail |
|------|--------|
| **Precondition** | Ada notifikasi unread |
| **Steps** | 1. Lihat bell icon di header |
| **Expected** | Badge angka merah tampil di bell icon |

### TC-NOTIF-02: Mark All Read
| Item | Detail |
|------|--------|
| **Precondition** | Ada beberapa notifikasi unread |
| **Steps** | 1. Buka `/dashboard/notifications`<br>2. Klik "Mark All Read" |
| **Expected** | Semua notifikasi ditandai read, badge di bell hilang |

---

## TC-I18N: Multi-Language

### TC-I18N-01: Switch ke Bahasa Indonesia
| Item | Detail |
|------|--------|
| **Precondition** | Login, bahasa default English |
| **Steps** | 1. Klik Globe icon di header<br>2. Pilih "Bahasa Indonesia" |
| **Expected** | Sidebar berubah ke Bahasa Indonesia (Dasbor, Karyawan, Persetujuan, dll) |

### TC-I18N-02: Persist Language
| Item | Detail |
|------|--------|
| **Precondition** | Bahasa sudah diset ke Indonesia |
| **Steps** | 1. Refresh halaman |
| **Expected** | Bahasa tetap Indonesia setelah refresh |

---

## TC-SETTING: Settings

### TC-SETTING-01: CRUD Team/Department
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Admin |
| **Steps** | 1. Buka `/dashboard/settings/departments`<br>2. Klik "Add"<br>3. Isi nama & deskripsi<br>4. Submit |
| **Expected** | Team baru muncul di tabel |

### TC-SETTING-02: Employee Access Control
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Employee |
| **Steps** | 1. Navigasi ke `/dashboard/settings/departments` |
| **Expected** | Redirect ke dashboard atau tampil unauthorized |

---

## TC-PERF: Performance

### TC-PERF-01: Navigation Speed
| Item | Detail |
|------|--------|
| **Precondition** | Login, sudah di dashboard |
| **Steps** | 1. Klik menu sidebar (Employees, Leave, Approvals, etc)<br>2. Ukur waktu loading |
| **Expected** | Skeleton loading tampil < 0.5s, data tampil < 2s |

### TC-PERF-02: Search Responsiveness
| Item | Detail |
|------|--------|
| **Precondition** | Di halaman employee list atau manage balances |
| **Steps** | 1. Ketik di search box<br>2. Tunggu hasil |
| **Expected** | Hasil muncul setelah 300ms debounce, tanpa page reload |

---

## TC-SEC: Security

### TC-SEC-01: No Raw Error
| Item | Detail |
|------|--------|
| **Precondition** | Provoke error (e.g. invalid data) |
| **Steps** | 1. Coba submit form dengan data invalid<br>2. Cek error message |
| **Expected** | Error message user-friendly, TIDAK ada raw SQL/Postgres error |

### TC-SEC-02: URL Manipulation
| Item | Detail |
|------|--------|
| **Precondition** | Login sebagai Employee |
| **Steps** | 1. Ubah URL ke `/dashboard/employees` (admin only)<br>2. Ubah URL ke `/dashboard/audit-logs` (admin only) |
| **Expected** | Redirect atau unauthorized, TIDAK bisa akses data |

---

> **Total Test Cases: 45+**
> Gunakan bersama dengan [SMOKE_TEST.md](./SMOKE_TEST.md) untuk coverage lengkap.
