"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  API_KEY_LINKS,
  API_KEYS_STORAGE,
  loadApiKeys,
  saveApiKeys,
  type ApiKeys,
} from "@/lib/api-keys";
import { Check, ExternalLink, Key, Trash2 } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKeys(loadApiKeys());
  }, []);

  const updateKey = (provider: keyof ApiKeys, value: string) => {
    setKeys((prev) => ({ ...prev, [provider]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveApiKeys(keys);
    setSaved(true);
    window.dispatchEvent(new Event("storage"));
    setTimeout(() => setSaved(false), 2500);
  };

  const clearKeys = () => {
    localStorage.removeItem(API_KEYS_STORAGE);
    setKeys({});
    setSaved(false);
    window.dispatchEvent(new Event("storage"));
  };

  const providers: Array<{
    id: keyof ApiKeys;
    name: string;
    desc: string;
    header: string;
  }> = [
    {
      id: "gemini",
      name: "Google Gemini",
      desc: "Primary reasoning model. Large context for full asset history.",
      header: "x-user-gemini-key",
    },
    {
      id: "groq",
      name: "Groq",
      desc: "Fast streaming for the live agent reasoning trace.",
      header: "x-user-groq-key",
    },
    {
      id: "mistral",
      name: "Mistral",
      desc: "Failover for log cleaning and structured extraction.",
      header: "x-user-mistral-key",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sage-900">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          API keys stay in your browser only. Shift Sage runs in demo mode without them.
        </p>
      </div>

      <Card className="mb-6 border-sage-200 bg-sage-50/50">
        <CardContent className="p-4 text-sm text-sage-900">
          <p>
            All three providers offer free tiers suitable for this demo. Leave keys blank to
            use cached plant history and pre-built responses for the demo fault.
          </p>
          <p className="mt-2">
            Keys are stored in <code className="rounded bg-white px-1 text-xs">localStorage</code>{" "}
            under <code className="rounded bg-white px-1 text-xs">{API_KEYS_STORAGE}</code> and
            sent to our server only as request headers. We never log or persist them.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {providers.map(({ id, name, desc, header }) => (
          <Card key={id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4 text-sage-600" />
                {name}
              </CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor={id}>API key</Label>
                <Input
                  id={id}
                  type="password"
                  placeholder="Paste your key here"
                  value={keys[id] ?? ""}
                  onChange={(e) => updateKey(id, e.target.value)}
                  className="mt-1.5 font-mono text-sm"
                  autoComplete="off"
                />
              </div>
              <a
                href={API_KEY_LINKS[id]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-sage-700 hover:underline"
              >
                Get a free key at {API_KEY_LINKS[id]}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <p className="text-xs text-muted-foreground">Sent as header: {header}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={handleSave} className="bg-sage-600 hover:bg-sage-700">
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            "Save keys"
          )}
        </Button>
        <Button variant="outline" onClick={clearKeys}>
          <Trash2 className="h-4 w-4" />
          Clear all keys
        </Button>
        <Button asChild variant="ghost">
          <Link href="/diagnose">Back to diagnose</Link>
        </Button>
      </div>
    </div>
  );
}
