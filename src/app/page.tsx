import HomeDashboard from "@/components/HomeDashboard";
import { getSubjectSummaries, totalsBySubject } from "@/lib/summary";

export default function HomePage() {
  const subjects = getSubjectSummaries();
  const totals = totalsBySubject();
  return <HomeDashboard subjects={subjects} totals={totals} />;
}
