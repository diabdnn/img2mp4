export type ImageFile = {
  id: string;
  file: File;
  preview: string;
  name: string;
};

export type EncodingProgress = {
  current: number;
  total: number;
  status: "idle" | "encoding" | "complete" | "error";
  error?: string;
};
