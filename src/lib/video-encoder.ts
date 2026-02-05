import {
  Output,
  Mp4OutputFormat,
  BufferTarget,
  CanvasSource,
} from "mediabunny";

export type ProgressCallback = (current: number, total: number) => void;

// H.264 Level 5.1の最大解像度（4096x2160）
const MAX_WIDTH = 4096;
const MAX_HEIGHT = 2160;

// バッチ処理サイズ（GC用）
const BATCH_SIZE = 10;

export async function checkWebCodecsSupport(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return "VideoEncoder" in window && "OffscreenCanvas" in window;
}

function calculateScaledDimensions(
  width: number,
  height: number
): { width: number; height: number; scaled: boolean } {
  if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
    // 2の倍数に調整（H.264要件）
    return {
      width: Math.floor(width / 2) * 2,
      height: Math.floor(height / 2) * 2,
      scaled: false,
    };
  }

  const scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
  return {
    width: Math.floor((width * scale) / 2) * 2,
    height: Math.floor((height * scale) / 2) * 2,
    scaled: true,
  };
}

export async function imagesToMp4(
  imageFiles: File[],
  fps: number,
  onProgress?: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<ArrayBuffer> {
  if (imageFiles.length === 0) {
    throw new Error("No images provided");
  }

  // 最初の画像からサイズを取得
  let firstBitmap: ImageBitmap;
  try {
    firstBitmap = await createImageBitmap(imageFiles[0]);
  } catch (e) {
    throw new Error(`Failed to load first image: ${(e as Error).message}`);
  }
  
  const originalWidth = firstBitmap.width;
  const originalHeight = firstBitmap.height;
  firstBitmap.close();

  const { width, height, scaled } = calculateScaledDimensions(
    originalWidth,
    originalHeight
  );

  if (scaled) {
    console.log(
      `Scaling from ${originalWidth}x${originalHeight} to ${width}x${height} (H.264 limit)`
    );
  }

  const frameDuration = 1 / fps;
  
  // キャンバス作成
  let canvas: OffscreenCanvas;
  let ctx: OffscreenCanvasRenderingContext2D;
  try {
    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext("2d")!;
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
  } catch (e) {
    throw new Error(`Canvas creation failed (${width}x${height}): ${(e as Error).message}`);
  }

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat(),
    target,
  });

  // ビットレートを解像度に応じて調整（4K: ~50Mbps, 1080p: ~15Mbps）
  const pixelCount = width * height;
  const bitrate = Math.min(
    50_000_000, // 最大50Mbps
    Math.max(5_000_000, Math.floor(pixelCount * 6)) // 最低5Mbps
  );

  const videoSource = new CanvasSource(canvas, {
    codec: "avc",
    bitrate,
  });

  output.addVideoTrack(videoSource);
  
  try {
    await output.start();
  } catch (e) {
    throw new Error(`Encoder initialization failed: ${(e as Error).message}`);
  }

  let timestamp = 0;
  const total = imageFiles.length;

  for (let i = 0; i < imageFiles.length; i++) {
    if (abortSignal?.aborted) {
      throw new Error("Encoding cancelled");
    }

    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(imageFiles[i]);
    } catch (e) {
      throw new Error(
        `Failed to load image ${i + 1}/${total} (${imageFiles[i].name}): ${(e as Error).message}`
      );
    }

    ctx.clearRect(0, 0, width, height);

    // アスペクト比を維持してセンタリング
    const scale = Math.min(width / bitmap.width, height / bitmap.height);
    const scaledWidth = bitmap.width * scale;
    const scaledHeight = bitmap.height * scale;
    const x = (width - scaledWidth) / 2;
    const y = (height - scaledHeight) / 2;

    ctx.drawImage(bitmap, x, y, scaledWidth, scaledHeight);
    bitmap.close();

    try {
      await videoSource.add(timestamp, frameDuration);
    } catch (e) {
      throw new Error(
        `Encoding frame ${i + 1}/${total} failed: ${(e as Error).message}`
      );
    }
    
    timestamp += frameDuration;
    onProgress?.(i + 1, total);

    // バッチごとにGCを促す
    if ((i + 1) % BATCH_SIZE === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  try {
    await output.finalize();
  } catch (e) {
    throw new Error(`Finalization failed: ${(e as Error).message}`);
  }

  if (!target.buffer) {
    throw new Error("Encoding produced no output");
  }

  return target.buffer;
}

export function downloadMp4(buffer: ArrayBuffer, filename: string = "output.mp4") {
  const blob = new Blob([buffer], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
