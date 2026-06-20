export const API_KEYS_STORAGE = "shiftsage_api_keys";

export interface ApiKeys {
  gemini?: string;
  groq?: string;
  mistral?: string;
}

export const API_KEY_LINKS = {
  gemini: "https://aistudio.google.com/apikey",
  groq: "https://console.groq.com/keys",
  mistral: "https://console.mistral.ai/api-keys",
} as const;

export function loadApiKeys(): ApiKeys {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(API_KEYS_STORAGE);
    return raw ? (JSON.parse(raw) as ApiKeys) : {};
  } catch {
    return {};
  }
}

export function saveApiKeys(keys: ApiKeys): void {
  localStorage.setItem(API_KEYS_STORAGE, JSON.stringify(keys));
}

export function buildApiHeaders(keys?: ApiKeys): HeadersInit {
  const k = keys ?? loadApiKeys();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (k.gemini) headers["x-user-gemini-key"] = k.gemini;
  if (k.groq) headers["x-user-groq-key"] = k.groq;
  if (k.mistral) headers["x-user-mistral-key"] = k.mistral;
  return headers;
}

export function hasAnyApiKey(keys?: ApiKeys): boolean {
  const k = keys ?? loadApiKeys();
  return Boolean(k.gemini || k.groq || k.mistral);
}
