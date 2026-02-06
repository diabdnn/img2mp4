"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ImageFile, AudioFile, EncodingProgress } from "@/lib/types";
import {
  imagesToMp4,
  downloadMp4,
  checkWebCodecsSupport,
} from "@/lib/video-encoder";

type VideoGeneratorProps = {
  images: ImageFile[];
  fps: number;
  quality: number;
  audio: AudioFile | null;
  resolution: string;
  aspectMode: "match" | "contain" | "cover" | "stretch";
  syncMode: "audio" | "video";
  videoExtendMode: "last" | "black";
};

export function VideoGenerator({ images, fps, quality, audio, resolution, aspectMode, syncMode, videoExtendMode }: VideoGeneratorProps) {
  const t = useTranslations("generate");
  const tError = useTranslations("error");
  const [progress, setProgress] = useState<EncodingProgress>({
    current: 0,
    total: 0,
    status: "idle",
  });
  const [displayProgress, setDisplayProgress] = useState(0);
  const [videoBuffer, setVideoBuffer] = useState<ArrayBuffer | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressStatusRef = useRef<EncodingProgress["status"]>("idle");
  const encodingStartTimeRef = useRef<number | null>(null);
  const [showNoImagesWarning, setShowNoImagesWarning] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    checkWebCodecsSupport().then(setIsSupported);
  }, []);

  // 滑らかな進捗アニメーション
  useEffect(() => {
    const targetProgress = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    
    const animate = () => {
      setDisplayProgress(prev => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.1) {
          return targetProgress;
        }
        return prev + diff * 0.1; // イージング係数
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    if (progress.status === "encoding") {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (progress.status === "complete") {
      setDisplayProgress(100);
    } else if (progress.status === "idle") {
      setDisplayProgress(0);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [progress]);

  useEffect(() => {
    progressStatusRef.current = progress.status;
  }, [progress.status]);

  // 画像がアップロードされたら警告を消す
  useEffect(() => {
    if (images.length > 0) {
      setShowNoImagesWarning(false);
    }
  }, [images]);

  // 設定や入力が変わったら生成済み動画をリセット（プレビュー/ダウンロードを消して生成ボタンを戻す）
  useEffect(() => {
    if (progressStatusRef.current === "encoding") {
      abortControllerRef.current?.abort();
    }
    setVideoBuffer(null);
    setProgress({ current: 0, total: 0, status: "idle" });
  }, [images, audio, fps, quality, resolution, aspectMode, syncMode, videoExtendMode]);

  const generateVideo = useCallback(async () => {
    if (images.length === 0) {
      setShowNoImagesWarning(true);
      return;
    }

    setShowNoImagesWarning(false);
    abortControllerRef.current = new AbortController();
    encodingStartTimeRef.current = Date.now();
    setProgress({ current: 0, total: images.length, status: "encoding" });
    setVideoBuffer(null);

    try {
      const buffer = await imagesToMp4(
        images.map((img) => img.file),
        fps,
        quality,
        audio?.file,
        resolution,
        aspectMode,
        syncMode,
        videoExtendMode,
        (current: number, total: number) => {
          setProgress({ current, total, status: "encoding" });
        },
        abortControllerRef.current.signal
      );

      setVideoBuffer(buffer);
      setProgress({ current: images.length, total: images.length, status: "complete" });
    } catch (error) {
      const message = (error as Error).message;
      if (message === "Encoding cancelled") {
        encodingStartTimeRef.current = null;
        setProgress({ current: 0, total: 0, status: "idle" });
      } else {
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
        encodingStartTimeRef.current = null;
        console.error("Encoding error:", error);
      }
    }
  }, [images, fps, quality, audio, resolution, aspectMode, syncMode, videoExtendMode, tError]);

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

        {showNoImagesWarning && (
          <Alert variant="destructive">
            <AlertDescription>{tError("noImages")}</AlertDescription>
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
              <span className="text-right">
                {(() => {
                  const start = encodingStartTimeRef.current;
                  if (!start || progress.current <= 0 || progress.total <= 0) {
                    return `${Math.round(displayProgress)}%`;
                  }
                  const elapsedMs = Date.now() - start;
                  const avgMsPerFrame = elapsedMs / progress.current;
                  const remainingFrames = Math.max(0, progress.total - progress.current);
                  const remainingMs = remainingFrames * avgMsPerFrame;
                  const remainingSec = Math.max(0, Math.round(remainingMs / 1000));
                  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
                  const ss = String(remainingSec % 60).padStart(2, "0");
                  return `${Math.round(displayProgress)}% (${t("remaining", { time: `${mm}:${ss}` })})`;
                })()}
              </span>
            </div>
            <Progress value={displayProgress} />
          </div>
        )}

        {videoBuffer && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("preview")}</p>
              <video
                src={URL.createObjectURL(new Blob([videoBuffer], { type: 'video/mp4' }))}
                controls
                className="w-full rounded-md border"
              />
            </div>
            <Button onClick={handleDownload} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {t("download")}
            </Button>
          </div>
        )}

        {progress.status === "encoding" && (
          <Button variant="outline" onClick={handleCancel} className="w-full">
            <X className="mr-2 h-4 w-4" />
            {t("cancel")}
          </Button>
        )}

        {progress.status === "idle" && !videoBuffer && (
          <Button onClick={generateVideo} className="w-full">
            <Play className="mr-2 h-4 w-4" />
            {t("button")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
