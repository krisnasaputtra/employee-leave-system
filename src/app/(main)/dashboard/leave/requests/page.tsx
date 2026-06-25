import { MyRequestsClient } from "./_components/my-requests-client";
import { fetchMyRequests } from "./fetch-my-requests";

export default async function MyLeaveRequestsPage() {
  const initialData = await fetchMyRequests({ page: 1 });

  return <MyRequestsClient initialData={initialData} />;
}
