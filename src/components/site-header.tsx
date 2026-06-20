"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, LayoutDashboard, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/diagnose", label: "Diagnose", icon: Wrench },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-600 text-white">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-sage-800">Shift Sage</span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Plant maintenance memory
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-sage-100 text-sage-800"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
