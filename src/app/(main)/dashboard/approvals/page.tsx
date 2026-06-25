import { ApprovalsPageClient } from "./_components/approvals-page-client";
import { fetchApprovals } from "./fetch-approvals";

export default async function ApprovalsPage() {
  const initialData = await fetchApprovals();

  return <ApprovalsPageClient initialData={initialData} />;
}
