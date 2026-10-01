import type { Rect, Size, ViewportOptions } from "../dependency-graph/dependency-graph.types.js";

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

export const DEFAULT_PADDING = 24;
export const DEFAULT_ZOOM_RANGE: readonly [number, number] = [0.5, 2];

/** Scale + translate that fits `bounds` into `container` with `padding`, never above `maxZoom`. */
export const fitTransform = (
  bounds: Rect,
  container: Size,
  padding = DEFAULT_PADDING,
  maxZoom = 1,
): ViewportTransform => {
  const availW = Math.max(1, container.width - 2 * padding);
  const availH = Math.max(1, container.height - 2 * padding);
  const zoom =
    bounds.width <= 0 || bounds.height <= 0
      ? 1
      : Math.min(maxZoom, availW / bounds.width, availH / bounds.height);
  return {
    zoom,
    x: (container.width - bounds.width * zoom) / 2 - bounds.x * zoom,
    y: (container.height - bounds.height * zoom) / 2 - bounds.y * zoom,
  };
};

/** Zoom limits from the `viewport.zoom` option; without zoom the user cannot change the scale. */
export const zoomRange = (zoom: ViewportOptions["zoom"]): readonly [number, number] => {
  if (zoom === true) return DEFAULT_ZOOM_RANGE;
  if (zoom === undefined || zoom === false) return [0.05, 1];
  const [min, max] = zoom;
  return [Math.min(min, max), Math.max(min, max)];
};

/** Height the graph needs at the scale that fits `width` (used when the host sets no height). */
export const naturalHeight = (bounds: Rect, width: number, padding = DEFAULT_PADDING): number => {
  if (bounds.width <= 0) return bounds.height + 2 * padding;
  const zoom = Math.min(1, Math.max(0, width - 2 * padding) / bounds.width);
  return Math.ceil(bounds.height * zoom + 2 * padding);
};
