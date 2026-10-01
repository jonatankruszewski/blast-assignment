import { useSyncExternalStore } from "react";
import {
  GUARDRAIL_TABS,
  type ActivityRange,
  type DefenseLayer,
  type GuardrailTab,
} from "../domain/guardrail.types.js";

/** Drawer state that lives in the URL so links are shareable and back/forward works. */
export interface DrawerRoute {
  guardrailId: string | null;
  tab: GuardrailTab;
  layers: DefenseLayer;
  cloudUnit: string | null;
  range: ActivityRange;
}

const PARAM = {
  guardrail: "guardrail",
  tab: "tab",
  layers: "layers",
  cloudUnit: "cloudUnit",
  range: "range",
} as const;

const LAYERS: readonly DefenseLayer[] = ["all", "permissions", "exclusions", "violations"];
const RANGES: readonly ActivityRange[] = ["7d", "30d", "90d"];
const DEFAULTS = { tab: "overview", layers: "all", range: "30d" } as const;

/** Fired after our own push/replaceState calls (the browser only fires popstate on back/forward). */
const LOCATION_EVENT = "blast:locationchange";

function oneOf<T extends string>(list: readonly T[], value: string | null, fallback: T): T {
  return list.find((item) => item === value) ?? fallback;
}

function nonEmpty(value: string | null): string | null {
  return value === "" ? null : value;
}

export function parseDrawerRoute(search: string): DrawerRoute {
  const params = new URLSearchParams(search);
  return {
    guardrailId: nonEmpty(params.get(PARAM.guardrail)),
    tab: oneOf(GUARDRAIL_TABS, params.get(PARAM.tab), DEFAULTS.tab),
    layers: oneOf(LAYERS, params.get(PARAM.layers), DEFAULTS.layers),
    cloudUnit: nonEmpty(params.get(PARAM.cloudUnit)),
    range: oneOf(RANGES, params.get(PARAM.range), DEFAULTS.range),
  };
}

/** Serialises a route; defaults are left out to keep URLs short. Unrelated params are kept. */
export function buildDrawerSearch(current: string, route: DrawerRoute): string {
  const params = new URLSearchParams(current);
  for (const key of Object.values(PARAM)) params.delete(key);
  if (route.guardrailId) {
    params.set(PARAM.guardrail, route.guardrailId);
    params.set(PARAM.tab, route.tab);
    if (route.layers !== DEFAULTS.layers) params.set(PARAM.layers, route.layers);
    if (route.cloudUnit) params.set(PARAM.cloudUnit, route.cloudUnit);
    if (route.range !== DEFAULTS.range) params.set(PARAM.range, route.range);
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(LOCATION_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(LOCATION_EVENT, onChange);
  };
}

function getSearch() {
  return window.location.search;
}

function navigate(patch: Partial<DrawerRoute>, mode: "push" | "replace") {
  const { search, pathname, hash } = window.location;
  const next = buildDrawerSearch(search, { ...parseDrawerRoute(search), ...patch });
  if (next === search) return;
  const url = `${pathname}${next}${hash}`;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(LOCATION_EVENT));
}

/** Opens the demo guardrail when the app starts without any URL params. */
export function ensureDefaultDrawerRoute(guardrailId: string) {
  if (window.location.search === "") navigate({ guardrailId, tab: "overview" }, "replace");
}

export function useDrawerRoute() {
  const search = useSyncExternalStore(subscribe, getSearch, () => "");
  const route = parseDrawerRoute(search);
  return {
    route,
    open: (guardrailId: string, tab: GuardrailTab = "overview") => {
      navigate({ guardrailId, tab }, "push");
    },
    close: () => {
      navigate(
        { guardrailId: null, tab: "overview", layers: "all", cloudUnit: null, range: "30d" },
        "push",
      );
    },
    setTab: (tab: GuardrailTab) => {
      navigate({ tab }, "push");
    },
    setLayers: (layers: DefenseLayer) => {
      navigate({ layers }, "replace");
    },
    setCloudUnit: (cloudUnit: string | null) => {
      navigate({ cloudUnit }, "replace");
    },
    setRange: (range: ActivityRange) => {
      navigate({ range }, "replace");
    },
  };
}
