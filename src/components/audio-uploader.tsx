"use client";

import { useCallback, useRef } from "react";
import { Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AudioFile = {
  id: string;
  file: File;
  name: string;
  duration?: number;
};

type AudioUploaderProps = {
  audio: AudioFile | null;
  onAudioChange: (audio: AudioFile | null) => void;
};

export function AudioUploader({ audio, onAudioChange }: AudioUploaderProps) {
  const t = useTranslations("audio");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;

      if (file.type.startsWith("audio/")) {
        const audioFile: AudioFile = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          name: file.name,
        };

        // 音声の長さを取得
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.addEventListener("loadedmetadata", () => {
          audioFile.duration = audio.duration;
          URL.revokeObjectURL(audio.src);
          onAudioChange(audioFile);
        });
      }
    },
    [onAudioChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeAudio = () => {
    if (audio) {
      onAudioChange(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        {audio && (
          <Button variant="outline" size="sm" onClick={removeAudio}>
            <X className="mr-2 h-4 w-4" />
            {t("remove")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-2">{t("dropzone")}</p>
          <p className="text-xs text-muted-foreground/70">{t("supported")}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </div>

        {audio && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("selected")}: {audio.name}
            </p>
            {audio.duration && (
              <p className="text-xs text-muted-foreground">
                {t("duration")}: {Math.floor(audio.duration / 60)}:{(audio.duration % 60).toFixed(0).padStart(2, '0')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
