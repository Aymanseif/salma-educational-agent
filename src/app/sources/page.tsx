import SourcesView from "@/components/SourcesView";
import { auditReport, sourceInventory, teacherRegistry } from "@/lib/data";

export const metadata = {
  title: "سجل المصادر | Source registry",
};

export default function SourcesPage() {
  return (
    <SourcesView
      sources={sourceInventory.sources}
      candidates={sourceInventory.teacherResourceCandidates}
      teachers={teacherRegistry.teachers}
      checkedOn={sourceInventory.checkedOn}
      audit={auditReport}
    />
  );
}
