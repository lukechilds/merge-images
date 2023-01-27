import { Canvas, Image } from "canvas";

export type MergeImageOptions = {
  format?: string;
  quality?: number;
  width?: number;
  height?: number;
  Canvas?: typeof Canvas | undefined;
  Image?: typeof Image | undefined;
  crossOrigin?: "anonymous" | "use-credentials" | undefined;
};

export type MergeImageSource = {
  src: string;
  opacity?: number;
  x?: number;
  y?: number;
};
