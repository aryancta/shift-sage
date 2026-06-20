import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Search,
  Shield,
  Wrench,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Cited diagnosis",
    desc: "Every repair step links to the exact work order it came from. No hallucinated fixes.",
  },
  {
    icon: Zap,
    title: "Hidden workarounds",
    desc: "Surfaces tribal knowledge buried in technician notes that never made it into the manual.",
  },
  {
    icon: Clock,
    title: "Shift handover",
    desc: "Auto-drafts cleaned work orders and plain-language handover notes for the next crew.",
  },
  {
    icon: Shield,
    title: "Retirement risk",
    desc: "Managers see which critical fixes depend on one person walking out the door.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-sage-50 to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sage-200 bg-sage-100 px-3 py-1 text-xs font-medium text-sage-800">
                <Wrench className="h-3.5 w-3.5" />
                $1,000 Industrial AI Hackathon
              </div>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-sage-900 sm:text-5xl">
                The retiring expert that never clocks out
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Shift Sage turns messy work order logs and shift notes into instant,
                cited diagnostic guidance. Paste a vague fault report and get the
                undocumented workaround your best tech logged two years ago.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-sage-600 hover:bg-sage-700">
                  <Link href="/diagnose">
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/dashboard">Manager dashboard</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <Image
                src="/hero-diagram.svg"
                alt="Shift Sage architecture: fault input flows through agent reasoning to cited repair plan"
                width={800}
                height={480}
                className="w-full rounded-xl border shadow-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-sage-900">
          Built for the 2 AM fault nobody trained you on
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          We ingest your plant&apos;s historical maintenance records and reason across
          past incidents to produce ranked action plans your crew will actually trust.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="card border-sage-100">
              <CardContent className="pt-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-sage-100">
                  <Icon className="h-5 w-5 text-sage-700" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-sage-900">Try the demo fault</h2>
              <p className="mt-2 text-muted-foreground">
                Open the diagnose screen and paste this exact report to see the wow moment:
                the east guard panel bypass that only Frank Martinez documented.
              </p>
              <blockquote className="mt-4 rounded-lg border bg-background p-4 font-mono text-sm text-sage-800">
                packing line 3 dead, swapped prox sensor and relay, PLC looks fine, still
                nothing
              </blockquote>
            </div>
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                18 seeded work orders across 8 assets
              </div>
              <Button asChild>
                <Link href="/diagnose">
                  Open diagnose screen
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p className="text-sm text-muted-foreground">
            Built by Aryan Choudhary for the Industrial AI Hackathon
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/settings" className="text-sage-700 hover:underline">
              Settings
            </Link>
            <Link href="/dashboard" className="text-sage-700 hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
