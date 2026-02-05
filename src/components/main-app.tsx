"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageUploader } from "@/components/image-uploader";
import { FpsSelector } from "@/components/fps-selector";
import { VideoGenerator } from "@/components/video-generator";
import { ModeToggle } from "@/components/mode-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { ImageFile } from "@/lib/types";

type MainAppProps = {
  locale: string;
};

export function MainApp({ locale }: MainAppProps) {
  const t = useTranslations();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [fps, setFps] = useState(30);

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
        <FpsSelector fps={fps} onFpsChange={setFps} />
        <VideoGenerator images={images} fps={fps} />
      </main>
    </div>
  );
}
