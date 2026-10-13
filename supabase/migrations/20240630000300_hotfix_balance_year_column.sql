-- HOTFIX: Fix "column year does not exist" in approve/reject RPCs
-- The delegation_aware_approvals migration used "year" instead of "balance_year"
-- Re-run the corrected RPCs:

-- Just re-run the corrected migration:
-- \i 20240630_delegation_aware_approvals.sql
-- Or copy-paste the entire file content from 20240630_delegation_aware_approvals.sql
-- which has been corrected to use "balance_year" instead of "year"
