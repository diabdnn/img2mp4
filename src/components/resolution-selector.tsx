"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export type ResolutionPreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  label: string;
};

const resolutionPresets: ResolutionPreset[] = [
  { id: "360p", name: "360p", width: 640, height: 360, label: "360p (640×360)" },
  { id: "480p", name: "480p", width: 854, height: 480, label: "480p (854×480)" },
  { id: "720p", name: "720p", width: 1280, height: 720, label: "720p (1280×720)" },
  { id: "1080p", name: "1080p", width: 1920, height: 1080, label: "1080p (1920×1080)" },
  { id: "1440p", name: "1440p", width: 2560, height: 1440, label: "1440p (2560×1440)" },
  { id: "4k", name: "4K", width: 3840, height: 2160, label: "4K (3840×2160)" },
  { id: "8k", name: "8K", width: 7680, height: 4320, label: "8K (7680×4320)" },
  { id: "source", name: "source", width: 0, height: 0, label: "入力と合わせる" },
];

type ResolutionSelectorProps = {
  resolution: string;
  onResolutionChange: (resolution: string) => void;
  sourceWidth?: number;
  sourceHeight?: number;
};

export function ResolutionSelector({ 
  resolution, 
  onResolutionChange, 
  sourceWidth = 0, 
  sourceHeight = 0 
}: ResolutionSelectorProps) {
  const t = useTranslations("resolution");

  const isDisabled = (preset: ResolutionPreset) => {
    if (preset.id === "source") return false;
    if (sourceWidth === 0 || sourceHeight === 0) return false;
    return preset.width > sourceWidth || preset.height > sourceHeight;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {t("label")}
          </Label>
          <div className="grid grid-cols-1 gap-2">
            {resolutionPresets.map((preset) => {
              const disabled = isDisabled(preset);
              return (
              <label
                key={preset.id}
                className={`flex items-center space-x-2 rounded-md border p-3 transition-colors ${
                  disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-accent/50"
                }`}
              >
                <input
                  type="radio"
                  name="resolution"
                  value={preset.id}
                  checked={resolution === preset.id}
                  onChange={(e) => onResolutionChange(e.target.value)}
                  className="sr-only"
                  disabled={disabled}
                />
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    resolution === preset.id 
                      ? 'border-primary bg-primary' 
                      : 'border-muted-foreground'
                  }`}>
                    {resolution === preset.id && (
                      <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />
                    )}
                  </div>
                  <span className="text-sm">{preset.label}</span>
                </div>
              </label>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
