/**
 * Shared content types for the Salma Educational Agent.
 * All curriculum content lives in /content and must conform to these shapes.
 */

export type Locale = "ar" | "en";

export type Bi = { ar: string; en: string };

export type VerificationStatus =
  | "VERIFIED"
  | "PARTIALLY_VERIFIED"
  | "SOURCE_MISSING"
  | "NOT_YET_IMPORTED";

export type ContentStatus =
  | VerificationStatus
  | "AI_GENERATED"
  | "OFFICIAL"
  | "TEACHER"
  | "MIXED";

export type LessonSection = {
  type:
    | "heading"
    | "paragraph"
    | "list"
    | "example"
    | "keypoint"
    | "quote"
    | "visual";
  ar?: string;
  en?: string;
  items?: { ar: string; en: string }[];
  visualId?: string;
};

export type QuizQuestion = {
  id: string;
  question: Bi;
  options: Bi[];
  correctIndex: number;
  explanation: Bi;
};

export type Lesson = {
  id: string;
  order?: number;
  title: Bi;
  titleStatus?: VerificationStatus;
  titleNote?: Bi;
  summary?: Bi;
  contentStatus?: ContentStatus;
  contentNote?: Bi;
  sourceIds?: string[];
  audio?: { ar?: string | null; en?: string | null };
  visual?: string | null;
  sections?: LessonSection[];
  quizzes?: QuizQuestion[];
};

export type Unit = {
  id: string;
  order: number;
  title: Bi;
  titleStatus?: VerificationStatus;
  titleNote?: Bi;
  description?: Bi;
  sourceId?: string;
  lessons: Lesson[];
};

export type SupplementQuiz = { id: string; questions: QuizQuestion[] };

export type Supplement = {
  id: string;
  kind: string;
  origin: ContentStatus;
  label: Bi;
  title: Bi;
  text?: Bi;
  vocabulary?: { en: string; ar: string; ipa: string }[];
  audioLang?: string;
  quiz?: SupplementQuiz;
};

export type SubjectContent = {
  id: string;
  units: Unit[];
  unitsNotImportedNote?: Bi;
  supplements?: Supplement[];
};

/* ---------------- Registry ---------------- */

export type CurriculumRegistry = {
  academicYear: string;
  grade: { code: string; ar: string; en: string };
  track: { code: string; ar: string; en: string };
  verifiedOn: string;
  verificationStatus: VerificationStatus;
  verificationNotes: Bi;
  subjects: Array<{
    id: string;
    code: string;
    arName: string;
    enName: string;
    category: Bi;
    officialPage: string;
    status: VerificationStatus;
    unitSource?: Bi;
  }>;
  additionalOfficialResources: Array<{
    id: string;
    url: string;
    pdf?: string;
    arName: string;
    enName: string;
  }>;
};

export type SourceInventory = {
  checkedOn: string;
  sources: Array<{
    id: string;
    type: string;
    title: Bi;
    url: string;
    publisher?: string;
    status: VerificationStatus;
    coverage?: Bi;
    publication?: string;
    checkedHttp?: number;
    sizeBytes?: number;
    reuse?: string;
    accessed?: string;
  }>;
  teacherResourceCandidates: Array<{
    teacherId: string;
    candidate: {
      platform: string;
      channel: string;
      url: string;
      subject?: string;
      coverage?: string;
      attributionSubstantiated: boolean;
      publiclyAccessible?: boolean;
      reusePermitted?: string;
      note?: string;
    } | null;
    note?: string;
  }>;
};

export type Teacher = {
  id: string;
  subjectId: string;
  subject: Bi;
  nameArabic: string;
  nameLatin: string;
  verification: "UNVERIFIED_IDENTITY" | "VERIFIED";
  verificationNote: Bi;
  /**
   * Real publicly accessible voice/video of the teacher (today: a YouTube
   * lecture found by web research). Null/absent when none could be confirmed.
   */
  voiceUrl?: string | null;
  candidateResources: Array<{
    url: string;
    platform: string;
    label: string;
    attributionSubstantiated: boolean;
    kind?: "channel" | "video" | "page";
    note?: string;
  }>;
};

export type TeacherRegistry = {
  student: {
    fullNameArabic: string;
    fullNameLatin: string;
    track: { code: string; ar: string; en: string };
    grade: string;
  };
  teachers: Teacher[];
};