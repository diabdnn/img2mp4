export type ImageFile = {
  id: string;
  file: File;
  preview: string;
  name: string;
};

export type AudioFile = {
  id: string;
  file: File;
  name: string;
  duration?: number;
};

export type EncodingProgress = {
  current: number;
  total: number;
  status: "idle" | "encoding" | "complete" | "error";
  error?: string;
};
