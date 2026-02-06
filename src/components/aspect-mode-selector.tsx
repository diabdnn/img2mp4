"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export type AspectMode = "match" | "contain" | "cover" | "stretch";

type AspectModeSelectorProps = {
  mode: AspectMode;
  onModeChange: (mode: AspectMode) => void;
};

export function AspectModeSelector({ mode, onModeChange }: AspectModeSelectorProps) {
  const t = useTranslations("aspect");

  const options: Array<{ value: AspectMode; label: string }> = [
    { value: "match", label: t("match") },
    { value: "contain", label: t("contain") },
    { value: "cover", label: t("cover") },
    { value: "stretch", label: t("stretch") },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t("label")}</Label>
          <div className="grid grid-cols-1 gap-2">
            {options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center space-x-2 cursor-pointer rounded-md border p-3 hover:bg-accent/50 transition-colors"
              >
                <input
                  type="radio"
                  name="aspect"
                  value={opt.value}
                  checked={mode === opt.value}
                  onChange={(e) => onModeChange(e.target.value as AspectMode)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      mode === opt.value ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}
                  >
                    {mode === opt.value && <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />}
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
