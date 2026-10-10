/**
 * Browser-compatible text-to-speech wrapper around the Web Speech API.
 * Pure browser API — no OS-specific playback commands.
 */

export type SpeakOptions = {
  rate?: number;
  pitch?: number;
  lang?: string;
  onEnd?: () => void;
};

export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

function normalizeArabicLang(lang?: string): string {
  if (!lang) return "ar-SA";
  return lang;
}

/**
 * Speak `text` in the given language. Returns a cancel function.
 */
export function speak(
  text: string,
  options: SpeakOptions = {},
): () => void {
  if (!isSpeechSupported()) return () => undefined;
  const synth = window.speechSynthesis;
  const utterance = new window.SpeechSynthesisUtterance(text);
  const lang = options.lang
    ? /^ar/.test(options.lang)
      ? normalizeArabicLang(options.lang)
      : options.lang
    : "ar-SA";
  utterance.lang = lang;
  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = options.pitch ?? 1;
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onEnd?.();
  synth.cancel();
  synth.speak(utterance);
  return () => {
    try {
      synth.cancel();
    } catch {
      /* ignore */
    }
  };
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Best-effort pick of a language tag that the browser may support.
 * We select a common voice for the language if available.
 */
export function pickVoiceForLang(lang: string): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const primary = voices.find((v) => v.lang.replace("_", "-") === lang);
  if (primary) return primary;
  const prefix = lang.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix.toLowerCase())) ??
    null
  );
}