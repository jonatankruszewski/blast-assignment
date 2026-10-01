import "@testing-library/jest-dom/vitest";

/**
 * jsdom has no layout. Elements report a fixed 100×40 size (or `data-test-size="WxH"` on the
 * element or its first child) so measurement-driven code runs in tests.
 */
const sizeOf = (el: Element): { width: number; height: number } => {
  const source =
    el.getAttribute("data-test-size") ?? el.firstElementChild?.getAttribute("data-test-size");
  if (source !== null && source !== undefined) {
    const [w, h] = source.split("x").map(Number);
    return { width: w ?? 0, height: h ?? 0 };
  }
  return { width: 100, height: 40 };
};

Object.defineProperties(HTMLElement.prototype, {
  offsetWidth: {
    configurable: true,
    get(this: HTMLElement) {
      return sizeOf(this).width;
    },
  },
  offsetHeight: {
    configurable: true,
    get(this: HTMLElement) {
      return sizeOf(this).height;
    },
  },
});

class ResizeObserverMock implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element): void {
    const { width, height } = sizeOf(target);
    const box = [{ inlineSize: width, blockSize: height }];
    const entry = {
      target,
      contentRect: { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height },
      borderBoxSize: box,
      contentBoxSize: box,
      devicePixelContentBoxSize: box,
    } as unknown as ResizeObserverEntry;
    queueMicrotask(() => {
      this.callback([entry], this);
    });
  }
  unobserve(): void {
    // Sizes are reported once on observe; nothing to stop.
  }
  disconnect(): void {
    // See unobserve.
  }
}
globalThis.ResizeObserver = ResizeObserverMock;

class DOMMatrixReadOnlyMock {
  m22: number;
  constructor(transform?: string) {
    const scale = /scale\(([\d.]+)\)/.exec(transform ?? "")?.[1];
    this.m22 = scale === undefined ? 1 : Number(scale);
  }
}
if (!("DOMMatrixReadOnly" in globalThis)) {
  Object.defineProperty(globalThis, "DOMMatrixReadOnly", { value: DOMMatrixReadOnlyMock });
}
