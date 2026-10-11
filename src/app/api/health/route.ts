import { NextResponse } from "next/server";
import { curriculum, totalLessonCount } from "@/lib/data";
import { resolveConfiguredProviders } from "@/lib/ai-providers";
import { resolveOtpConfig } from "@/lib/auth/otp";
import { APP_VERSION, RELEASED_ON, VERSION_LABEL } from "@/lib/version";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const providers = resolveConfiguredProviders();
  const otp = resolveOtpConfig();
  return NextResponse.json({
    ok: true,
    app: "salma-educational-agent",
    version: APP_VERSION,
    versionLabel: VERSION_LABEL,
    releasedOn: RELEASED_ON,
    curriculum: {
      academicYear: curriculum.academicYear,
      grade: curriculum.grade.code,
      track: curriculum.track.code,
      status: curriculum.verificationStatus,
      verifiedOn: curriculum.verifiedOn,
      subjects: curriculum.subjects.length,
      totalLessons: totalLessonCount(),
    },
    aiExplanationService: providers.length > 0 ? "configured" : "not_configured",
    aiProviders: providers.map((p) => ({
      id: p.provider.id,
      free: p.provider.free,
      model: p.model,
    })),
    auth: {
      configured: otp.configured,
      provider: otp.provider,
      devMode: otp.devMode,
    },
  });
}
