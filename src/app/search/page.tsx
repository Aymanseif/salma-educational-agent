import SearchClient from "@/components/SearchClient";
import { buildFlatLessonItems } from "@/lib/summary";

export const metadata = {
  title: "البحث في المنهج | Search",
};

export default function SearchPage() {
  return <SearchClient items={buildFlatLessonItems()} />;
}
