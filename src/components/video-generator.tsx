"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ImageFile, EncodingProgress } from "@/lib/types";
import {
  imagesToMp4,
  downloadMp4,
  checkWebCodecsSupport,
} from "@/lib/video-encoder";

type VideoGeneratorProps = {
  images: ImageFile[];
  fps: number;
};

export function VideoGenerator({ images, fps }: VideoGeneratorProps) {
  const t = useTranslations("generate");
  const tError = useTranslations("error");
  const [progress, setProgress] = useState<EncodingProgress>({
    current: 0,
    total: 0,
    status: "idle",
  });
  const [videoBuffer, setVideoBuffer] = useState<ArrayBuffer | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    checkWebCodecsSupport().then(setIsSupported);
  }, []);

  const handleGenerate = async () => {
    if (images.length === 0) {
      setProgress({
        current: 0,
        total: 0,
        status: "error",
        error: tError("noImages"),
      });
      return;
    }

    abortControllerRef.current = new AbortController();
    setProgress({ current: 0, total: images.length, status: "encoding" });
    setVideoBuffer(null);

    try {
      const buffer = await imagesToMp4(
        images.map((img) => img.file),
        fps,
        (current, total) => {
          setProgress({ current, total, status: "encoding" });
        },
        abortControllerRef.current.signal
      );

      setVideoBuffer(buffer);
      setProgress({ current: images.length, total: images.length, status: "complete" });
      } catch (error) {
        const message = (error as Error).message;
        if (message === "Encoding cancelled") {
          setProgress({ current: 0, total: 0, status: "idle" });
        } else {
          // 具体的なエラーメッセージを表示
          let errorMessage = tError("encodingFailed");
          if (message.includes("memory") || message.includes("alloc")) {
            errorMessage = tError("outOfMemory");
          } else if (message.includes("Failed to load image")) {
            errorMessage = message;
          } else if (message.includes("Encoding frame")) {
            errorMessage = message;
          } else if (message.includes("Encoder initialization")) {
            errorMessage = tError("encoderInit");
          }
          setProgress({
            current: 0,
            total: 0,
            status: "error",
            error: errorMessage,
          });
          console.error("Encoding error:", error);
        }
      }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  const handleDownload = () => {
    if (videoBuffer) {
      downloadMp4(videoBuffer, `video-${fps}fps.mp4`);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{tError("unsupported")}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const progressPercent =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("button")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress.status === "error" && progress.error && (
          <Alert variant="destructive">
            <AlertDescription>{progress.error}</AlertDescription>
          </Alert>
        )}

        {progress.status === "encoding" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {t("processing", {
                  current: progress.current,
                  total: progress.total,
                })}
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} />
          </div>
        )}

        {progress.status === "complete" && (
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">
                {t("complete")}
              </span>
            </AlertDescription>
          </Alert>
        )}

          <div className="flex gap-2">
            {progress.status === "encoding" ? (
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                <X className="mr-2 h-4 w-4" />
                {t("cancel")}
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={images.length === 0}
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                {t("button")}
              </Button>
            )}

          {videoBuffer && (
            <Button onClick={handleDownload} variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              {t("download")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
