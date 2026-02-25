import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import JSZip from "jszip";

export async function POST(request: NextRequest) {
  const userKey = request.headers.get("x-fal-key");
  const credentials = userKey || process.env.FAL_KEY;

  if (!credentials) {
    return NextResponse.json(
      { error: "No API key provided. Add one in Settings or set FAL_KEY in .env.local." },
      { status: 401 }
    );
  }

  fal.config({ credentials });

  try {
    const { imageUrls, triggerWord } = (await request.json()) as {
      imageUrls: string[];
      triggerWord: string;
    };

    if (!imageUrls || imageUrls.length < 15) {
      return NextResponse.json(
        { error: "Need at least 15 images for training" },
        { status: 400 }
      );
    }

    if (!triggerWord?.trim()) {
      return NextResponse.json(
        { error: "Trigger word is required" },
        { status: 400 }
      );
    }

    // Fetch all images and bundle into ZIP
    const zip = new JSZip();

    await Promise.all(
      imageUrls.map(async (url, i) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image ${i}`);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        zip.file(`image_${String(i).padStart(3, "0")}.png`, arrayBuffer);
      })
    );

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipFile = new File([zipBlob], "training-images.zip", {
      type: "application/zip",
    });

    // Upload ZIP to fal.storage
    const zipUrl = await fal.storage.upload(zipFile);

    // Submit training job to queue (returns immediately with request_id)
    const { request_id } = await fal.queue.submit(
      "fal-ai/flux-lora-fast-training",
      {
        input: {
          images_data_url: zipUrl,
          trigger_word: triggerWord,
          create_masks: true,
          steps: 1000,
        },
      }
    );

    return NextResponse.json({ requestId: request_id });
  } catch (error) {
    console.error("[Train API Error]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Training failed",
      },
      { status: 500 }
    );
  }
}
