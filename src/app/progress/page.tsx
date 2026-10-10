import ProgressView from "@/components/ProgressView";
import { getSubjectSummaries, totalsBySubject } from "@/lib/summary";
import { countContentStatuses } from "@/lib/data";

export const metadata = {
  title: "تقدمي | My Progress",
};

export default function ProgressPage() {
  return (
    <ProgressView
      subjects={getSubjectSummaries()}
      totals={totalsBySubject()}
      coverage={countContentStatuses()}
    />
  );
}
