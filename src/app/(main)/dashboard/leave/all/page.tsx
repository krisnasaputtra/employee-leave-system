import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

import { AllRequestsClient } from "./_components/all-requests-client";
import { fetchAllRequests } from "./fetch-all-requests";

export const metadata: Metadata = {
  title: "All Leave Requests",
};

export default async function AllLeaveRequestsPage() {
  const { employee: actor } = await getAuthenticatedUser();

  // Admin-only page
  if (actor.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Prefetch initial data
  const initialData = await fetchAllRequests({ page: 1 });

  return <AllRequestsClient initialData={initialData} />;
}
