import { describe, it, expect } from "vitest";
import {
  AI_PROVIDERS,
  resolveConfiguredProviders,
  isAiConfigured,
} from "@/lib/ai-providers";

describe("AI provider registry", () => {
  it("lists providers in free-first order", () => {
    const firstPaidIndex = AI_PROVIDERS.findIndex((p) => !p.free);
    const lastFreeIndex = AI_PROVIDERS.map((p) => p.free).lastIndexOf(true);
    expect(firstPaidIndex).toBeGreaterThan(lastFreeIndex);
  });

  it("exposes at least three free providers", () => {
    expect(AI_PROVIDERS.filter((p) => p.free).length).toBeGreaterThanOrEqual(3);
  });

  it("has a unique env key mapping for every non-custom provider", () => {
    for (const provider of AI_PROVIDERS) {
      expect(provider.envKeys.length).toBeGreaterThan(0);
      if (provider.id !== "custom") {
        expect(provider.baseUrl).toMatch(/^https?:\/\//);
      }
    }
  });

  it("resolves nothing when no keys are configured", () => {
    expect(resolveConfiguredProviders({})).toEqual([]);
    expect(isAiConfigured({})).toBe(false);
  });

  it("resolves only providers that have a key, free-first", () => {
    const resolved = resolveConfiguredProviders({
      OPENAI_API_KEY: "sk-paid",
      GROQ_API_KEY: "gsk-free",
    });
    expect(resolved.map((r) => r.provider.id)).toEqual(["groq", "openai"]);
    expect(resolved[0].provider.free).toBe(true);
    expect(resolved[1].provider.free).toBe(false);
  });

  it("honors AI_PROVIDER_ORDER overrides", () => {
    const resolved = resolveConfiguredProviders({
      GROQ_API_KEY: "a",
      GEMINI_API_KEY: "b",
      AI_PROVIDER_ORDER: "gemini,groq",
    });
    expect(resolved.map((r) => r.provider.id)).toEqual(["gemini", "groq"]);
  });

  it("supports a custom OpenAI-compatible endpoint with a base URL", () => {
    const resolved = resolveConfiguredProviders({
      AI_API_KEY: "k",
      AI_API_BASE_URL: "https://example.test/v1",
      AI_MODEL: "my-model",
      AI_PROVIDER_ORDER: "custom",
    });
    const custom = resolved.find((r) => r.provider.id === "custom");
    expect(custom).toBeTruthy();
    expect(custom?.baseUrl).toBe("https://example.test/v1");
    expect(custom?.model).toBe("my-model");
  });

  it("drops a custom provider that has a key but no base URL", () => {
    const resolved = resolveConfiguredProviders({
      AI_API_KEY: "k",
      AI_PROVIDER_ORDER: "custom",
    });
    expect(resolved.find((r) => r.provider.id === "custom")).toBeUndefined();
  });

  it("allows local Ollama without a key only when explicitly enabled", () => {
    expect(
      resolveConfiguredProviders({}).find((r) => r.provider.id === "ollama"),
    ).toBeUndefined();
    const resolved = resolveConfiguredProviders({ AI_PROVIDER_ORDER: "ollama" });
    expect(resolved.find((r) => r.provider.id === "ollama")).toBeTruthy();
  });

  it("applies a global AI_MODEL override to every provider", () => {
    const resolved = resolveConfiguredProviders({
      GROQ_API_KEY: "a",
      GEMINI_API_KEY: "b",
      AI_MODEL: "shared-model",
    });
    expect(resolved.every((r) => r.model === "shared-model")).toBe(true);
  });
});
