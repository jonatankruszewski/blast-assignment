import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildDrawerSearch,
  ensureDefaultDrawerRoute,
  parseDrawerRoute,
  useDrawerRoute,
} from "./use-drawer-route.js";

function setUrl(search: string) {
  window.history.replaceState(null, "", `/${search}`);
}

describe("parseDrawerRoute", () => {
  it("returns defaults for an empty query", () => {
    expect(parseDrawerRoute("")).toEqual({
      guardrailId: null,
      tab: "overview",
      layers: "all",
      cloudUnit: null,
      range: "30d",
    });
  });

  it("reads every param", () => {
    expect(
      parseDrawerRoute("?guardrail=g1&tab=violations&layers=exclusions&cloudUnit=ou-1&range=90d"),
    ).toEqual({ guardrailId: "g1", tab: "violations", layers: "exclusions", cloudUnit: "ou-1", range: "90d" });
  });

  it("falls back on unknown values", () => {
    expect(parseDrawerRoute("?guardrail=g1&tab=nope&layers=x&range=1y")).toMatchObject({
      tab: "overview",
      layers: "all",
      range: "30d",
    });
  });
});

describe("buildDrawerSearch", () => {
  it("omits defaults and keeps unrelated params", () => {
    expect(
      buildDrawerSearch("?view=x&tab=tasks", {
        guardrailId: "g1",
        tab: "overview",
        layers: "all",
        cloudUnit: null,
        range: "30d",
      }),
    ).toBe("?view=x&guardrail=g1&tab=overview");
  });

  it("drops all drawer params when closed", () => {
    expect(
      buildDrawerSearch("?guardrail=g1&tab=tasks&range=7d", {
        guardrailId: null,
        tab: "tasks",
        layers: "violations",
        cloudUnit: "u",
        range: "7d",
      }),
    ).toBe("");
  });
});

describe("useDrawerRoute", () => {
  beforeEach(() => {
    setUrl("");
  });
  afterEach(() => {
    setUrl("");
  });

  it("opens, switches tab and closes through the URL", () => {
    const { result } = renderHook(() => useDrawerRoute());
    expect(result.current.route.guardrailId).toBeNull();

    act(() => {
      result.current.open("g1");
    });
    expect(window.location.search).toBe("?guardrail=g1&tab=overview");
    expect(result.current.route).toMatchObject({ guardrailId: "g1", tab: "overview" });

    act(() => {
      result.current.setTab("tasks");
    });
    expect(result.current.route.tab).toBe("tasks");

    act(() => {
      result.current.close();
    });
    expect(window.location.search).toBe("");
    expect(result.current.route.guardrailId).toBeNull();
  });

  it("pushes history for navigation but replaces it for filters", () => {
    const { result } = renderHook(() => useDrawerRoute());
    const start = window.history.length;
    act(() => {
      result.current.open("g1");
    });
    expect(window.history.length).toBe(start + 1);

    act(() => {
      result.current.setRange("7d");
      result.current.setLayers("violations");
      result.current.setCloudUnit("ou-production");
    });
    expect(window.history.length).toBe(start + 1);
    expect(result.current.route).toMatchObject({ range: "7d", layers: "violations", cloudUnit: "ou-production" });
  });

  it("follows back/forward (popstate)", () => {
    const { result } = renderHook(() => useDrawerRoute());
    act(() => {
      window.history.replaceState(null, "", "/?guardrail=g2&tab=exclusions");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.route).toMatchObject({ guardrailId: "g2", tab: "exclusions" });
  });
});

describe("ensureDefaultDrawerRoute", () => {
  afterEach(() => {
    setUrl("");
  });

  it("opens the demo guardrail only when there are no params", () => {
    setUrl("");
    ensureDefaultDrawerRoute("demo");
    expect(window.location.search).toBe("?guardrail=demo&tab=overview");

    setUrl("?view=gallery");
    ensureDefaultDrawerRoute("demo");
    expect(window.location.search).toBe("?view=gallery");
  });
});
