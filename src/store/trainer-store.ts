import { create } from "zustand";
import { nanoid } from "nanoid";
import { fal, MODELS } from "@/lib/fal";
import { cropGrid } from "@/lib/grid-cropper";
import { useApiKeyStore } from "@/store/api-key-store";
import type {
  WizardPhase,
  Resolution,
  RoundCount,
  CroppedImage,
  GridResult,
  TrainingResult,
  ROUND_CONFIGS,
} from "@/types";
import { ROUND_CONFIGS as ROUNDS } from "@/types";

interface TrainerState {
  // Wizard phase
  phase: WizardPhase;
  setPhase: (phase: WizardPhase) => void;

  // Upload
  sourceImage: File | null;
  sourceImageUrl: string | null;
  sourceFalUrl: string | null;
  setSourceImage: (file: File) => void;
  uploadSourceImage: () => Promise<void>;

  // Settings
  resolution: Resolution;
  setResolution: (resolution: Resolution) => void;
  roundCount: RoundCount;
  setRoundCount: (count: RoundCount) => void;

  // Generation rounds
  currentRoundIndex: number;
  gridResults: GridResult[];
  isGenerating: boolean;
  generationError: string | null;

  // Generation actions
  generateRound: () => Promise<void>;
  regenerateRound: () => Promise<void>;
  toggleImageSelection: (roundIndex: number, imageId: string) => void;
  confirmRound: () => Promise<void>;

  // Computed helpers
  getSelectedImages: () => CroppedImage[];
  getSelectedCount: () => number;
  getAccumulatedFalUrls: () => string[];

  // Final review
  toggleFinalReviewImage: (imageId: string) => void;

  // Training
  profileName: string;
  setProfileName: (name: string) => void;
  triggerWord: string;
  setTriggerWord: (word: string) => void;
  isTraining: boolean;
  trainingStatus: string;
  trainingError: string | null;
  trainingResult: TrainingResult | null;
  trainingDurationMs: number | null;
  startTraining: () => Promise<void>;

  // Reset
  reset: () => void;
}

const initialState = {
  phase: "upload" as WizardPhase,
  sourceImage: null as File | null,
  sourceImageUrl: null as string | null,
  sourceFalUrl: null as string | null,
  resolution: "4K" as Resolution,
  roundCount: 6 as RoundCount,
  currentRoundIndex: 0,
  gridResults: [] as GridResult[],
  isGenerating: false,
  generationError: null as string | null,
  profileName: "",
  triggerWord: "",
  isTraining: false,
  trainingStatus: "",
  trainingError: null as string | null,
  trainingResult: null as TrainingResult | null,
  trainingDurationMs: null as number | null,
};

export const useTrainerStore = create<TrainerState>((set, get) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  setSourceImage: (file) => {
    const prev = get().sourceImageUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({
      sourceImage: file,
      sourceImageUrl: URL.createObjectURL(file),
    });
  },

  setResolution: (resolution) => set({ resolution }),
  setRoundCount: (roundCount) => set({ roundCount }),

  uploadSourceImage: async () => {
    const { sourceImage } = get();
    if (!sourceImage) throw new Error("No source image selected");

    const url = await fal.storage.upload(sourceImage);
    set({ sourceFalUrl: url, phase: "generating" });
  },

  generateRound: async () => {
    if (get().isGenerating) return; // Guard against StrictMode double-fire

    const { currentRoundIndex, sourceFalUrl, resolution } = get();
    if (!sourceFalUrl) throw new Error("No source image uploaded");

    const roundConfig = ROUNDS[currentRoundIndex];
    if (!roundConfig) throw new Error("Invalid round index");

    set({ isGenerating: true, generationError: null });

    try {
      const imageUrls = [sourceFalUrl, ...get().getAccumulatedFalUrls()].slice(
        0,
        14
      );

      const result = await fal.subscribe(MODELS.NANO_BANANA, {
        input: {
          prompt: roundConfig.prompt,
          image_urls: imageUrls,
          aspect_ratio: "1:1",
          resolution,
          num_images: 1,
          output_format: "png",
        },
      });

      const gridImageUrl = (result.data as { images: { url: string }[] })
        .images[0].url;
      const blobs = await cropGrid(gridImageUrl);

      const croppedImages: CroppedImage[] = blobs.map((blob) => ({
        id: nanoid(),
        blobUrl: URL.createObjectURL(blob),
        roundType: roundConfig.type,
        selected: true,
      }));

      const gridResult: GridResult = {
        originalUrl: gridImageUrl,
        croppedImages,
      };

      const gridResults = [...get().gridResults];
      gridResults[currentRoundIndex] = gridResult;

      set({ gridResults, isGenerating: false });
    } catch (error) {
      set({
        isGenerating: false,
        generationError:
          error instanceof Error ? error.message : "Generation failed",
      });
    }
  },

  regenerateRound: async () => {
    // Clean up old blob URLs for current round
    const { gridResults, currentRoundIndex } = get();
    const existing = gridResults[currentRoundIndex];
    if (existing) {
      existing.croppedImages.forEach((img) => URL.revokeObjectURL(img.blobUrl));
    }
    await get().generateRound();
  },

  toggleImageSelection: (roundIndex, imageId) => {
    const gridResults = [...get().gridResults];
    const round = gridResults[roundIndex];
    if (!round) return;

    gridResults[roundIndex] = {
      ...round,
      croppedImages: round.croppedImages.map((img) =>
        img.id === imageId ? { ...img, selected: !img.selected } : img
      ),
    };
    set({ gridResults });
  },

  confirmRound: async () => {
    const { currentRoundIndex, gridResults } = get();
    const currentGrid = gridResults[currentRoundIndex];
    if (!currentGrid) return;

    // Upload selected images to fal.storage for use as references in next round
    const selectedImages = currentGrid.croppedImages.filter(
      (img) => img.selected
    );

    const updatedImages = await Promise.all(
      selectedImages.map(async (img) => {
        if (img.falUrl) return img;
        const response = await fetch(img.blobUrl);
        const blob = await response.blob();
        const file = new File([blob], `${img.id}.png`, { type: "image/png" });
        const falUrl = await fal.storage.upload(file);
        return { ...img, falUrl };
      })
    );

    // Update the grid result with fal URLs
    const newGridResults = [...gridResults];
    newGridResults[currentRoundIndex] = {
      ...currentGrid,
      croppedImages: currentGrid.croppedImages.map((img) => {
        const uploaded = updatedImages.find((u) => u.id === img.id);
        return uploaded || img;
      }),
    };

    const nextRound = currentRoundIndex + 1;
    if (nextRound >= get().roundCount) {
      set({ gridResults: newGridResults, phase: "review" });
    } else {
      set({ gridResults: newGridResults, currentRoundIndex: nextRound });
    }
  },

  getSelectedImages: () => {
    return get()
      .gridResults.flatMap((r) => r?.croppedImages ?? [])
      .filter((img) => img.selected);
  },

  getSelectedCount: () => {
    return get().getSelectedImages().length;
  },

  getAccumulatedFalUrls: () => {
    return get()
      .gridResults.flatMap((r) => r?.croppedImages ?? [])
      .filter((img) => img.selected && img.falUrl)
      .map((img) => img.falUrl!);
  },

  toggleFinalReviewImage: (imageId) => {
    const gridResults = get().gridResults.map((round) => ({
      ...round,
      croppedImages: round.croppedImages.map((img) =>
        img.id === imageId ? { ...img, selected: !img.selected } : img
      ),
    }));
    set({ gridResults });
  },

  setProfileName: (name) => set({ profileName: name }),
  setTriggerWord: (word) => set({ triggerWord: word }),

  startTraining: async () => {
    const { triggerWord } = get();
    const selectedImages = get().getSelectedImages();

    if (selectedImages.length < 15) {
      set({ trainingError: `Need at least 15 images for training (have ${selectedImages.length})` });
      return;
    }

    set({ isTraining: true, trainingStatus: "Uploading images...", trainingError: null, trainingDurationMs: null, phase: "training" });

    const startTime = Date.now();
    try {
      // Ensure all selected images have falUrls (upload any that are missing)
      const imageUrls: string[] = [];
      for (const img of selectedImages) {
        if (img.falUrl) {
          imageUrls.push(img.falUrl);
        } else {
          const response = await fetch(img.blobUrl);
          const blob = await response.blob();
          const file = new File([blob], `${img.id}.png`, { type: "image/png" });
          const falUrl = await fal.storage.upload(file);
          imageUrls.push(falUrl);
        }
      }

      set({ trainingStatus: "Creating training dataset..." });

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const userKey = useApiKeyStore.getState().falApiKey;
      if (userKey) {
        headers["x-fal-key"] = userKey;
      }

      set({ trainingStatus: "Submitting training job..." });

      const response = await fetch("/api/train", {
        method: "POST",
        headers,
        body: JSON.stringify({ imageUrls, triggerWord }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Training failed");
      }

      const { requestId } = (await response.json()) as { requestId: string };

      // Poll fal queue client-side (routes through proxy when no user key)
      // Clear status so typewriter quips take over during the long training wait
      set({ trainingStatus: "" });

      const pollInterval = 2000;
      let completed = false;

      while (!completed) {
        const status = await fal.queue.status(MODELS.LORA_TRAINING, {
          requestId,
          logs: true,
        });

        if (status.status === "IN_QUEUE") {
          const position = (status as { queue_position?: number }).queue_position;
          set({
            trainingStatus: position != null
              ? `Queue position: ${position}`
              : "Waiting in queue...",
          });
        } else if (status.status === "IN_PROGRESS") {
          // Clear status — typewriter quips display when trainingStatus is ""
          set({ trainingStatus: "" });
        } else if (status.status === "COMPLETED") {
          completed = true;
          break;
        }

        if (!completed) {
          await new Promise((r) => setTimeout(r, pollInterval));
        }
      }

      // Fetch the final result
      const falResult = await fal.queue.result(MODELS.LORA_TRAINING, {
        requestId,
      });

      const data = falResult.data as {
        diffusers_lora_file?: { url: string };
        config_file?: { url: string };
      };

      if (!data.diffusers_lora_file?.url) {
        throw new Error("Training completed but no LoRA file returned");
      }

      const result: TrainingResult = {
        loraUrl: data.diffusers_lora_file.url,
        configUrl: data.config_file?.url,
        triggerWord,
      };

      set({
        isTraining: false,
        trainingResult: result,
        trainingDurationMs: Date.now() - startTime,
        trainingStatus: "",
        phase: "complete",
      });
    } catch (error) {
      set({
        isTraining: false,
        trainingError:
          error instanceof Error ? error.message : "Training failed",
        trainingStatus: "",
      });
    }
  },

  reset: () => {
    // Clean up blob URLs
    const { gridResults, sourceImageUrl } = get();
    if (sourceImageUrl) URL.revokeObjectURL(sourceImageUrl);
    gridResults.forEach((r) =>
      r?.croppedImages.forEach((img) => URL.revokeObjectURL(img.blobUrl))
    );
    set(initialState);
  },
}));
