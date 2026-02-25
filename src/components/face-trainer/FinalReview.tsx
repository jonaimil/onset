"use client";

import { useTrainerStore } from "@/store/trainer-store";
import { ROUND_CONFIGS } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageCell } from "./ImageCell";
import { ArrowRight, AlertTriangle } from "lucide-react";

export function FinalReview() {
  const gridResults = useTrainerStore((s) => s.gridResults);
  const toggleFinalReviewImage = useTrainerStore(
    (s) => s.toggleFinalReviewImage
  );
  const getSelectedImages = useTrainerStore((s) => s.getSelectedImages);
  const setPhase = useTrainerStore((s) => s.setPhase);

  const selectedImages = getSelectedImages();
  const selectedCount = selectedImages.length;

  const roundCount = useTrainerStore((s) => s.roundCount);

  const imagesByRound = ROUND_CONFIGS.slice(0, roundCount).map((config, i) => ({
    config,
    images:
      gridResults[i]?.croppedImages.filter((img) => img.selected) ?? [],
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Final Review</h2>
          <p className="text-sm text-muted-foreground">
            Remove any remaining images you don't want in the training
            set.
          </p>
        </div>
        <Badge variant={selectedCount >= 20 ? "default" : "destructive"}>
          {selectedCount} images selected
        </Badge>
      </div>

      {selectedCount < 20 && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            selectedCount < 15
              ? "border-destructive/50 bg-destructive/10 text-red-200"
              : "border-yellow-500/50 bg-yellow-500/10 text-yellow-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {selectedCount < 15 ? (
              <span>
                Minimum 15 images required for training. You have{" "}
                {selectedCount}. Go back and regenerate rounds with more
                variety.
              </span>
            ) : (
              <span>
                Recommended: 20+ images for best results. You have{" "}
                {selectedCount}.
              </span>
            )}
          </div>
        </div>
      )}

      {imagesByRound.map(({ config, images }) => (
        <div key={config.type} className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {config.label} ({images.length} images)
          </h3>
          <div className="grid grid-cols-4 gap-2.5">
            {images.map((image) => (
              <ImageCell
                key={image.id}
                imageUrl={image.blobUrl}
                selected={image.selected}
                onToggle={() => toggleFinalReviewImage(image.id)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => useTrainerStore.getState().setPhase("generating")}
        >
          Back to Rounds
        </Button>
        <Button
          onClick={() => setPhase("training-config")}
          disabled={selectedCount < 15}
        >
          Continue to Training
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
