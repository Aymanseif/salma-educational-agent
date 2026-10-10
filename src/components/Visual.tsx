"use client";

import { useLocale } from "@/lib/locale";

/**
 * Inline SVG learning visuals. All diagrams are original creations
 * (facts are general public knowledge / official title metadata).
 */

function HistoryTimeline() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const eras = [
    {
      years: ar ? "≈3100 ق.م – 332 ق.م" : "c. 3100 BCE – 332 BCE",
      name: ar ? "العصر الفرعوني" : "Pharaonic era",
      color: "#f59e0b",
    },
    {
      years: ar ? "332 ق.م – 640 م" : "332 BCE – 640 CE",
      name: ar ? "اليوناني الروماني" : "Greco-Roman era",
      color: "#10b981",
    },
    {
      years: ar ? "640 – 1517 م" : "640 – 1517 CE",
      name: ar ? "العصر الإسلامي" : "Islamic era",
      color: "#6366f1",
    },
    {
      years: ar ? "1517 م – اليوم" : "1517 CE – today",
      name: ar ? "العثماني والحديث" : "Ottoman & modern",
      color: "#ec4899",
    },
  ];
  const total = 4;
  const box = 100 / total;
  return (
    <svg viewBox="0 0 800 180" className="h-auto w-full" role="img">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>
      <line
        x1="10"
        y1="80"
        x2="790"
        y2="80"
        stroke="#94a3b8"
        strokeWidth="3"
        markerEnd="url(#arrowhead)"
      />
      {eras.map((era, i) => {
        const x = 10 + i * box * 7.8;
        const w = box * 7.3;
        return (
          <g key={i}>
            <rect
              x={x}
              y={36}
              width={w}
              height={88}
              rx={12}
              fill={era.color}
              opacity={0.9}
            />
            <text
              x={x + w / 2}
              y={66}
              textAnchor="middle"
              fill="#fff"
              fontSize="15"
              fontWeight="700"
            >
              {era.name}
            </text>
            <text
              x={x + w / 2}
              y={92}
              textAnchor="middle"
              fill="#fff"
              fontSize="12"
            >
              {era.years}
            </text>
            <line
              x1={x + w / 2}
              y1={36}
              x2={x + w / 2}
              y2={80}
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          </g>
        );
      })}
      <text x={400} y={170} textAnchor="middle" fontSize="13" fill="#475569">
        {ar
          ? "الاستمرارية: ظلت الدولة المصرية تتجدد عبر العصور"
          : "Continuity: the Egyptian state kept renewing itself across the ages"}
      </text>
    </svg>
  );
}

function PsychologyApproaches() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  return (
    <svg viewBox="0 0 800 200" className="h-auto w-full" role="img">
      <rect x="20" y="20" width="220" height="60" rx="12" fill="#e0e7ff" />
      <text x="130" y="48" textAnchor="middle" fontSize="15" fontWeight="700" fill="#312e81">
        {ar ? "الفلسفة" : "Philosophy"}
      </text>
      <text x="130" y="66" textAnchor="middle" fontSize="12" fill="#4338ca">
        {ar ? "تأمل في العقل والسلوك" : "Reflection on mind & behavior"}
      </text>
      <line x1="240" y1="50" x2="300" y2="50" stroke="#94a3b8" strokeWidth="3" />
      <rect x="300" y="20" width="240" height="60" rx="12" fill="#c7d2fe" />
      <text x="420" y="48" textAnchor="middle" fontSize="15" fontWeight="700" fill="#312e81">
        {ar ? "معمل فونت — 1879" : "Wundt's lab — 1879"}
      </text>
      <text x="420" y="66" textAnchor="middle" fontSize="12" fill="#4338ca">
        {ar ? "علم نفس تجريبي مستقل" : "Independent experimental psychology"}
      </text>
      <line x1="540" y1="50" x2="600" y2="50" stroke="#94a3b8" strokeWidth="3" />
      <rect x="600" y="20" width="180" height="60" rx="12" fill="#f5d0fe" />
      <text x="690" y="48" textAnchor="middle" fontSize="15" fontWeight="700" fill="#701a75">
        {ar ? "مناهج علمية" : "Scientific methods"}
      </text>
      <text x="690" y="66" textAnchor="middle" fontSize="12" fill="#86198f">
        {ar ? "ملاحظة وتجربة" : "Observation & experiment"}
      </text>
      {[
        { x: 130, y: 130, label: ar ? "الفهم" : "Understand" },
        { x: 320, y: 150, label: ar ? "التفسير" : "Explain" },
        { x: 500, y: 150, label: ar ? "التنبؤ" : "Predict" },
        { x: 690, y: 130, label: ar ? "الضبط والتوجيه" : "Control & direct" },
      ].map((g, i) => (
        <g key={i}>
          <circle cx={g.x} cy={160} r="4" fill="#6366f1" />
          <text x={g.x} y={180} textAnchor="middle" fontSize="13" fontWeight="600" fill="#334155">
            {g.label}
          </text>
        </g>
      ))}
      <text x="400" y="195" textAnchor="middle" fontSize="12" fill="#475569">
        {ar
          ? "أهداف علم النفس: الفهم، التفسير، التنبؤ، الضبط"
          : "Goals of psychology: understand, explain, predict, control"}
      </text>
    </svg>
  );
}

function ArabicSentenceTree() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  return (
    <svg viewBox="0 0 800 210" className="h-auto w-full" role="img">
      <text x="400" y="34" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0f172a">
        {ar ? "جملة: «العلمُ نورٌ»" : "Sentence: “Knowledge is light”"}
      </text>
      <line x1="400" y1="48" x2="240" y2="96" stroke="#94a3b8" strokeWidth="2" />
      <line x1="400" y1="48" x2="560" y2="96" stroke="#94a3b8" strokeWidth="2" />
      <rect x="120" y="96" width="240" height="52" rx="12" fill="#ede9fe" />
      <text x="240" y="120" textAnchor="middle" fontSize="18" fontWeight="700" fill="#4c1d95">
        {ar ? "مبتدأ" : "Subject (mubtada)"}
      </text>
      <text x="240" y="138" textAnchor="middle" fontSize="15" fill="#6d28d9">
        {ar ? "العلمُ — مرفوع" : "al-ʿilm — nominative"}
      </text>
      <rect x="440" y="96" width="240" height="52" rx="12" fill="#dcfce7" />
      <text x="560" y="120" textAnchor="middle" fontSize="18" fontWeight="700" fill="#166534">
        {ar ? "خبر" : "Predicate (khabar)"}
      </text>
      <text x="560" y="138" textAnchor="middle" fontSize="15" fill="#15803d">
        {ar ? "نورٌ — مرفوع" : "nūrun — nominative"}
      </text>
      <rect x="280" y="176" width="240" height="30" rx="8" fill="#e0f2fe" />
      <text x="400" y="196" textAnchor="middle" fontSize="13" fontWeight="600" fill="#0c4a6e">
        {ar
          ? "جملة اسمية: مبتدأ + خبر — وتُفيد الثبوت"
          : "Nominal sentence: subject + predicate — expresses permanence"}
      </text>
    </svg>
  );
}

export default function Visual({ visualId }: { visualId: string }) {
  switch (visualId) {
    case "history-timeline":
      return <HistoryTimeline />;
    case "psych-approaches":
      return <PsychologyApproaches />;
    case "arabic-sentence-tree":
      return <ArabicSentenceTree />;
    default:
      return null;
  }
}