"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReasoningTraceProps {
  steps: string[];
  isStreaming: boolean;
}

const icons = [Search, Brain, XCircle, CheckCircle2, Brain, CheckCircle2, Brain, CheckCircle2];

export function ReasoningTrace({ steps, isStreaming }: ReasoningTraceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!isStreaming) {
      setVisibleCount(steps.length);
      return;
    }
    setVisibleCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setVisibleCount(i);
      if (i >= steps.length) clearInterval(interval);
    }, 400);
    return () => clearInterval(interval);
  }, [steps, isStreaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount]);

  return (
    <div className="rounded-xl border bg-slate-950 text-slate-100">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
        <Brain className="h-4 w-4 text-sage-400" />
        <span className="text-sm font-medium">Agent reasoning trace</span>
        {isStreaming && visibleCount < steps.length && (
          <Loader2 className="ml-auto h-4 w-4 animate-spin text-sage-400" />
        )}
      </div>
      <ScrollArea className="h-64">
        <div className="space-y-1 p-4 font-mono text-xs leading-relaxed">
          {steps.slice(0, visibleCount).map((step, i) => {
            const Icon = icons[i % icons.length];
            return (
              <div
                key={i}
                className={cn("flex gap-2 animate-slide-up", i === visibleCount - 1 && isStreaming && "text-sage-300")}
              >
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-500" />
                <span>{step}</span>
              </div>
            );
          })}
          {isStreaming && visibleCount < steps.length && (
            <div className="flex gap-2 text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
