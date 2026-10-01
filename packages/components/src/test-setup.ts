import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom does not implement scrollIntoView.
Element.prototype.scrollIntoView = function scrollIntoView() {
  /* no-op */
};

afterEach(() => {
  cleanup();
});
