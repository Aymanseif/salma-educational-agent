import DashboardView from "@/components/DashboardView";
import { getSubjectSummaries, totalsBySubject } from "@/lib/summary";

export const metadata = {
  title: "لوحتي | Dashboard",
};

export default function DashboardPage() {
  return <DashboardView subjects={getSubjectSummaries()} totals={totalsBySubject()} />;
}
