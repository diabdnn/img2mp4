"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

type QualitySelectorProps = {
  quality: number;
  onQualityChange: (quality: number) => void;
};

export function QualitySelector({ quality, onQualityChange }: QualitySelectorProps) {
  const t = useTranslations("quality");

  const getQualityLabel = (value: number) => {
    if (value <= 25) return t("low");
    if (value <= 50) return t("medium");
    if (value <= 75) return t("high");
    return t("ultra");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Label className="shrink-0">
            {t("label")}
          </Label>
          <Slider
            value={[quality]}
            onValueChange={([value]) => onQualityChange(value)}
            min={1}
            max={100}
            step={1}
            className="flex-1"
          />
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium min-w-[3rem] text-right">
              {getQualityLabel(quality)}
            </span>
            <span className="text-sm text-muted-foreground">({quality})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
