import {
  Output,
  Mp4OutputFormat,
  BufferTarget,
  CanvasSource,
  QUALITY_HIGH,
} from "mediabunny";

export type ProgressCallback = (current: number, total: number) => void;

export async function checkWebCodecsSupport(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return "VideoEncoder" in window && "OffscreenCanvas" in window;
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

  const firstBitmap = await createImageBitmap(imageFiles[0]);
  const width = firstBitmap.width;
  const height = firstBitmap.height;
  firstBitmap.close();

  const frameDuration = 1 / fps;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat(),
    target,
  });

  const videoSource = new CanvasSource(canvas, {
    codec: "avc",
    bitrate: QUALITY_HIGH,
  });

  output.addVideoTrack(videoSource);
  await output.start();

  let timestamp = 0;
  const total = imageFiles.length;

  for (let i = 0; i < imageFiles.length; i++) {
    if (abortSignal?.aborted) {
      throw new Error("Encoding cancelled");
    }

    const bitmap = await createImageBitmap(imageFiles[i]);
    
    ctx.clearRect(0, 0, width, height);
    
    const scale = Math.min(width / bitmap.width, height / bitmap.height);
    const scaledWidth = bitmap.width * scale;
    const scaledHeight = bitmap.height * scale;
    const x = (width - scaledWidth) / 2;
    const y = (height - scaledHeight) / 2;
    
    ctx.drawImage(bitmap, x, y, scaledWidth, scaledHeight);
    bitmap.close();

    await videoSource.add(timestamp, frameDuration);
    timestamp += frameDuration;

    onProgress?.(i + 1, total);
  }

  await output.finalize();
  return target.buffer!;
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
