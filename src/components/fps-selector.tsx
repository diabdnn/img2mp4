"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FpsSelectorProps = {
  fps: number;
  onFpsChange: (fps: number) => void;
};

export function FpsSelector({ fps, onFpsChange }: FpsSelectorProps) {
  const t = useTranslations("fps");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 60) {
      onFpsChange(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="fps-input" className="shrink-0">
            {t("label")}
          </Label>
          <Slider
            value={[fps]}
            onValueChange={([value]) => onFpsChange(value)}
            min={1}
            max={60}
            step={1}
            className="flex-1"
          />
          <div className="flex items-center gap-1">
            <Input
              id="fps-input"
              type="number"
              value={fps}
              onChange={handleInputChange}
              min={1}
              max={60}
              className="w-16 text-center"
            />
            <span className="text-sm text-muted-foreground">{t("unit")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
