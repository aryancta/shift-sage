# Shift Sage

**The retiring expert that never clocks out.** Instant, cited fixes from your plant's own maintenance history.

We built Shift Sage for the $1,000 Industrial AI Hackathon. It targets a problem every small-to-mid manufacturer knows: when the night-shift tech hits an unfamiliar fault, the fix that saves four hours of downtime lives in someone's head, not in any searchable system.

![Shift Sage architecture diagram](/hero-diagram.svg)

## Quick demo

1. Open the app and click **Get started**
2. Click **Load demo fault** or paste: `packing line 3 dead, swapped prox sensor and relay, PLC looks fine, still nothing`
3. Hit **Diagnose** and watch the agent trace search plant history
4. See the ranked plan - step 1 cites Frank Martinez's undocumented east guard panel bypass from WO-2023-0847
5. Click **Generate work order and handover** to close the loop
6. Open the **Dashboard** to see Frank flagged at 95% retirement risk with 4 exclusive PL3 workarounds

No API keys required for the demo path. Add Gemini, Groq, or Mistral keys in Settings for live AI.

## Setup

### Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker

```bash
docker build -t app .
docker run -p 3000:3000 app
```

Open [http://localhost:3000](http://localhost:3000).

### API keys (optional)

Visit `/settings` to paste free-tier keys:

| Provider | Use | Sign up |
|----------|-----|---------|
| Google Gemini | Primary diagnosis over full asset history | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Groq | Fast streaming reasoning trace | [console.groq.com/keys](https://console.groq.com/keys) |
| Mistral | Failover for log cleaning | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) |

Keys are stored in `localStorage` under `shiftsage_api_keys` and sent as request headers only.

## Tech stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui-style components
- **Data:** SQLite (better-sqlite3) with 18 seeded work orders across 8 assets
- **Retrieval:** Keyword search plus asset alias matching (no heavy vector DB)
- **AI:** Gemini 2.5 Flash (primary), Groq Llama 3.3 70B (streaming trace), Mistral (failover)
- **Deploy:** Docker standalone output on port 3000

## Architecture

```
Technician fault input
        |
        v
  Asset detection + keyword retrieval (SQLite)
        |
        v
  Live reasoning trace (SSE stream)
        |
        v
  LLM diagnosis (grounded to retrieved WOs only)
        |
        +---> Cited repair plan + workaround finder
        +---> Auto work order draft
        +---> Shift handover summary
        |
        v
  Manager dashboard (recurring failures, retirement risk)
```

Every recommendation must cite a work order ID from retrieved history. If history is too thin, Shift Sage refuses to guess.

## Features

- **Instant cited diagnosis** - ranked repair steps linked to specific past work orders
- **Hidden workaround finder** - surfaces tribal knowledge from technician notes
- **Live agent reasoning trace** - visible search, match, and rule-out steps
- **Auto work order and shift handover** - cleans noisy input into CMMS-ready output
- **Voice fault capture** - hands-free input via browser speech recognition
- **Manager knowledge-risk dashboard** - recurring failures and retirement concentration

## Participant

Aryan Choudhary - aryancta@gmail.com

## Credits

- Synthetic dataset inspired by MaintNet and Atlas CMMS log schemas
- Research references: Dovient tribal knowledge report, Oxmaint CMMS guide, arXiv 2511.05311 (log cleaning agents), MDPI 2025 multi-agent PdM framework
