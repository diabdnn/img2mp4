import {
  Output,
  Mp4OutputFormat,
  BufferTarget,
  CanvasSource,
  AudioBufferSource,
  QUALITY_VERY_LOW,
  QUALITY_LOW,
  QUALITY_MEDIUM,
  QUALITY_HIGH,
  QUALITY_VERY_HIGH,
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

// 解像度プリセット
const resolutionPresets: Record<string, { width: number; height: number }> = {
  "360p": { width: 640, height: 360 },
  "480p": { width: 854, height: 480 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "1440p": { width: 2560, height: 1440 },
  "4k": { width: 3840, height: 2160 },
  "8k": { width: 7680, height: 4320 },
};

async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const audioArrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  try {
    const decoded = await audioContext.decodeAudioData(audioArrayBuffer.slice(0));
    return decoded;
  } finally {
    audioContext.close();
  }
}

function trimAudioBuffer(buffer: AudioBuffer, durationSeconds: number): AudioBuffer {
  const maxSamples = Math.floor(buffer.sampleRate * durationSeconds);
  const targetLength = Math.min(buffer.length, maxSamples);
  if (targetLength >= buffer.length) return buffer;

  const audioContext = new AudioContext();
  try {
    const trimmed = audioContext.createBuffer(
      buffer.numberOfChannels,
      targetLength,
      buffer.sampleRate
    );
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      trimmed.copyToChannel(src.subarray(0, targetLength), ch);
    }
    return trimmed;
  } finally {
    audioContext.close();
  }
}

export async function imagesToMp4(
  imageFiles: File[],
  fps: number,
  quality: number = 50,
  audioFile?: File,
  resolution?: string,
  aspectMode: "match" | "contain" | "cover" | "stretch" = "contain",
  syncMode: "audio" | "video" = "video",
  videoExtendMode: "last" | "black" = "last",
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

  // 解像度を決定
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;
  
  if (resolution && resolution !== "source" && resolutionPresets[resolution]) {
    targetWidth = resolutionPresets[resolution].width;
    targetHeight = resolutionPresets[resolution].height;
  }

  // 入力比率に合わせる場合は、選択解像度を「最大枠」として縦横比を維持した実寸に落とす
  if (aspectMode === "match" && resolution && resolution !== "source" && resolutionPresets[resolution]) {
    const maxW = resolutionPresets[resolution].width;
    const maxH = resolutionPresets[resolution].height;
    const srcAspect = originalWidth / originalHeight;
    const boxAspect = maxW / maxH;
    if (srcAspect >= boxAspect) {
      targetWidth = maxW;
      targetHeight = Math.round(maxW / srcAspect);
    } else {
      targetHeight = maxH;
      targetWidth = Math.round(maxH * srcAspect);
    }
  }

  const { width, height, scaled } = calculateScaledDimensions(
    targetWidth,
    targetHeight
  );

  if (scaled) {
    console.log(
      `Scaling from ${originalWidth}x${originalHeight} to ${width}x${height} (H.264 limit)`
    );
  }

  const frameDuration = 1 / fps;
  const sourceVideoDurationSeconds = imageFiles.length * frameDuration;

  const decodedAudio = audioFile ? await decodeAudioFile(audioFile) : null;
  const audioDurationSeconds = decodedAudio?.duration ?? 0;

  const finalVideoDurationSeconds =
    syncMode === "audio" && audioDurationSeconds > 0
      ? audioDurationSeconds
      : sourceVideoDurationSeconds;

  const targetFrameCount = Math.max(
    1,
    Math.round(finalVideoDurationSeconds / frameDuration)
  );
  
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

  const clampedQuality = Math.max(1, Math.min(100, quality));
  const bitrateQuality =
    clampedQuality <= 20
      ? QUALITY_VERY_LOW
      : clampedQuality <= 40
        ? QUALITY_LOW
        : clampedQuality <= 60
          ? QUALITY_MEDIUM
          : clampedQuality <= 80
            ? QUALITY_HIGH
            : QUALITY_VERY_HIGH;

  const videoSource = new CanvasSource(canvas, {
    codec: "avc",
    bitrate: bitrateQuality,
  });

  output.addVideoTrack(videoSource);

  let audioSource: AudioBufferSource | null = null;
  if (decodedAudio) {
    audioSource = new AudioBufferSource({
      codec: "aac",
      bitrate: 192_000,
    });
    output.addAudioTrack(audioSource);
  }

  try {
    await output.start();
  } catch (e) {
    throw new Error(`Encoder initialization failed: ${(e as Error).message}`);
  }

  // Audio優先で音声が短い場合は映像をカット
  const framesToEncode =
    syncMode === "audio" && audioDurationSeconds > 0
      ? Math.min(imageFiles.length, targetFrameCount)
      : imageFiles.length;

  let timestamp = 0;
  const total = syncMode === "audio" && audioDurationSeconds > 0 ? targetFrameCount : imageFiles.length;

  let lastFrameFile: File | null = null;

  for (let i = 0; i < framesToEncode; i++) {
    if (abortSignal?.aborted) {
      throw new Error("Encoding cancelled");
    }

    let bitmap: ImageBitmap;
    const file = imageFiles[i];
    lastFrameFile = file;
    try {
      bitmap = await createImageBitmap(file);
    } catch (e) {
      throw new Error(
        `Failed to load image ${i + 1}/${framesToEncode} (${file.name}): ${(e as Error).message}`
      );
    }

    ctx.clearRect(0, 0, width, height);

    if (aspectMode === "stretch") {
      ctx.drawImage(bitmap, 0, 0, width, height);
    } else {
      const scale =
        aspectMode === "cover"
          ? Math.max(width / bitmap.width, height / bitmap.height)
          : Math.min(width / bitmap.width, height / bitmap.height);

      const scaledWidth = bitmap.width * scale;
      const scaledHeight = bitmap.height * scale;
      const x = (width - scaledWidth) / 2;
      const y = (height - scaledHeight) / 2;
      ctx.drawImage(bitmap, x, y, scaledWidth, scaledHeight);
    }
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

  // Audio優先で音声が長い場合は映像を延長（最後保持 or 黒）
  if (syncMode === "audio" && audioDurationSeconds > sourceVideoDurationSeconds) {
    const extraFrames = total - framesToEncode;
    for (let j = 0; j < extraFrames; j++) {
      if (abortSignal?.aborted) {
        throw new Error("Encoding cancelled");
      }

      ctx.clearRect(0, 0, width, height);

      if (videoExtendMode === "black") {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
      }

      if (videoExtendMode === "last" && lastFrameFile) {
        let holdBitmap: ImageBitmap;
        try {
          holdBitmap = await createImageBitmap(lastFrameFile);
        } catch (e) {
          throw new Error(
            `Failed to load last frame for extension: ${(e as Error).message}`
          );
        }

        if (aspectMode === "stretch") {
          ctx.drawImage(holdBitmap, 0, 0, width, height);
        } else {
          const scale =
            aspectMode === "cover"
              ? Math.max(width / holdBitmap.width, height / holdBitmap.height)
              : Math.min(width / holdBitmap.width, height / holdBitmap.height);
          const scaledWidth = holdBitmap.width * scale;
          const scaledHeight = holdBitmap.height * scale;
          const x = (width - scaledWidth) / 2;
          const y = (height - scaledHeight) / 2;
          ctx.drawImage(holdBitmap, x, y, scaledWidth, scaledHeight);
        }
        holdBitmap.close();
      }

      try {
        await videoSource.add(timestamp, frameDuration);
      } catch (e) {
        throw new Error(
          `Encoding extension frame ${framesToEncode + j + 1}/${total} failed: ${(e as Error).message}`
        );
      }

      timestamp += frameDuration;
      onProgress?.(framesToEncode + j + 1, total);
    }
  }

  if (decodedAudio && audioSource) {
    const audioToEncode =
      syncMode === "video" ? trimAudioBuffer(decodedAudio, sourceVideoDurationSeconds) : decodedAudio;
    await audioSource.add(audioToEncode);
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
