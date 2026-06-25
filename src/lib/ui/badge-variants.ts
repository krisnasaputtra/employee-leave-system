// Semantic status badge styles with explicit colors
export const STATUS_BADGE_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700" },
  APPROVED: { label: "Approved", className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-600" },
};

export const ROLE_BADGE_STYLES: Record<string, { className: string }> = {
  ADMIN: { className: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700" },
  MANAGER: { className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700" },
  EMPLOYEE: { className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-600" },
};

export const EMPLOYMENT_STATUS_STYLES: Record<string, { className: string }> = {
  ACTIVE: { className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700" },
  INACTIVE: { className: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-600" },
  TERMINATED: { className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700" },
};
