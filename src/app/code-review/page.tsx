"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronUp,
  FileCode2,
  ListChecks,
  Moon,
  Printer,
  RotateCcw,
  Shield,
  Sun,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChecklistItem {
  id: string;
  text: string;
  children?: ChecklistItem[];
}

interface Subsection {
  title: string;
  items: ChecklistItem[];
  codeBlocks?: { language: string; code: string }[];
}

interface Section {
  number: number;
  title: string;
  purpose?: string;
  subsections: Subsection[];
}

// ---------------------------------------------------------------------------
// Checklist Data — hardcoded from the markdown document
// ---------------------------------------------------------------------------

let _id = 0;
function nextId(prefix: string): string {
  return `${prefix}-${++_id}`;
}

function items(prefix: string, texts: string[]): ChecklistItem[] {
  return texts.map((t) => ({ id: nextId(prefix), text: t }));
}

const SECTIONS: Section[] = [
  // ── 1 ──────────────────────────────────────────────────────────────────
  {
    number: 1,
    title: "Functional Correctness",
    purpose:
      "Memastikan seluruh fitur bekerja sesuai PRD, business rule, dan workflow aplikasi.",
    subsections: [
      {
        title: "Requirement Coverage",
        items: items("1a", [
          "Seluruh requirement pada PRD telah diimplementasikan",
          "Task pada task.md sesuai implementasi nyata",
          "Tidak ada task yang ditandai selesai tetapi belum benar-benar selesai",
          "Tidak ada placeholder route (Page not found / will be added in future updates)",
          "Quick Create menuju halaman create leave request",
          "Menu All Requests tersedia",
          "Seluruh menu sesuai role",
          "Tombol atau icon header benar-benar memiliki fungsi",
        ]),
      },
      {
        title: "Employee Management",
        items: items("1b", [
          "Admin dapat membuat employee tanpa Auth account",
          "Admin dapat membuat employee dengan Auth account",
          "Employee code unik",
          "Work email unik",
          "Employee dapat diaktifkan dan dinonaktifkan",
          "Employee inactive tidak dapat login",
          "Employee tidak dapat menjadi manager dirinya sendiri",
          "Employee tidak di-hard delete jika memiliki historical data",
          "Supabase Auth user tidak orphan jika profile creation gagal",
          "employees.auth_user_id konsisten dengan auth.users.id",
        ]),
      },
      {
        title: "Employee Query Relationship",
        codeBlocks: [
          {
            language: "text",
            code: "Could not embed because more than one relationship was found\nfor 'employees' and 'departments'",
          },
          {
            language: "typescript",
            code: "departments!employees_department_id_fkey(...)",
          },
        ],
        items: items("1c", [
          "Query menggunakan explicit foreign key hint",
          "Relationship yang dipakai tidak ambigu",
          "Generated database types terbaru",
          "Department employee dibedakan dari department manager",
          "Query tetap mendukung pagination dan filter",
          "Tidak menghilangkan join hanya untuk menyembunyikan error",
        ]),
      },
      {
        title: "Leave Request",
        items: items("1d", [
          "Employee dapat membuat leave request",
          "Leave type wajib dipilih",
          "Start date dan end date wajib",
          "End date tidak boleh sebelum start date",
          "Weekend dan holiday dihitung sesuai requirement",
          "Half-day dihitung sebagai 0.5",
          "Database/RPC menghitung authoritative requested days",
          "Client tidak dipercaya untuk total hari",
          "Request tidak overlap dengan Pending atau Approved",
          "Request tidak melebihi available balance",
          "Pending request dapat diedit dan dibatalkan",
          "Approved, Rejected, dan Cancelled tidak dapat diedit",
          "Status transition valid",
        ]),
      },
      {
        title: "Leave Balance",
        codeBlocks: [
          {
            language: "text",
            code: "remaining = entitled_days + adjustment_days - used_days\navailable_to_request = remaining - pending_days",
          },
        ],
        items: items("1e", [
          "Pending request menambah pending_days",
          "Approved memindahkan pending ke used",
          "Rejected melepaskan pending",
          "Cancelled membalik nilai sesuai status",
          "Adjustment selalu membuat ledger",
          "Balance tidak dimodifikasi langsung dari client",
          "Ledger append-only",
          "Numeric precision mendukung half-day",
          "Negative balance hanya jika leave type mengizinkan",
        ]),
      },
      {
        title: "Approval Workflow",
        items: items("1f", [
          "Employee tidak dapat approve atau reject",
          "Manager hanya melihat direct report",
          "Manager tidak dapat approve request sendiri",
          "Admin dapat memproses seluruh request",
          "Hanya Pending yang dapat diproses",
          "Rejection reason wajib",
          "Approval dan balance update atomik",
          "Duplicate approval tidak menggandakan balance",
          "Notification dibuat",
          "Audit log dibuat",
        ]),
      },
      {
        title: "Calendar",
        items: items("1g", [
          "Hanya Approved request yang tampil",
          "Pending, Rejected, dan Cancelled tidak tampil",
          "Query hanya visible date range",
          "Filter department, employee, dan leave type bekerja",
          "Sensitive leave type ditampilkan sebagai Out of Office",
          "Reason, attachment, balance, dan rejection reason tidak dikirim ke client calendar",
        ]),
      },
      {
        title: "Authentication",
        items: items("1h", [
          "Login dan logout bekerja",
          "Protected route tidak dapat dibuka anonymous",
          "Inactive account ditolak",
          "must_change_password bekerja",
          "Public sign-up dinonaktifkan",
          "Session divalidasi server-side",
          "Redirect aman",
          "Auth callback tidak open redirect",
        ]),
      },
      {
        title: "Edge Cases",
        items: items("1i", [
          "Null employee profile",
          "Employee tanpa Auth account",
          "Manager tanpa direct report",
          "Empty balance atau list",
          "Invalid UUID",
          "Duplicate submission",
          "Double click submit",
          "Stale page setelah mutation",
          "Concurrent approval",
          "Concurrent leave request pada balance yang sama",
          "Employee inactive saat request Pending",
          "File upload gagal setelah metadata berhasil",
          "Metadata gagal setelah Storage upload berhasil",
        ]),
      },
      {
        title: "Data Integrity",
        items: items("1j", [
          "Tidak ada orphan Auth user",
          "Tidak ada orphan balance atau ledger",
          "Tidak ada orphan attachment metadata",
          "Tidak ada request tanpa employee",
          "Tidak ada duplicate balance untuk employee, leave type, dan year",
          "Historical request tidak hilang ketika configuration dinonaktifkan",
        ]),
      },
    ],
  },
  // ── 2 ──────────────────────────────────────────────────────────────────
  {
    number: 2,
    title: "Security Review — OWASP and Supabase",
    subsections: [
      {
        title: "Authentication",
        items: items("2a", [
          "Tidak ada hardcoded credential, token, atau API key",
          "Tidak ada SUPABASE_SECRET_KEY di client bundle",
          "Service-role key tidak memakai prefix NEXT_PUBLIC_",
          "Session menggunakan cookie-based SSR",
          "User divalidasi server-side",
          "Public sign-up disabled",
          "Password dan temporary password tidak dicatat",
          "Auth redirect allowlist benar",
          "Session tidak disimpan manual di Local Storage",
        ]),
      },
      {
        title: "Authorization",
        items: items("2b", [
          "Setiap Server Action melakukan auth dan permission check",
          "Middleware bukan satu-satunya authorization layer",
          "Employee hanya melihat data sendiri",
          "Manager hanya melihat direct report",
          "Admin-only route benar-benar protected",
          "Role dan employee ID tidak dipercaya dari payload",
          "Manager tidak dapat self-approve",
          "Hiding menu tidak dianggap sebagai security control",
        ]),
      },
      {
        title: "Row Level Security",
        items: items("2c", [
          "RLS aktif pada seluruh exposed business table",
          "Policy Anonymous, Employee, Manager, dan Admin benar",
          "Direct balance mutation ditolak",
          "Direct ledger mutation ditolak",
          "Direct audit mutation ditolak",
          "Storage policy aktif",
          "Policy tidak recursive tanpa sengaja",
          "Helper function menggunakan safe search_path",
          "security definer hanya dipakai jika perlu",
          "Policy tidak mempercayai editable user_metadata",
        ]),
      },
      {
        title: "Input Validation",
        items: items("2d", [
          "Semua Server Action memakai Zod",
          "Query parameter dan UUID divalidasi",
          "Sorting column menggunakan allowlist",
          "Pagination limit dibatasi",
          "File MIME dan size divalidasi",
          "Redirect URL divalidasi",
          "RPC parameter tidak dibangun melalui string SQL",
        ]),
      },
      {
        title: "OWASP — Broken Access Control",
        items: items("2e", [
          "IDOR pada employee detail, request, balance, dan attachment",
          "Direct URL ke Admin page",
          "Manager mengakses non-direct report",
          "Employee mengakses audit log",
          "Role escalation melalui payload",
        ]),
      },
      {
        title: "OWASP — Injection",
        items: items("2f", [
          "Tidak ada raw SQL dengan interpolation",
          "Tidak ada dynamic SQL dari user input",
          "Sorting/filter column di-allowlist",
          "Tidak ada unsafe HTML rendering",
        ]),
      },
      {
        title: "OWASP — Security Misconfiguration",
        items: items("2g", [
          "Public sign-up masih aktif",
          "Storage bucket public",
          "RLS disabled",
          "Service key digunakan untuk normal query",
          "Stack trace tampil",
          "Development credential aktif di deployment",
        ]),
      },
      {
        title: "OWASP — Authentication Failures",
        items: items("2h", [
          "Session stale setelah deactivation",
          "Auth user tanpa employee profile",
          "Login error terlalu detail",
          "Account enumeration",
        ]),
      },
      {
        title: "OWASP — Logging Failures",
        items: items("2i", [
          "Approval, balance adjustment, attachment, dan employee change tidak tercatat",
          "Error tidak memiliki reference ID",
          "Audit metadata mengandung sensitive data",
        ]),
      },
    ],
  },
  // ── 3 ──────────────────────────────────────────────────────────────────
  {
    number: 3,
    title: "Performance Review",
    subsections: [
      {
        title: "Rendering Performance",
        items: items("3a", [
          "Unnecessary re-render",
          "Client Component terlalu besar",
          'Seluruh page memakai "use client"',
          "Expensive calculation saat render",
          "FullCalendar rerender berlebihan",
          "Skeleton tidak sesuai layout final",
        ]),
      },
      {
        title: "Server Component Usage",
        items: items("3b", [
          "Server Components digunakan secara default",
          "Client Component hanya untuk interaksi",
          "Data awal tidak di-fetch ulang di useEffect",
          "Tidak ada client-side waterfall",
          "Data besar tidak diserialisasi tanpa kebutuhan",
        ]),
      },
      {
        title: "Supabase Query Performance",
        items: items("3c", [
          "Tidak ada duplicate query",
          "Tidak ada N+1 query",
          'Hindari select("*")',
          "Hanya field diperlukan yang diambil",
          "Explicit relationship digunakan",
          "Filter dan pagination dilakukan di database",
          "Index tersedia",
          "Calendar query dibatasi visible range",
          "Dashboard memakai aggregate query/RPC",
          "Notification dan audit dipaginasi",
        ]),
      },
      {
        title: "Loading State — List Skeleton",
        items: items("3d", [
          "Employee list skeleton tersedia",
          "Leave request list skeleton tersedia",
          "Approval list skeleton tersedia",
          "Notification list skeleton tersedia",
          "Audit list skeleton tersedia",
          "Skeleton menyerupai final layout dan tidak menyebabkan layout shift",
        ]),
      },
      {
        title: "Loading State — Button Loading",
        items: items("3e", [
          "Submit disabled saat processing",
          "Spinner atau loading text tampil",
          "Double submit dicegah",
          "Approve, Reject, Cancel, Upload, dan Quick Create memiliki loading state",
          "Button kembali normal setelah error",
        ]),
      },
      {
        title: "Network",
        items: items("3f", [
          "Tidak ada duplicate API call",
          "Search memakai debounce",
          "Filter tidak memicu request berlebihan",
          "Calendar tidak fetch satu tahun penuh",
          "Attachment tidak di-load sebelum dibutuhkan",
          "Signed URL tidak dibuat massal",
        ]),
      },
      {
        title: "Memory",
        items: items("3g", [
          "Realtime subscription di-unsubscribe",
          "Event listener dan timer dibersihkan",
          "Tidak ada repeated Supabase client instance",
          "Tidak ada memory leak pada calendar",
        ]),
      },
    ],
  },
  // ── 4 ──────────────────────────────────────────────────────────────────
  {
    number: 4,
    title: "Architecture Review",
    subsections: [
      {
        title: "Expected Layering",
        codeBlocks: [
          {
            language: "text",
            code: "Page / Server Component\n  ↓\nServer Action or Server Query\n  ↓\nDomain Service\n  ↓\nSupabase Server Client or RPC\n  ↓\nSupabase Postgres",
          },
        ],
        items: items("4a", [
          "UI terpisah dari business logic",
          "Permission logic terpusat",
          "Validation schema terpisah",
          "Client Component tidak mengakses admin client",
          "Page tidak berisi SQL/business logic",
          "Supabase query tidak tersebar tanpa pola",
          "RPC menangani mutation transactional",
          "Tidak ada circular dependency",
          "Tidak ada mega-service atau dumping-ground utility",
        ]),
      },
      {
        title: "Route Structure",
        items: items("4b", [
          "Route sesuai App Router",
          "Loading/error/not-found tersedia",
          "Placeholder route tidak tersisa",
          "Quick Create mengarah ke route benar",
          "All Requests route tersedia",
          "Navigation sesuai role",
          "Auth route tidak duplikatif",
        ]),
      },
      {
        title: "Supabase Client Architecture",
        items: items("4c", [
          "Browser client terpisah",
          "Server client terpisah",
          "Admin client terpisah",
          "Admin client memakai server-only",
          "Tidak ada duplicate client factory",
          "Cookie handling sesuai SSR pattern",
        ]),
      },
    ],
  },
  // ── 5 ──────────────────────────────────────────────────────────────────
  {
    number: 5,
    title: "Maintainability Review",
    subsections: [
      {
        title: "Naming",
        items: items("5a", [
          "Component, function, action, RPC, schema, dan type memiliki nama jelas",
          "File naming konsisten",
          "Tidak ada nama generik (data, stuff, handler2, temp)",
        ]),
      },
      {
        title: "Duplication",
        items: items("5b", [
          "Duplicate role check",
          "Duplicate Supabase query",
          "Duplicate status mapping",
          "Duplicate date formatting",
          "Duplicate form schema",
          "Duplicate skeleton",
          "Duplicate BNI color hardcode",
        ]),
      },
      {
        title: "Dead Code",
        items: items("5c", [
          "Old auth pages v1/ dan v2/",
          "Unused template pages",
          "Demo dashboard code",
          'Old branding "Studio Admin"',
          "Placeholder route",
          "Unused BNI logo variant",
        ]),
      },
      {
        title: "Technical Debt",
        items: items("5d", [
          "Deferred RPC integration test",
          "Deferred concurrency test",
          "Deferred Storage policy test",
          "Manual public sign-up verification",
          "Missing Playwright",
          "Temporary workaround",
          "Setiap debt harus memiliki owner, severity, dan target resolution",
        ]),
      },
    ],
  },
  // ── 6 ──────────────────────────────────────────────────────────────────
  {
    number: 6,
    title: "Type Safety Review",
    subsections: [
      {
        title: "Avoid",
        codeBlocks: [
          { language: "typescript", code: "any\nas any\n@ts-ignore" },
        ],
        items: [],
      },
      {
        title: "Use",
        codeBlocks: [
          {
            language: "typescript",
            code: "unknown\nEmployee\nLeaveRequest\nLeaveBalance\nActionResult<T>\nDatabase",
          },
        ],
        items: [],
      },
      {
        title: "Review Items",
        items: items("6a", [
          "database.types.ts terbaru",
          "Generated types tidak diedit manual",
          "RPC return type benar",
          "Enum konsisten",
          "Nullability sesuai schema",
          "Tidak menggunakan non-null assertion tanpa validasi",
        ]),
      },
    ],
  },
  // ── 7 ──────────────────────────────────────────────────────────────────
  {
    number: 7,
    title: "Error Handling Review",
    subsections: [
      {
        title: "Error Categories",
        codeBlocks: [
          {
            language: "text",
            code: "VALIDATION_ERROR\nUNAUTHENTICATED\nFORBIDDEN\nNOT_FOUND\nCONFLICT\nBUSINESS_RULE_ERROR\nINTERNAL_ERROR",
          },
        ],
        items: items("7a", [
          "Error tidak ditelan",
          "Raw Supabase/Postgres error tidak tampil",
          "Stack trace tidak tampil",
          "Error memiliki reference ID",
          "Empty state berbeda dengan error state",
          "Mutation failure mempertahankan input",
          "Upload partial failure ditangani",
        ]),
      },
      {
        title: "User Feedback Example",
        codeBlocks: [
          {
            language: "text",
            code: "Failed to load employees.\nPlease try again or contact the administrator with reference ID ABC123.",
          },
        ],
        items: [],
      },
    ],
  },
  // ── 8 ──────────────────────────────────────────────────────────────────
  {
    number: 8,
    title: "Validation Review",
    subsections: [
      {
        title: "Employee",
        items: items("8a", [
          "Employee code required dan unique",
          "Full name minimum length",
          "Valid dan unique email",
          "Department dan position required",
          "Manager tidak boleh self",
          "Role dan status allowlist",
        ]),
      },
      {
        title: "Leave Request",
        items: items("8b", [
          "Leave type required",
          "Valid date range",
          "Requested days > 0",
          "Overlap check",
          "Balance check",
          "Active employee dan leave type",
          "Attachment required jika configured",
          "Reason length valid",
        ]),
      },
      {
        title: "Balance",
        items: items("8c", [
          "Year valid",
          "Adjustment tidak zero",
          "Reason required",
          "Numeric limit",
          "Negative policy",
        ]),
      },
      {
        title: "Approval",
        items: items("8d", [
          "Pending only",
          "Correct manager scope",
          "No self-approval",
          "Rejection reason required",
          "Balance dan overlap divalidasi ulang",
        ]),
      },
      {
        title: "File",
        items: items("8e", [
          "MIME allowlist",
          "File size",
          "Private bucket",
          "Ownership",
          "Pending status",
          "Safe filename dan path",
        ]),
      },
    ],
  },
  // ── 9 ──────────────────────────────────────────────────────────────────
  {
    number: 9,
    title: "UI/UX Review",
    subsections: [
      {
        title: "BNI Brutalist Theme",
        items: items("9a", [
          "Branding BNI konsisten",
          'Tidak ada "Studio Admin"',
          "Logo BNI konsisten",
          "Login page dan app shell memakai BNI branding",
          "Warna mengikuti BNI theme",
          "Brutalist style tidak mengorbankan usability",
          "Border, typography, radius, dan spacing konsisten",
          "Screenshot hanya digunakan sebagai color direction",
        ]),
      },
      {
        title: "Navigation",
        items: items("9b", [
          "Quick Create menuju /leave/requests/new",
          "All Requests route tersedia",
          "Employee route tersedia",
          "Active navigation benar",
          "Icon email memiliki fungsi jelas",
          "Jika icon adalah notification, gunakan icon dan tooltip yang tepat",
          "Icon dekoratif tanpa fungsi harus dihapus",
        ]),
      },
      {
        title: "Tables and Lists",
        items: items("9c", [
          "Filter, sorting, pagination benar",
          "Skeleton, empty state, error state tersedia",
          "Mobile strategy tersedia",
          "Action menu jelas",
          "Tidak ada layout shift",
        ]),
      },
      {
        title: "Forms",
        items: items("9d", [
          "Label jelas",
          "Error message jelas",
          "Submit loading",
          "Button disabled",
          "Success feedback",
          "Date picker usable",
          "Mobile layout baik",
        ]),
      },
    ],
  },
  // ── 10 ─────────────────────────────────────────────────────────────────
  {
    number: 10,
    title: "Accessibility Review",
    subsections: [
      {
        title: "Review Items",
        items: items("10a", [
          "Semantic HTML",
          "Keyboard navigation",
          "Semua input memiliki label",
          "Icon-only button memiliki aria-label",
          "Status tidak bergantung warna saja",
          "BNI color contrast cukup",
          "Dialog mengelola focus",
          "Calendar event keyboard accessible",
          "Skeleton tidak dibaca sebagai data",
        ]),
      },
    ],
  },
  // ── 11 ─────────────────────────────────────────────────────────────────
  {
    number: 11,
    title: "Dependency Review",
    subsections: [
      {
        title: "Review Items",
        items: items("11a", [
          "Dependency benar-benar digunakan",
          "Tidak ada duplicate library",
          "Tidak ada second auth framework, ORM, form, table, atau calendar library",
          "Lockfile konsisten",
          "Version compatible",
          "Tidak ada package critical vulnerability",
        ]),
        codeBlocks: [
          { language: "bash", code: "npm audit\nnpm outdated" },
        ],
      },
      {
        title: "Bundle Review",
        items: items("11b", [
          "FullCalendar hanya pada calendar route",
          "Chart library tidak di-import global",
          "Supabase admin code tidak masuk client bundle",
          "Unused template module dihapus",
        ]),
      },
    ],
  },
  // ── 12 ─────────────────────────────────────────────────────────────────
  {
    number: 12,
    title: "Logging and Observability",
    subsections: [
      {
        title: "Allowed to Log",
        items: items("12a", [
          "Reference ID",
          "Operation",
          "Sanitized employee/entity ID",
          "Error category",
          "Duration",
        ]),
      },
      {
        title: "Never Log",
        codeBlocks: [
          {
            language: "text",
            code: "Password\nTemporary password\nAccess token\nRefresh token\nSupabase secret\nService-role key\nOTP\nRecovery link\nMedical document\nFull private leave reason",
          },
        ],
        items: [],
      },
      {
        title: "Audit Events",
        items: items("12b", [
          "Employee created/updated/deactivated",
          "Account created",
          "Role changed",
          "Leave created/edited/cancelled",
          "Leave approved/rejected",
          "Balance adjusted",
          "Attachment uploaded/removed",
          "Configuration changed",
        ]),
      },
    ],
  },
  // ── 13 ─────────────────────────────────────────────────────────────────
  {
    number: 13,
    title: "AI-Generated Code Review",
    subsections: [
      {
        title: "Hallucination",
        items: items("13a", [
          "Supabase function yang tidak ada",
          "shadcn component yang tidak ada",
          "Next.js API salah versi",
          "FullCalendar option tidak valid",
          "RPC dipanggil tetapi migration tidak ada",
          "Relationship name salah",
          "Route/import/script tidak ada",
        ]),
      },
      {
        title: "Fake Security",
        items: items("13b", [
          "Role check hanya di client",
          "RLS disebut ada tetapi migration tidak ada",
          "Private data di-fetch lalu disembunyikan CSS",
          "Button disabled dianggap authorization",
          "Middleware dianggap cukup",
          "security definer tanpa authorization",
        ]),
      },
      {
        title: "Fake Performance",
        items: items("13c", [
          "Pagination UI tetapi fetch semua data",
          "Skeleton ada tetapi query tetap lambat",
          "Cache tanpa user scoping",
          "useMemo sembarangan",
          "Seluruh page jadi client component",
        ]),
      },
      {
        title: "AI Output Integrity",
        items: items("13d", [
          "Command diklaim berhasil tanpa output",
          "Test ditandai pass padahal tidak dijalankan",
          "Task ditandai selesai terlalu cepat",
          "Risk ditutup tanpa evidence",
          "Migration disebut applied padahal belum",
          "Dashboard setting disebut selesai tanpa manual verification",
        ]),
      },
    ],
  },
  // ── 14 ─────────────────────────────────────────────────────────────────
  {
    number: 14,
    title: "Database and Supabase Review",
    subsections: [
      {
        title: "Migration",
        items: items("14a", [
          "Semua schema change memiliki migration",
          "Migration dapat dijalankan dari database kosong",
          "supabase db reset lokal berhasil",
          "Generated types diperbarui",
          "Seed reproducible dan development-only",
        ]),
      },
      {
        title: "Schema",
        items: items("14b", [
          "Primary key",
          "Foreign key",
          "Unique constraint",
          "Check constraint",
          "Index",
          "Timestamps",
          "Delete behavior",
          "Numeric precision",
        ]),
      },
      {
        title: "RPC",
        codeBlocks: [
          {
            language: "text",
            code: "initialize_employee_balances\nadjust_leave_balance\ncreate_leave_request\nupdate_pending_leave_request\ncancel_leave_request\napprove_leave_request\nreject_leave_request",
          },
        ],
        items: items("14c", [
          "auth.uid() digunakan",
          "Actor scope divalidasi",
          "FOR UPDATE digunakan untuk race-sensitive row",
          "Safe search_path",
          "Return minimal data",
          "Transactional",
          "Audit dan ledger konsisten",
        ]),
      },
      {
        title: "Storage",
        items: items("14d", [
          "Bucket private",
          "Path aman",
          "Policy owner, manager, dan admin",
          "MIME dan size limit",
          "Signed URL expiry",
          "Orphan cleanup",
          "Calendar tidak expose attachment",
        ]),
      },
    ],
  },
  // ── 15 ─────────────────────────────────────────────────────────────────
  {
    number: 15,
    title: "Test Review",
    subsections: [
      {
        title: "Unit Tests",
        items: items("15a", [
          "Leave day calculation",
          "Weekend dan holiday exclusion",
          "Half-day",
          "Overlap",
          "Permission helper",
          "Status transition",
          "Balance formula",
          "Error mapping",
        ]),
      },
      {
        title: "Database/RPC Tests",
        items: items("15b", [
          "RPC berjalan pada DB nyata/lokal",
          "Request, balance, ledger, notification, dan audit diverifikasi bersama",
          "Unauthorized actor ditolak",
          "Duplicate decision ditolak",
          "Concurrent operation diuji",
          "FOR UPDATE efektif",
        ]),
      },
      {
        title: "RLS Tests",
        items: items("15c", [
          "Anonymous role tested",
          "Employee role tested",
          "Manager role tested",
          "Admin role tested",
          "Employee resource tested",
          "Balance resource tested",
          "Request resource tested",
          "Approval resource tested",
          "Calendar resource tested",
          "Notification resource tested",
          "Audit resource tested",
          "Storage resource tested",
        ]),
      },
      {
        title: "E2E Critical Flow",
        codeBlocks: [
          {
            language: "text",
            code: "Admin login\n→ Create employee + Auth account\n→ Employee change password\n→ Employee create leave request\n→ Manager approve\n→ Balance updates\n→ Notification appears\n→ Audit log created\n→ Calendar shows approved leave\n→ Unrelated employee cannot view private reason or attachment",
          },
        ],
        items: [],
      },
    ],
  },
  // ── 16 ─────────────────────────────────────────────────────────────────
  {
    number: 16,
    title: "Deployment Review",
    subsections: [
      {
        title: "Vercel Environment Variables",
        codeBlocks: [
          {
            language: "text",
            code: "NEXT_PUBLIC_SUPABASE_URL\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\nSUPABASE_SECRET_KEY\nNEXT_PUBLIC_APP_URL",
          },
        ],
        items: items("16a", [
          "Secret tidak public",
          "Production/Preview scope benar",
          "Redeploy setelah env berubah",
          "Build berhasil",
        ]),
      },
      {
        title: "Supabase Auth URLs",
        items: items("16b", [
          "Site URL benar",
          "Localhost callback terdaftar",
          "Vercel callback terdaftar",
          "Change-password URL terdaftar",
          "Wildcard tidak terlalu luas",
          "Public sign-up disabled",
        ]),
      },
      {
        title: "Migration Deployment",
        codeBlocks: [
          {
            language: "bash",
            code: "supabase migration list\nsupabase db push",
          },
        ],
        items: items("16c", [
          "Backup tersedia",
          "Tidak menggunakan db reset pada remote",
          "Initial Admin dibuat aman",
          "Smoke test dilakukan",
        ]),
      },
    ],
  },
];

// ── Additional Sections ──────────────────────────────────────────────────

const SEVERITY_CLASSIFICATION = [
  {
    level: "Critical",
    color: "bg-red-600 dark:bg-red-500",
    textColor: "text-white",
    impacts: [
      "Data breach",
      "Authentication bypass",
      "Service-role key exposed",
      "RLS bypass",
      "Data corruption",
      "Unauthorized approval",
      "Private attachment exposure",
    ],
    action: "Release Blocker",
  },
  {
    level: "High",
    color: "bg-orange-500 dark:bg-orange-400",
    textColor: "text-white dark:text-black",
    impacts: [
      "Main workflow gagal",
      "Employee list tidak dapat dimuat",
      "Approval gagal",
      "Balance salah",
      "Route utama tidak ada",
      "Major performance issue",
    ],
    action: "Fix Before Deployment",
  },
  {
    level: "Medium",
    color: "bg-yellow-400 dark:bg-yellow-300",
    textColor: "text-black",
    impacts: [
      "Maintainability issue",
      "Minor performance issue",
      "Missing loading/skeleton",
      "Incomplete error handling",
      "Accessibility issue",
    ],
    action: "Fix During Sprint",
  },
  {
    level: "Low",
    color: "bg-blue-400 dark:bg-blue-300",
    textColor: "text-white dark:text-black",
    impacts: [
      "Naming issue",
      "Cosmetic inconsistency",
      "Minor refactor",
      "Documentation gap",
    ],
    action: "Backlog",
  },
];

const FINAL_RECOMMENDATIONS = [
  {
    decision: "APPROVED",
    rules: [
      "Tidak ada Critical",
      "Tidak ada High",
      "Mandatory test lulus",
      "Build lulus",
      "RLS dan Auth verified",
    ],
  },
  {
    decision: "APPROVED WITH MINOR CHANGES",
    rules: [
      "Tidak ada Critical",
      "Tidak ada High",
      "Hanya Medium/Low non-blocking",
    ],
  },
  {
    decision: "REQUEST CHANGES",
    rules: [
      "Ada High",
      "Main flow belum stabil",
      "Test penting belum lulus",
      "RLS belum lengkap",
    ],
  },
  {
    decision: "REJECTED",
    rules: [
      "Ada Critical",
      "Data exposure",
      "Auth bypass",
      "Service-role leak",
      "Data corruption",
    ],
  },
];

const DEFERRED_RISKS = [
  "DB-level RPC integration tests",
  "Concurrent race-condition testing",
  "Supabase public sign-up verification",
  "Storage policy integration tests",
  "Playwright E2E",
];

const REVIEW_EXECUTION_ORDER = [
  "Read PRD, Project Rules, Implementation Plan, and task.md",
  "Inspect repository structure",
  "Run lint and typecheck",
  "Run unit tests",
  "Run Supabase local migrations",
  "Run RLS/RPC tests",
  "Run Storage policy tests",
  "Run Playwright E2E",
  "Review Auth and authorization",
  "Review data integrity and balance logic",
  "Review performance",
  "Review UI/UX and accessibility",
  "Review deployment configuration",
  "Produce findings",
  "Classify severity",
  "Give final recommendation",
];

const TECH_STACK = [
  "Next.js",
  "TypeScript",
  "Supabase",
  "Tailwind CSS",
  "shadcn/ui",
  "React Hook Form",
  "Zod",
  "TanStack Table",
  "FullCalendar",
];

const STORAGE_KEY = "lrm-code-review-checklist";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect every checkable item id */
function collectAllIds(sections: Section[]): string[] {
  const ids: string[] = [];
  for (const section of sections) {
    for (const sub of section.subsections) {
      for (const item of sub.items) {
        ids.push(item.id);
        if (item.children) {
          for (const child of item.children) ids.push(child.id);
        }
      }
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CodeReviewPage() {
  // -- State ----------------------------------------------------------------
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState(1);
  const [isDark, setIsDark] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});
  const allIds = useMemo(() => collectAllIds(SECTIONS), []);
  const totalItems = allIds.length;
  const checkedCount = allIds.filter((id) => checked[id]).length;
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  // -- localStorage load/save -----------------------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    // detect system dark mode
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked]);

  // -- Dark mode toggle -----------------------------------------------------
  const toggleDark = useCallback(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove("dark");
      html.dataset.themeMode = "light";
    } else {
      html.classList.add("dark");
      html.dataset.themeMode = "dark";
    }
    setIsDark(!isDark);
  }, [isDark]);

  // -- Scroll spy -----------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      const offsets = SECTIONS.map((s) => {
        const el = sectionRefs.current[s.number];
        if (!el) return { number: s.number, top: Infinity };
        return { number: s.number, top: el.getBoundingClientRect().top };
      });

      const visible = offsets.filter((o) => o.top <= 200);
      if (visible.length > 0) {
        setActiveSection(visible[visible.length - 1].number);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // -- Handlers -------------------------------------------------------------
  const toggle = useCallback((id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const resetAll = useCallback(() => {
    if (window.confirm("Reset all checklist items? This cannot be undone.")) {
      setChecked({});
    }
  }, []);

  const scrollToSection = useCallback((num: number) => {
    const el = sectionRefs.current[num];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // -- Count checked per section --------------------------------------------
  const sectionProgress = useMemo(() => {
    const map: Record<number, { total: number; checked: number }> = {};
    for (const section of SECTIONS) {
      let total = 0;
      let done = 0;
      for (const sub of section.subsections) {
        for (const item of sub.items) {
          total++;
          if (checked[item.id]) done++;
          if (item.children) {
            for (const child of item.children) {
              total++;
              if (checked[child.id]) done++;
            }
          }
        }
      }
      map[section.number] = { total, checked: done };
    }
    return map;
  }, [checked]);

  // -- Render ---------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          {/* top row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-border bg-primary">
                <FileCode2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold leading-tight tracking-tight sm:text-xl">
                  LRM{" "}
                  <span className="text-muted-foreground font-semibold">
                    — Code Review Checklist
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Leave Request Management System • Next.js + Supabase
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleDark}
                aria-label="Toggle dark mode"
                className="inline-flex h-8 w-8 items-center justify-center border-2 border-border bg-card transition-colors hover:bg-muted"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => window.print()}
                aria-label="Print"
                className="inline-flex h-8 w-8 items-center justify-center border-2 border-border bg-card transition-colors hover:bg-muted"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={resetAll}
                aria-label="Reset all"
                className="inline-flex h-8 w-8 items-center justify-center border-2 border-border bg-card transition-colors hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* badges */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {TECH_STACK.map((tech) => (
              <Badge
                key={tech}
                variant="outline"
                className="text-[10px] font-semibold uppercase tracking-wider"
              >
                {tech}
              </Badge>
            ))}
          </div>

          {/* progress */}
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progressPct} className="h-2.5 flex-1 border border-border" />
            <span className="min-w-[5ch] text-right text-sm font-bold tabular-nums">
              {progressPct}%
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {checkedCount}/{totalItems}
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:flex lg:gap-6">
        {/* ─ TOC ─ */}
        <nav
          className="hidden lg:block lg:w-72 xl:w-80"
          aria-label="Table of contents"
        >
          <div className="sticky top-[140px] max-h-[calc(100vh-160px)] overflow-y-auto border-2 border-border bg-card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <ListChecks className="h-4 w-4" /> Sections
            </h2>
            <ul className="space-y-0.5">
              {SECTIONS.map((s) => {
                const sp = sectionProgress[s.number];
                const isActive = activeSection === s.number;
                const isDone = sp && sp.total > 0 && sp.checked === sp.total;
                return (
                  <li key={s.number}>
                    <button
                      onClick={() => scrollToSection(s.number)}
                      className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors ${
                        isActive
                          ? "border-l-[3px] border-primary bg-primary/10 font-bold text-foreground"
                          : "border-l-[3px] border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-border text-[10px] font-bold">
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        ) : (
                          s.number
                        )}
                      </span>
                      <span className="flex-1 truncate text-xs">
                        {s.title}
                      </span>
                      {sp && sp.total > 0 && (
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {sp.checked}/{sp.total}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* extra links */}
            <div className="mt-4 border-t border-border pt-3 space-y-1">
              {["severity-classification", "review-report-template", "final-recommendation", "reviewer-info", "summary"].map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    const el = document.getElementById(id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="block w-full px-2 py-1 text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {id
                    .split("-")
                    .map((w) => w[0].toUpperCase() + w.slice(1))
                    .join(" ")}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* ─ CONTENT ─ */}
        <main className="min-w-0 flex-1 space-y-6 pb-20">
          {SECTIONS.map((section) => (
            <section
              key={section.number}
              ref={(el) => {
                sectionRefs.current[section.number] = el;
              }}
              id={`section-${section.number}`}
              className="scroll-mt-36"
            >
              <Card className="overflow-hidden border-2 border-border shadow-none rounded-none">
                <CardHeader className="border-b-2 border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-border bg-primary text-sm font-black text-primary-foreground">
                      {section.number}
                    </span>
                    <CardTitle className="text-base font-extrabold uppercase tracking-wide sm:text-lg">
                      {section.title}
                    </CardTitle>
                  </div>
                  {section.purpose && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {section.purpose}
                    </p>
                  )}
                  {/* section micro progress */}
                  {sectionProgress[section.number] &&
                    sectionProgress[section.number].total > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress
                          value={
                            (sectionProgress[section.number].checked /
                              sectionProgress[section.number].total) *
                            100
                          }
                          className="h-1.5 flex-1"
                        />
                        <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                          {sectionProgress[section.number].checked}/
                          {sectionProgress[section.number].total}
                        </span>
                      </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {section.subsections.map((sub, si) => (
                    <div key={si}>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
                        <BookOpenCheck className="h-3.5 w-3.5 text-primary" />
                        {sub.title}
                      </h3>

                      {/* code blocks */}
                      {sub.codeBlocks?.map((cb, ci) => (
                        <pre
                          key={ci}
                          className="mb-3 overflow-x-auto border-2 border-border bg-black/90 p-3 text-xs leading-relaxed text-green-400 dark:bg-white/5 dark:text-green-300 font-mono"
                        >
                          <code>{cb.code}</code>
                        </pre>
                      ))}

                      {/* items */}
                      {sub.items.length > 0 && (
                        <ul className="space-y-1.5">
                          {sub.items.map((item) => (
                            <li key={item.id}>
                              <label className="group flex cursor-pointer items-start gap-2.5 px-2 py-1 transition-colors hover:bg-muted/40">
                                <Checkbox
                                  checked={!!checked[item.id]}
                                  onCheckedChange={() => toggle(item.id)}
                                  className="mt-0.5 shrink-0"
                                />
                                <span
                                  className={`text-sm leading-snug transition-colors ${
                                    checked[item.id]
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground"
                                  }`}
                                >
                                  {item.text}
                                </span>
                              </label>
                              {/* children */}
                              {item.children && (
                                <ul className="ml-8 mt-1 space-y-1">
                                  {item.children.map((child) => (
                                    <li key={child.id}>
                                      <label className="group flex cursor-pointer items-start gap-2.5 px-2 py-0.5 transition-colors hover:bg-muted/40">
                                        <Checkbox
                                          checked={!!checked[child.id]}
                                          onCheckedChange={() =>
                                            toggle(child.id)
                                          }
                                          className="mt-0.5 shrink-0"
                                        />
                                        <span
                                          className={`text-xs leading-snug transition-colors ${
                                            checked[child.id]
                                              ? "text-muted-foreground line-through"
                                              : "text-foreground"
                                          }`}
                                        >
                                          {child.text}
                                        </span>
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ))}

          {/* ── SEVERITY CLASSIFICATION ──────────────────────────── */}
          <section id="severity-classification" className="scroll-mt-36">
            <Card className="overflow-hidden border-2 border-border shadow-none rounded-none">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle className="text-base font-extrabold uppercase tracking-wide sm:text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Severity Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {SEVERITY_CLASSIFICATION.map((sev) => (
                    <div
                      key={sev.level}
                      className="border-2 border-border overflow-hidden"
                    >
                      <div
                        className={`${sev.color} ${sev.textColor} px-3 py-2 font-black uppercase tracking-widest text-sm flex items-center justify-between`}
                      >
                        <span>{sev.level}</span>
                        <Badge
                          variant="outline"
                          className={`${sev.textColor} border-current text-[10px]`}
                        >
                          {sev.action}
                        </Badge>
                      </div>
                      <ul className="p-3 space-y-1">
                        {sev.impacts.map((imp, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground flex items-start gap-1.5"
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ── REVIEW REPORT TEMPLATE ──────────────────────────── */}
          <section id="review-report-template" className="scroll-mt-36">
            <Card className="overflow-hidden border-2 border-border shadow-none rounded-none">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle className="text-base font-extrabold uppercase tracking-wide sm:text-lg">
                  Review Report Template
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-border">
                      {[
                        "Area",
                        "Status",
                        "Severity",
                        "Finding",
                        "Evidence",
                        "Recommendation",
                        "Owner",
                        "Target",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-2 py-2 text-left font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      "Functional Correctness",
                      "Security",
                      "Performance",
                      "Architecture",
                      "Maintainability",
                      "Type Safety",
                      "Error Handling",
                      "Validation",
                      "UI/UX",
                      "Accessibility",
                      "Dependency Review",
                      "Logging & Observability",
                      "Supabase Database",
                      "Testing",
                      "Deployment",
                      "AI Generated Code",
                    ].map((area, i) => (
                      <tr
                        key={area}
                        className={`border-b border-border ${i % 2 === 0 ? "bg-muted/20" : ""}`}
                      >
                        <td className="px-2 py-1.5 font-medium">{area}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          PASS/FAIL
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          —
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          —
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          —
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          —
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          —
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          —
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          {/* ── FINAL RECOMMENDATION ────────────────────────────── */}
          <section id="final-recommendation" className="scroll-mt-36">
            <Card className="overflow-hidden border-2 border-border shadow-none rounded-none">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle className="text-base font-extrabold uppercase tracking-wide sm:text-lg">
                  Final Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {FINAL_RECOMMENDATIONS.map((rec) => (
                    <div
                      key={rec.decision}
                      className="border-2 border-border p-3"
                    >
                      <h4 className="text-sm font-black uppercase tracking-wide text-primary mb-2">
                        {rec.decision}
                      </h4>
                      <ul className="space-y-1">
                        {rec.rules.map((r, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-xs text-muted-foreground"
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ── REVIEWER INFO ───────────────────────────────────── */}
          <section id="reviewer-info" className="scroll-mt-36">
            <Card className="overflow-hidden border-2 border-border shadow-none rounded-none">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle className="text-base font-extrabold uppercase tracking-wide sm:text-lg">
                  Reviewer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Reviewer", ""],
                      ["Review Date", ""],
                      [
                        "Application",
                        "Leave Request Management System",
                      ],
                      ["Version", ""],
                      [
                        "Repository",
                        "Training-VibeCode/employee-leave-system",
                      ],
                      ["Branch", ""],
                      ["Commit", ""],
                      [
                        "Environment",
                        "Local / Preview / Vercel",
                      ],
                      ["Supabase Project", ""],
                    ].map(([field, value]) => (
                      <tr
                        key={field}
                        className="border-b border-border"
                      >
                        <td className="px-3 py-2 font-bold text-muted-foreground w-48">
                          {field}
                        </td>
                        <td className="px-3 py-2">
                          {value || (
                            <span className="text-muted-foreground/50 italic">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          {/* ── SUMMARY ─────────────────────────────────────────── */}
          <section id="summary" className="scroll-mt-36">
            <Card className="overflow-hidden border-2 border-border shadow-none rounded-none">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle className="text-base font-extrabold uppercase tracking-wide sm:text-lg">
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                {/* Total Findings Table */}
                <div>
                  <h4 className="text-sm font-bold mb-2">Total Findings</h4>
                  <table className="w-full max-w-xs text-sm border-2 border-border">
                    <thead>
                      <tr className="border-b-2 border-border bg-muted/30">
                        <th className="px-3 py-1.5 text-left font-bold">
                          Severity
                        </th>
                        <th className="px-3 py-1.5 text-right font-bold">
                          Count
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {["Critical", "High", "Medium", "Low"].map((sev) => (
                        <tr key={sev} className="border-b border-border">
                          <td className="px-3 py-1.5">{sev}</td>
                          <td className="px-3 py-1.5 text-right text-muted-foreground">
                            —
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Deferred Risks */}
                <div>
                  <h4 className="text-sm font-bold mb-2">Deferred Risks</h4>
                  <ul className="space-y-1">
                    {DEFERRED_RISKS.map((risk, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 border border-current" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Review Execution Order */}
                <div>
                  <h4 className="text-sm font-bold mb-2">
                    Suggested Review Execution Order
                  </h4>
                  <ol className="space-y-1 list-none">
                    {REVIEW_EXECUTION_ORDER.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-border bg-muted text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ── OVERALL PROGRESS ────────────────────────────────── */}
          <Card className="overflow-hidden border-2 border-primary shadow-none rounded-none">
            <CardContent className="flex flex-col items-center gap-3 py-6">
              <div className="flex h-16 w-16 items-center justify-center border-2 border-primary bg-primary/10">
                <span className="text-2xl font-black text-primary">
                  {progressPct}%
                </span>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Overall Completion
              </p>
              <p className="text-xs text-muted-foreground">
                {checkedCount} of {totalItems} items reviewed
              </p>
              <Progress
                value={progressPct}
                className="h-3 w-full max-w-md border border-border"
              />
            </CardContent>
          </Card>
        </main>
      </div>

      {/* ── SCROLL TO TOP ───────────────────────────────────────── */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center border-2 border-border bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
