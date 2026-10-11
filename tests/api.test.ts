import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST, GET } from "@/app/api/ai/route";
import { GET as healthGET } from "@/app/api/health/route";
import { getLesson } from "@/lib/data";

const VALID_BODY = {
  subjectId: "arabic",
  lessonId: "ar-u1-l1",
  question: "اشرح الفكرة ببساطة",
  locale: "ar" as const,
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/ai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ENV_KEYS = [
  "AI_API_KEY",
  "AI_API_BASE_URL",
  "AI_MODEL",
  "AI_PROVIDER_ORDER",
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
  "CEREBRAS_API_KEY",
  "OPENROUTER_API_KEY",
  "MISTRAL_API_KEY",
  "TOGETHER_API_KEY",
  "OPENAI_API_KEY",
  "OLLAMA_API_KEY",
];

describe("/api/ai", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });
  afterEach(() => {
    vi.restoreAllMocks();
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("returns a graceful 501 when no provider is configured", async () => {
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(501);
    const json = await response.json();
    expect(json.available).toBe(false);
    expect(json.error).toBe("ai_not_configured");
    expect(Array.isArray(json.providers)).toBe(true);
  });

  it("returns 400 on missing fields", async () => {
    const response = await POST(makeRequest({ subjectId: "arabic" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("missing_fields");
  });

  it("returns 400 on invalid JSON", async () => {
    const request = new Request("http://localhost/api/ai", {
      method: "POST",
      body: "not-json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 404 for a lesson that is not in the verified registry", async () => {
    process.env.GROQ_API_KEY = "test";
    const response = await POST(
      makeRequest({ ...VALID_BODY, lessonId: "does-not-exist" }),
    );
    expect(response.status).toBe(404);
  });

  it("uses a configured free provider and returns the explanation", async () => {
    process.env.GROQ_API_KEY = "test-free-key";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ choices: [{ message: { content: "شرح تجريبي" } }] }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.text).toBe("شرح تجريبي");
    expect(json.provider).toBe("groq");
    expect(json.free).toBe(true);
    expect(json.label).toBe("AI_GENERATED");
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("api.groq.com");
  });

  it("grounds the prompt in the named lesson and injects curated guidance", async () => {
    process.env.GROQ_API_KEY = "test-free-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "شرح" } }] }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const response = await POST(makeRequest(VALID_BODY));
    const json = await response.json();
    expect(json.grounded).toBe(true);
    expect(json.guidanceVersion).toBeGreaterThan(0);

    const init = fetchMock.mock.calls[0][1];
    const payload = JSON.parse(String(init?.body));
    const system = payload.messages[0].content as string;
    const user = payload.messages[1].content as string;

    const lesson = getLesson("arabic", "ar-u1-l1");
    expect(lesson).not.toBeNull();
    expect(user).toContain(lesson!.lesson.title.en);
    expect(system).toContain("AI-generated");
    expect(system).toContain("قواعد إضافية ملزمة");
  });

  it("falls back to the next provider when the first fails", async () => {
    process.env.GROQ_API_KEY = "a";
    process.env.GEMINI_API_KEY = "b";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ choices: [{ message: { content: "from gemini" } }] }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.provider).toBe("gemini");
    expect(json.text).toBe("from gemini");
    expect(json.attempts[0]).toMatchObject({ id: "groq", error: "upstream_429" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns 502 when every provider fails", async () => {
    process.env.GROQ_API_KEY = "a";
    process.env.GEMINI_API_KEY = "b";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(502);
    const json = await response.json();
    expect(json.error).toBe("all_providers_failed");
    expect(json.attempts).toHaveLength(2);
  });

  it("reports provider status via GET", async () => {
    process.env.GROQ_API_KEY = "a";
    const response = GET();
    const json = await response.json();
    expect(json.available).toBe(true);
    expect(json.order[0].id).toBe("groq");
    expect(json.freeProviders).toContain("groq");
    expect(json.guidanceVersion).toBeGreaterThan(0);
  });
});

describe("/api/health", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("reports ok and curriculum metadata", async () => {
    const response = healthGET();
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.curriculum.track).toBe("arts-humanities");
    expect(json.curriculum.subjects).toBe(4);
    expect(json.aiExplanationService).toBe("not_configured");
  });

  it("reports configured providers when keys are present", async () => {
    process.env.GROQ_API_KEY = "a";
    const json = await healthGET().json();
    expect(json.aiExplanationService).toBe("configured");
    expect(json.aiProviders[0].id).toBe("groq");
  });
});
