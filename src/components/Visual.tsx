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

function ArabicWordBalance() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  return (
    <svg viewBox="0 0 800 200" className="h-auto w-full" role="img">
      <text x="400" y="30" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a">
        {ar ? "أثر الكلمة: ميزان اللسان" : "The impact of the word: the tongue's balance"}
      </text>
      <line x1="400" y1="70" x2="400" y2="150" stroke="#64748b" strokeWidth="4" />
      <line x1="180" y1="80" x2="620" y2="80" stroke="#64748b" strokeWidth="4" />
      <rect x="90" y="52" width="200" height="56" rx="12" fill="#dcfce7" />
      <text x="190" y="76" textAnchor="middle" fontSize="14" fontWeight="700" fill="#166534">
        {ar ? "كلمة طيبة" : "A kind word"}
      </text>
      <text x="190" y="96" textAnchor="middle" fontSize="12" fill="#15803d">
        {ar ? "تبني وتصلح" : "builds and heals"}
      </text>
      <rect x="510" y="52" width="200" height="56" rx="12" fill="#fee2e2" />
      <text x="610" y="76" textAnchor="middle" fontSize="14" fontWeight="700" fill="#991b1b">
        {ar ? "كلمة جارحة" : "A harmful word"}
      </text>
      <text x="610" y="96" textAnchor="middle" fontSize="12" fill="#b91c1c">
        {ar ? "تهدم ولا تُنسى" : "destroys and lingers"}
      </text>
      <text x="400" y="180" textAnchor="middle" fontSize="13" fill="#475569">
        {ar ? "فكر قبل أن تتكلم: للكلمة وزن." : "Think before you speak: a word carries weight."}
      </text>
    </svg>
  );
}

function RightsUniversality() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  return (
    <svg viewBox="0 0 800 200" className="h-auto w-full" role="img">
      <text x="400" y="30" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a">
        {ar ? "حقوق الإنسان: العالمية والخصوصية" : "Human rights: universality and particularity"}
      </text>
      <circle cx="260" cy="110" r="58" fill="#e0e7ff" />
      <text x="260" y="104" textAnchor="middle" fontSize="14" fontWeight="700" fill="#3730a3">
        {ar ? "عالمية" : "Universal"}
      </text>
      <text x="260" y="124" textAnchor="middle" fontSize="11" fill="#4338ca">
        {ar ? "كرامة لكل إنسان" : "dignity for all"}
      </text>
      <circle cx="540" cy="110" r="58" fill="#dcfce7" />
      <text x="540" y="104" textAnchor="middle" fontSize="14" fontWeight="700" fill="#166534">
        {ar ? "خصوصية" : "Particular"}
      </text>
      <text x="540" y="124" textAnchor="middle" fontSize="11" fill="#15803d">
        {ar ? "ثقافة ومجتمع" : "culture & society"}
      </text>
      <rect x="352" y="86" width="96" height="48" rx="10" fill="#fef3c7" />
      <text x="400" y="106" textAnchor="middle" fontSize="12" fontWeight="700" fill="#92400e">
        {ar ? "حوار" : "Dialogue"}
      </text>
      <text x="400" y="124" textAnchor="middle" fontSize="11" fill="#b45309">
        {ar ? "توازن" : "balance"}
      </text>
      <text x="400" y="185" textAnchor="middle" fontSize="13" fill="#475569">
        {ar ? "الحقوق أساس مشترك، وتُطبَّق بمراعاة الخصوصية." : "Rights share a common base, applied with respect for context."}
      </text>
    </svg>
  );
}

function AttentionPerception() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  return (
    <svg viewBox="0 0 800 190" className="h-auto w-full" role="img">
      <text x="400" y="28" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a">
        {ar ? "من الانتباه إلى الإدراك" : "From attention to perception"}
      </text>
      {[
        { x: 80, label: ar ? "مثيرات" : "Stimuli", fill: "#e0e7ff", ink: "#3730a3" },
        { x: 300, label: ar ? "انتباه" : "Attention", fill: "#c7d2fe", ink: "#312e81" },
        { x: 520, label: ar ? "إدراك" : "Perception", fill: "#a5b4fc", ink: "#1e1b4b" },
      ].map((s, i) => (
        <g key={i}>
          <rect x={s.x} y="70" width="180" height="58" rx="12" fill={s.fill} />
          <text x={s.x + 90} y="104" textAnchor="middle" fontSize="14" fontWeight="700" fill={s.ink}>
            {s.label}
          </text>
        </g>
      ))}
      <line x1="260" y1="99" x2="300" y2="99" stroke="#94a3b8" strokeWidth="3" markerEnd="url(#arrowhead)" />
      <line x1="480" y1="99" x2="520" y2="99" stroke="#94a3b8" strokeWidth="3" markerEnd="url(#arrowhead)" />
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>
      <text x="400" y="170" textAnchor="middle" fontSize="13" fill="#475569">
        {ar ? "ننتبه لجزء من المثيرات، فيتشكل إدراكنا وِفق خبراتنا." : "We attend to part of the stimuli, so perception forms through experience."}
      </text>
    </svg>
  );
}

function MemoryStages() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  return (
    <svg viewBox="0 0 800 190" className="h-auto w-full" role="img">
      <text x="400" y="28" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a">
        {ar ? "مراحل الذاكرة" : "Stages of memory"}
      </text>
      {[
        { x: 60, label: ar ? "تشفير" : "Encoding", fill: "#dcfce7", ink: "#166534" },
        { x: 300, label: ar ? "تخزين" : "Storage", fill: "#dbeafe", ink: "#1e40af" },
        { x: 540, label: ar ? "استرجاع" : "Retrieval", fill: "#fce7f3", ink: "#9d174d" },
      ].map((s, i) => (
        <g key={i}>
          <rect x={s.x} y="70" width="180" height="58" rx="12" fill={s.fill} />
          <text x={s.x + 90} y="104" textAnchor="middle" fontSize="14" fontWeight="700" fill={s.ink}>
            {s.label}
          </text>
          {i < 2 && (
            <line x1={s.x + 180} y1="99" x2={s.x + 240} y2="99" stroke="#94a3b8" strokeWidth="3" markerEnd="url(#arrowhead)" />
          )}
        </g>
      ))}
      <text x="400" y="170" textAnchor="middle" fontSize="13" fill="#475569">
        {ar ? "النسيان غالبًا خلل في التشفير أو الاسترجاع، لا محوٌ كامل." : "Forgetting is often a lapse in encoding or retrieval, not full erasure."}
      </text>
    </svg>
  );
}

function AdolescenceStages() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  return (
    <svg viewBox="0 0 800 190" className="h-auto w-full" role="img">
      <text x="400" y="28" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a">
        {ar ? "النمو عبر المراحل" : "Development across stages"}
      </text>
      <line x1="60" y1="105" x2="740" y2="105" stroke="#94a3b8" strokeWidth="3" markerEnd="url(#arrowhead)" />
      {[
        { x: 120, label: ar ? "الطفولة" : "Childhood", fill: "#dbeafe", ink: "#1e40af" },
        { x: 400, label: ar ? "المراهقة" : "Adolescence", fill: "#fef3c7", ink: "#92400e" },
        { x: 660, label: ar ? "الرشد" : "Adulthood", fill: "#dcfce7", ink: "#166534" },
      ].map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy="105" r="10" fill={s.fill} stroke={s.ink} strokeWidth="2" />
          <rect x={s.x - 80} y="52" width="160" height="34" rx="10" fill={s.fill} />
          <text x={s.x} y="74" textAnchor="middle" fontSize="13" fontWeight="700" fill={s.ink}>
            {s.label}
          </text>
        </g>
      ))}
      <text x="400" y="175" textAnchor="middle" fontSize="13" fill="#475569">
        {ar ? "النمو عملية مستمرة: تغيرات جسمية ومعرفية وانفعالية واجتماعية." : "Development is continuous: physical, cognitive, emotional, and social change."}
      </text>
    </svg>
  );
}

function OccupationResistance() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  return (
    <svg viewBox="0 0 800 190" className="h-auto w-full" role="img">
      <text x="400" y="28" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a">
        {ar ? "الاحتلال ← الصمود ← الاستقلال" : "Occupation → Steadfastness → Independence"}
      </text>
      {[
        { x: 60, label: ar ? "سياسات الاحتلال" : "Occupation policies", fill: "#fee2e2", ink: "#991b1b" },
        { x: 300, label: ar ? "صمود ومقاومة" : "Steadfastness", fill: "#fef3c7", ink: "#92400e" },
        { x: 540, label: ar ? "استقلال وبناء" : "Independence", fill: "#dcfce7", ink: "#166534" },
      ].map((s, i) => (
        <g key={i}>
          <rect x={s.x} y="70" width="180" height="58" rx="12" fill={s.fill} />
          <text x={s.x + 90} y="104" textAnchor="middle" fontSize="13" fontWeight="700" fill={s.ink}>
            {s.label}
          </text>
          {i < 2 && (
            <line x1={s.x + 180} y1="99" x2={s.x + 240} y2="99" stroke="#94a3b8" strokeWidth="3" markerEnd="url(#arrowhead)" />
          )}
        </g>
      ))}
      <text x="400" y="170" textAnchor="middle" fontSize="13" fill="#475569">
        {ar ? "المقاومة الوطنية حلقة تربط رفض الاحتلال بالتحرر وبناء الدولة." : "National resistance links rejection of occupation to liberation and state-building."}
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
    case "arabic-word-balance":
      return <ArabicWordBalance />;
    case "rights-universality":
      return <RightsUniversality />;
    case "attention-perception":
      return <AttentionPerception />;
    case "memory-stages":
      return <MemoryStages />;
    case "adolescence-stages":
      return <AdolescenceStages />;
    case "occupation-resistance":
      return <OccupationResistance />;
    default:
      return null;
  }
}