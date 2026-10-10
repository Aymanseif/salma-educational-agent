import SubjectsGrid from "@/components/SubjectsGrid";
import { getSubjectSummaries } from "@/lib/summary";

export const metadata = {
  title: "المواد | Subjects",
};

export default function SubjectsPage() {
  return <SubjectsGrid subjects={getSubjectSummaries()} />;
}
