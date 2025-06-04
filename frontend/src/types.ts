export type Box = {
  type: "box";
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
};

export type Polygon = {
  type: "polygon";
  points: [number, number][];
  label: string;
};

export type Annotation = Box | Polygon;

export type ImageMeta = {
  image_id: number;
  url: string;
};
