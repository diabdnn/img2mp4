"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ImageUploader } from "@/components/image-uploader";
import { AudioUploader } from "@/components/audio-uploader";
import { FpsSelector } from "@/components/fps-selector";
import { QualitySelector } from "@/components/quality-selector";
import { ResolutionSelector } from "@/components/resolution-selector";
import { AspectModeSelector } from "@/components/aspect-mode-selector";
import { AvSyncSelector } from "@/components/av-sync-selector";
import { VideoGenerator } from "@/components/video-generator";
import { ModeToggle } from "@/components/mode-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { ImageFile, AudioFile } from "@/lib/types";

type MainAppProps = {
  locale: string;
};

export function MainApp({ locale }: MainAppProps) {
  const t = useTranslations();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [fps, setFps] = useState(60);
  const [quality, setQuality] = useState(50);
  const [resolution, setResolution] = useState("source");
  const [aspectMode, setAspectMode] = useState<"match" | "contain" | "cover" | "stretch">("cover");
  const [syncMode, setSyncMode] = useState<"audio" | "video">("audio");
  const [videoExtendMode, setVideoExtendMode] = useState<"last" | "black">("last");
  const [sourceDimensions, setSourceDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // 画像が変更されたら解像度を取得
  useEffect(() => {
    if (images.length > 0) {
      const img = new Image();
      img.onload = () => {
        setSourceDimensions({ width: img.width, height: img.height });
      };
      img.src = images[0].preview;
    } else {
      setSourceDimensions({ width: 0, height: 0 });
    }
  }, [images]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher currentLocale={locale} />
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-3xl">
        <ImageUploader images={images} onImagesChange={setImages} />
        <AudioUploader audio={audio} onAudioChange={setAudio} />
        <FpsSelector fps={fps} onFpsChange={setFps} />
        <QualitySelector quality={quality} onQualityChange={setQuality} />
        <AspectModeSelector mode={aspectMode} onModeChange={setAspectMode} />
        <AvSyncSelector
          syncMode={syncMode}
          onSyncModeChange={setSyncMode}
          videoExtendMode={videoExtendMode}
          onVideoExtendModeChange={setVideoExtendMode}
        />
        <ResolutionSelector 
          resolution={resolution} 
          onResolutionChange={setResolution}
          sourceWidth={sourceDimensions.width}
          sourceHeight={sourceDimensions.height}
        />
        <VideoGenerator
          images={images}
          fps={fps}
          quality={quality}
          audio={audio}
          resolution={resolution}
          aspectMode={aspectMode}
          syncMode={syncMode}
          videoExtendMode={videoExtendMode}
        />
      </main>
    </div>
  );
}
