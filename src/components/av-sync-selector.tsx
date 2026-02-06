"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export type SyncMode = "audio" | "video";
export type VideoExtendMode = "last" | "black";

type AvSyncSelectorProps = {
  syncMode: SyncMode;
  onSyncModeChange: (mode: SyncMode) => void;
  videoExtendMode: VideoExtendMode;
  onVideoExtendModeChange: (mode: VideoExtendMode) => void;
};

export function AvSyncSelector({
  syncMode,
  onSyncModeChange,
  videoExtendMode,
  onVideoExtendModeChange,
}: AvSyncSelectorProps) {
  const t = useTranslations("sync");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t("modeLabel")}</Label>
          <div className="grid grid-cols-1 gap-2">
            {([
              { value: "audio" as const, label: t("audio") },
              { value: "video" as const, label: t("video") },
            ]).map((opt) => (
              <label
                key={opt.value}
                className="flex items-center space-x-2 cursor-pointer rounded-md border p-3 hover:bg-accent/50 transition-colors"
              >
                <input
                  type="radio"
                  name="syncMode"
                  value={opt.value}
                  checked={syncMode === opt.value}
                  onChange={(e) => onSyncModeChange(e.target.value as SyncMode)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      syncMode === opt.value ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}
                  >
                    {syncMode === opt.value && <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />}
                  </div>
                  <span className="text-sm">{opt.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">{t("extendLabel")}</Label>
          <div className={`grid grid-cols-1 gap-2 ${syncMode !== "audio" ? "opacity-50" : ""}`}>
            {([
              { value: "last" as const, label: t("extendLast") },
              { value: "black" as const, label: t("extendBlack") },
            ]).map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center space-x-2 rounded-md border p-3 transition-colors ${
                  syncMode === "audio" ? "cursor-pointer hover:bg-accent/50" : "cursor-not-allowed"
                }`}
              >
                <input
                  type="radio"
                  name="videoExtendMode"
                  value={opt.value}
                  checked={videoExtendMode === opt.value}
                  onChange={(e) => onVideoExtendModeChange(e.target.value as VideoExtendMode)}
                  className="sr-only"
                  disabled={syncMode !== "audio"}
                />
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      videoExtendMode === opt.value ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}
                  >
                    {videoExtendMode === opt.value && <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />}
                  </div>
                  <span className="text-sm">{opt.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
