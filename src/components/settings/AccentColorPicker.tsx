"use client";

import { Palette } from "lucide-react";
import { useAccentStore } from "@/store/accent-store";
import { primaryHexForHue, DEFAULT_HUE, PRIMARY_C, SATURATED_C } from "@/lib/color";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PRESETS: { label: string; hue: number; chroma?: number }[] = [
  { label: "White", hue: 0, chroma: 0.01 },
  { label: "Lime", hue: 130, chroma: SATURATED_C },
  { label: "Emerald", hue: 155, chroma: SATURATED_C },
  { label: "Teal", hue: 180, chroma: SATURATED_C },
  { label: "Blue", hue: 250, chroma: SATURATED_C },
  { label: "Purple", hue: 290, chroma: SATURATED_C },
  { label: "Rose", hue: 10, chroma: SATURATED_C },
  { label: "Orange", hue: 55, chroma: SATURATED_C },
  { label: "Gold", hue: 85, chroma: SATURATED_C },
  { label: "Green", hue: 145, chroma: SATURATED_C },
];

function presetKey(p: { hue: number; chroma?: number }) {
  return `${p.hue}-${p.chroma ?? PRIMARY_C}`;
}

export function AccentColorPicker() {
  const hue = useAccentStore((s) => s.hue);
  const chroma = useAccentStore((s) => s.chroma);
  const setAccent = useAccentStore((s) => s.setAccent);
  const resetAccent = useAccentStore((s) => s.resetAccent);
  const isDefault = hue === DEFAULT_HUE && chroma === PRIMARY_C;
  const activeKey = `${hue}-${chroma}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-8 border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
        >
          <Palette className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Accent Color</p>

          {/* Preset swatches - 5x2 grid */}
          <div className="grid grid-cols-5 gap-2">
            {PRESETS.map((preset) => {
              const c = preset.chroma ?? PRIMARY_C;
              return (
                <button
                  key={presetKey(preset)}
                  onClick={() => setAccent(preset.hue, c)}
                  title={preset.label}
                  className="group relative flex size-8 items-center justify-center rounded-md transition-transform hover:scale-110"
                  style={{
                    backgroundColor: primaryHexForHue(preset.hue, c),
                    border: c < 0.02 ? "1px solid rgba(255,255,255,0.2)" : undefined,
                  }}
                >
                  {activeKey === `${preset.hue}-${c}` && (
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: c < 0.02 ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.6)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Hue slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Custom</span>
              <span className="text-xs tabular-nums text-muted-foreground">{Math.round(hue)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={hue}
              onChange={(e) => setAccent(Number(e.target.value), SATURATED_C)}
              className="h-2 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/20"
              style={{
                background:
                  "linear-gradient(to right, hsl(0,80%,60%), hsl(60,80%,60%), hsl(120,80%,60%), hsl(180,80%,60%), hsl(240,80%,60%), hsl(300,80%,60%), hsl(360,80%,60%))",
              }}
            />
          </div>

          {/* Reset link */}
          {!isDefault && (
            <button
              onClick={resetAccent}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Reset to default
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
