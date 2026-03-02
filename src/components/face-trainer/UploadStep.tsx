"use client";

import { useCallback, useState } from "react";
import { useTrainerStore } from "@/store/trainer-store";
import type { Resolution, RoundCount } from "@/types";
import { Button } from "@/components/ui/button";
import { Upload, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HowItWorksDialog } from "./HowItWorksDialog";

export function UploadStep() {
  const sourceImageUrl = useTrainerStore((s) => s.sourceImageUrl);
  const setSourceImage = useTrainerStore((s) => s.setSourceImage);
  const uploadSourceImage = useTrainerStore((s) => s.uploadSourceImage);
  const resolution = useTrainerStore((s) => s.resolution);
  const setResolution = useTrainerStore((s) => s.setResolution);
  const roundCount = useTrainerStore((s) => s.roundCount);
  const setRoundCount = useTrainerStore((s) => s.setRoundCount);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setSourceImage(file);
    },
    [setSourceImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleStart = async () => {
    setIsUploading(true);
    try {
      await uploadSourceImage();
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload failed"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const openFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  };

  // Before image is uploaded: full-width drop zone + heading
  if (!sourceImageUrl) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            Train a Face LoRA
            <HowItWorksDialog />
          </h1>
          <p className="text-muted-foreground">
            One photo is all you need. Onset generates a complete training
            dataset — expressions, angles, outfits — from a single reference
            image.
          </p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={openFilePicker}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 sm:p-16 transition-all ${
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.01] shadow-[var(--glow-primary)]"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <ImageIcon className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm font-medium">
            Drop an image here, or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG, or WebP
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: Use a well-lit, front-facing photo with the face clearly
          visible. AI-generated faces (from Midjourney, etc.) work great.
        </p>
      </div>
    );
  }

  // After image: side-by-side layout (image left, options right)
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          Train a Face LoRA
          <HowItWorksDialog />
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure your training settings, then start generating.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Image preview (clickable drop zone) */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={openFilePicker}
          className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all ${
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.01] shadow-[var(--glow-primary)]"
              : "border-border hover:border-muted-foreground/30"
          }`}
        >
          <img
            src={sourceImageUrl}
            alt="Reference face"
            className="max-h-80 rounded-lg object-contain"
          />
        </div>

        {/* Right: Options */}
        <div className="space-y-5">
          {/* Resolution picker */}
          <div>
            <label className="mb-4 block text-sm font-medium">Generation Resolution</label>
            <div className="grid grid-cols-2 gap-3">
              {(["4K", "2K"] as Resolution[]).map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`rounded-lg border px-4 py-4 text-left transition-all ${
                    resolution === res
                      ? "border-primary bg-primary/10 shadow-[var(--glow-primary)]"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-semibold">
                      {res}
                      {res === "2K" && (
                        <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Lite</span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {res === "2K" ? "$0.15" : "$0.30"}/round
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {/* 4K cost admonition — hidden now that 4K is the default */}
            {/* <div
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: resolution === "4K" ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div
                  className={`mt-3 flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-200 transition-all duration-250 ${
                    resolution === "4K"
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 -translate-y-2 scale-95"
                  }`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
                >
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    4K doubles the cost per generation. With {roundCount} rounds,
                    that's ~${(roundCount * 0.3).toFixed(2)} vs ~$
                    {(roundCount * 0.15).toFixed(2)} for 2K.
                  </span>
                </div>
              </div>
            </div> */}
          </div>

          {/* Round count picker */}
          <div>
            <label className="mb-4 block text-sm font-medium">Training Rounds</label>
            <div className="grid grid-cols-2 gap-3">
              {([6, 4] as RoundCount[]).map((count) => (
                <button
                  key={count}
                  onClick={() => setRoundCount(count)}
                  className={`rounded-lg border px-4 py-4 text-left transition-all ${
                    roundCount === count
                      ? "border-primary bg-primary/10 shadow-[var(--glow-primary)]"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-semibold">
                      {count} Rounds
                      {count === 4 && (
                        <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Lite</span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ~{count * 9} images
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cost estimate */}
          <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {roundCount} rounds at {resolution}
              </span>
              <span>
                ~${(roundCount * (resolution === "2K" ? 0.15 : 0.3)).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">LoRA training</span>
              <span>~$2.00</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-medium">
              <span>Estimated total</span>
              <span>
                ~${(roundCount * (resolution === "2K" ? 0.15 : 0.3) + 2).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
            >
              Change Image
            </Button>
            <Button onClick={handleStart} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Start Training Dataset
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
