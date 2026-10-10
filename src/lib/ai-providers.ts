/**
 * Multi-provider LLM registry.
 *
 * Every supported provider exposes an OpenAI-compatible
 * `POST {baseUrl}/chat/completions` endpoint, so a single code path serves
 * them all. Providers are ordered FREE-FIRST; the /api/ai route walks the
 * ordered list of *configured* providers and falls back automatically when a
 * provider errors, is rate-limited, or times out.
 *
 * No key is hardcoded: each provider reads its own environment variable.
 * When no provider is configured the endpoint degrades gracefully (501).
 */

export type AiProviderId =
  | "groq"
  | "gemini"
  | "cerebras"
  | "openrouter"
  | "mistral"
  | "together"
  | "ollama"
  | "openai"
  | "custom";

export type AiProvider = {
  id: AiProviderId;
  name: string;
  baseUrl: string;
  defaultModel: string;
  /** Environment variables that may hold the API key (first non-empty wins). */
  envKeys: string[];
  /** True when the provider has a usable free tier. */
  free: boolean;
  /** Some local servers (Ollama) need no key. */
  requiresKey: boolean;
  docsUrl: string;
  notes?: string;
};

/**
 * Ordered free-first. The order here IS the fallback order unless the operator
 * overrides it with AI_PROVIDER_ORDER.
 */
export const AI_PROVIDERS: AiProvider[] = [
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    envKeys: ["GROQ_API_KEY"],
    free: true,
    requiresKey: true,
    docsUrl: "https://console.groq.com/docs/openai",
    notes: "Fast OpenAI-compatible free tier.",
  },
  {
    id: "gemini",
    name: "Google Gemini (OpenAI-compatible)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    envKeys: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    free: true,
    requiresKey: true,
    docsUrl: "https://ai.google.dev/gemini-api/docs/openai",
    notes: "Generous free tier.",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    defaultModel: "llama-3.3-70b",
    envKeys: ["CEREBRAS_API_KEY"],
    free: true,
    requiresKey: true,
    docsUrl: "https://inference-docs.cerebras.ai/",
    notes: "Free tier, very low latency.",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    envKeys: ["OPENROUTER_API_KEY"],
    free: true,
    requiresKey: true,
    docsUrl: "https://openrouter.ai/docs",
    notes: "Aggregator; models with a :free suffix cost nothing.",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    envKeys: ["MISTRAL_API_KEY"],
    free: true,
    requiresKey: true,
    docsUrl: "https://docs.mistral.ai/",
    notes: "Free experiment tier.",
  },
  {
    id: "together",
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    envKeys: ["TOGETHER_API_KEY"],
    free: true,
    requiresKey: true,
    docsUrl: "https://docs.together.ai/",
    notes: "Has free endpoints.",
  },
  {
    id: "ollama",
    name: "Ollama (local)",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.1",
    envKeys: ["OLLAMA_API_KEY"],
    free: true,
    requiresKey: false,
    docsUrl: "https://github.com/ollama/ollama/blob/main/docs/openai.md",
    notes: "Runs on the operator's own machine/VPS; enable with AI_PROVIDER_ORDER including 'ollama'.",
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    envKeys: ["OPENAI_API_KEY"],
    free: false,
    requiresKey: true,
    docsUrl: "https://platform.openai.com/docs/api-reference",
    notes: "Paid.",
  },
  {
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    baseUrl: "",
    defaultModel: "gpt-4o-mini",
    envKeys: ["AI_API_KEY"],
    free: false,
    requiresKey: true,
    docsUrl: "https://platform.openai.com/docs/api-reference",
    notes:
      "Set AI_API_KEY + AI_API_BASE_URL (+ optional AI_MODEL) to target any OpenAI-compatible server.",
  },
];

export type ResolvedProvider = {
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
};

function envValue(
  env: Record<string, string | undefined>,
  names: string[],
): string | undefined {
  for (const name of names) {
    const value = env[name];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

/** Optional override of provider precedence, e.g. "gemini,groq". */
function orderedProviders(
  env: Record<string, string | undefined>,
): AiProvider[] {
  const override = (env.AI_PROVIDER_ORDER ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (override.length === 0) return AI_PROVIDERS;
  const rank = new Map(override.map((id, i) => [id, i]));
  return [...AI_PROVIDERS].sort((a, b) => {
    const ra = rank.has(a.id) ? (rank.get(a.id) as number) : 1000;
    const rb = rank.has(b.id) ? (rank.get(b.id) as number) : 1000;
    return ra - rb;
  });
}

/**
 * Resolve every configured provider, free-first, honoring AI_PROVIDER_ORDER.
 * `env` defaults to process.env so this stays pure and testable.
 */
export function resolveConfiguredProviders(
  env: Record<string, string | undefined> = process.env,
): ResolvedProvider[] {
  const globalModel = env.AI_MODEL?.trim();
  const out: ResolvedProvider[] = [];
  const seenBaseUrls = new Set<string>();

  for (const provider of orderedProviders(env)) {
    // Local providers (Ollama) can run without a key when explicitly enabled.
    const explicitlyEnabled = (env.AI_PROVIDER_ORDER ?? "")
      .split(",")
      .map((s) => s.trim())
      .includes(provider.id);

    const key = envValue(env, provider.envKeys);
    if (!key && !(provider.id === "ollama" && explicitlyEnabled)) continue;
    if (!key && provider.requiresKey) continue;

    let baseUrl = provider.baseUrl;
    let model = provider.defaultModel;

    if (provider.id === "custom") {
      baseUrl = env.AI_API_BASE_URL?.trim() || baseUrl;
      model = globalModel || env.AI_MODEL?.trim() || model;
      if (!baseUrl) continue; // a custom provider without a base URL is unusable
    }
    if (globalModel) model = globalModel;

    if (seenBaseUrls.has(baseUrl)) continue;
    seenBaseUrls.add(baseUrl);

    out.push({ provider, apiKey: key ?? "", baseUrl, model });
  }

  return out;
}

export function isAiConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return resolveConfiguredProviders(env).length > 0;
}
