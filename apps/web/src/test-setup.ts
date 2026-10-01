import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom lacks the layout APIs the graph renderer (xyflow) and chart (recharts) rely on.
class ResizeObserverStub {
  observe() {
    // jsdom does no layout; nothing to observe.
  }
  unobserve() {
    // see observe()
  }
  disconnect() {
    // see observe()
  }
}
if (!("ResizeObserver" in globalThis)) {
  Object.defineProperty(globalThis, "ResizeObserver", {
    value: ResizeObserverStub,
    writable: true,
  });
}
class DOMMatrixReadOnlyStub {
  m22 = 1;
  constructor(transform?: string) {
    const scale = /scale\(([\d.]+)\)/.exec(transform ?? "")?.[1];
    this.m22 = scale ? Number(scale) : 1;
  }
}
if (!("DOMMatrixReadOnly" in globalThis)) {
  Object.defineProperty(globalThis, "DOMMatrixReadOnly", {
    value: DOMMatrixReadOnlyStub,
    writable: true,
  });
}

afterEach(() => {
  cleanup();
});
