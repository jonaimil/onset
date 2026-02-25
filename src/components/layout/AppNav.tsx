"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiKeyStore } from "@/store/api-key-store";
import { ApiKeyDialog } from "@/components/settings/ApiKeyDialog";
import { AccentColorPicker } from "@/components/settings/AccentColorPicker";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/train", label: "Train" },
  { href: "/profiles", label: "Profiles" },
];

export function AppNav() {
  const pathname = usePathname();
  const hasKey = useApiKeyStore((s) => !!s.falApiKey);

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center">
          <img src="/onset-logo.svg" alt="Onset" className="h-5 drop-shadow-[0_0_6px_var(--color-primary)]" />
        </Link>
        <div className="flex gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm transition-colors hover:text-foreground",
                pathname === item.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ApiKeyDialog
            trigger={
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "gap-1.5",
                hasKey
                  ? "border-primary/40 text-primary hover:text-primary hover:border-primary/60"
                  : "border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  hasKey ? "bg-primary" : "bg-muted-foreground/60"
                )}
              />
              <KeyRound className="size-3.5" />
              <span className="hidden sm:inline">{hasKey ? "API Key Active" : "Add API Key"}</span>
            </Button>
          }
          />
          <AccentColorPicker />
        </div>
      </div>
    </nav>
  );
}
