"use client";

import { useCallback, useRef } from "react";
import { Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ImageFile } from "@/lib/types";

type ImageUploaderProps = {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
};

export function ImageUploader({ images, onImagesChange }: ImageUploaderProps) {
  const t = useTranslations("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newImages: ImageFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          newImages.push({
            id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
          });
        }
      }

      const sortedImages = [...images, ...newImages].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );

      onImagesChange(sortedImages);
    },
    [images, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = (id: string) => {
    const image = images.find((img) => img.id === id);
    if (image) {
      URL.revokeObjectURL(image.preview);
    }
    onImagesChange(images.filter((img) => img.id !== id));
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    onImagesChange([]);
  };

  const sortByName = () => {
    const sorted = [...images].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    onImagesChange(sorted);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        {images.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={sortByName}>
              {t("sortByName")}
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              {t("clear")}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground mb-2">{t("dropzone")}</p>
          <p className="text-xs text-muted-foreground/70">{t("supported")}</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {images.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("count", { count: images.length })}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-1">
              {images.map((image, index) => (
                <div key={image.id} className="relative group aspect-square">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                      className="p-1 bg-destructive rounded-full"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1 py-0.5 truncate rounded-b-md">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
