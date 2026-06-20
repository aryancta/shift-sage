"use client";

import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { hasAnyApiKey } from "@/lib/api-keys";

export function ApiKeyBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setVisible(!hasAnyApiKey());
    const handler = () => setVisible(!hasAnyApiKey());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Running in demo mode with cached plant history.{" "}
            <Link href="/settings" className="font-medium underline underline-offset-2">
              Add your Gemini, Groq, or Mistral API key
            </Link>{" "}
            in Settings to enable live AI diagnosis.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-1 text-amber-700 hover:bg-amber-100"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
