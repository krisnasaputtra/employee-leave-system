# Future Development Roadmap

This document contains proposed future work, enhancements, and technical debt resolution for the BNI Leave Management System. 

Items here are **not yet approved for active development**. They must be formally approved and moved to `implementation-plan-supabase.md` and `task.md` before coding begins.

---

## 1. Leave Policy Engine and Workforce Capacity Rules (Next Candidate)

**Status:** Proposed | **Priority:** High | **Impact:** High

**Problem:** 
Leave requests are validated manually against company policy. There are no safeguards to prevent department understaffing.

**Proposed Solution:**
- **Admin Configuration:** Provide UI for Admins to create and manage custom leave policies and capacity rules dynamically. No hardcoded policies.
- **Leave Policy Engine:** Automatically block or warn users during leave request submission if the request violates configured HR policies (e.g., "Annual leave >3 days requires 14 days notice").
- **Workforce Capacity Rules (Soft Warnings):** Allow Admins to set department capacity limits (e.g., "Max 20% of IT department on leave simultaneously"). During Phase 1, this will act as a **Soft Warning** for Managers during the approval process, allowing them to override the warning if necessary. We will review this behavior later to decide if hard blocks are needed.

---

## 2. Calendar UI/UX Improvements for High Volume

**Status:** Proposed (QA Feedback) | **Priority:** Medium | **Impact:** Medium

**Problem:** 
When a large number of employees (e.g., 20+) take leave on the same date, the FullCalendar view becomes cluttered and difficult to read.

**Proposed Solution:**
- Implement event grouping for dense days.
- Show a limited number of events (e.g., top 3) and display a "+X more" indicator.
- Implement a hover card or popover when clicking/hovering "+X more" to view the full list of employees on leave for that specific date in a clean, scrollable list.

---

## 3. Team Leave Visibility for Employees

**Status:** Proposed (QA Feedback) | **Priority:** Medium | **Impact:** High (UX)

**Problem:** 
Employees currently cannot see when their team members are on leave, making it difficult to plan their own leave without overlapping with critical team members.

**Proposed Solution:**
- Create a "Team Leave Calendar" or list view accessible to regular employees.
- Scope visibility strictly to employees within the same department or under the same manager.
- Enforce privacy: Hide sensitive details (like leave reasons or specific leave types like Sick Leave) and only show "On Leave" status.

---

## 4. Employee Account Lifecycle Management (Activate/Deactivate)

**Status:** Proposed (QA Feedback) | **Priority:** Medium | **Impact:** High (Security/Admin)

**Problem:** 
Admins need a clear, explicit way to manage the lifecycle of an employee account, specifically regarding offboarding or temporary suspension.

**Proposed Solution:**
- Add UI toggles in the Admin Employee Management screen to "Deactivate" or "Reactivate" an employee.
- Deactivating an employee should immediately revoke their Supabase Auth login access and hide them from active employee dropdowns.
- Reactivating should restore their access without losing historical leave data.

---

## 5. Client-side Data Fetching Optimization with TanStack Query

**Status:** Proposed (QA Feedback/Tech Debt) | **Priority:** Low (Technical) | **Impact:** Medium (Performance/DX)

**Problem:** 
The application currently relies heavily on Next.js Server Components and Server Actions. For highly interactive client-side components (like the Calendar or complex filtering tables), managing loading states and data synchronization can become complex.

**Proposed Solution:**
- Integrate `@tanstack/react-query` for managing asynchronous state in client components.
- Refactor client-heavy pages (like the Calendar) to fetch data via TanStack Query.
- Implement Optimistic UI updates for actions like approving/rejecting leaves to make the UI feel instantly responsive.
