import { Button, ErrorState, Spinner, Stack } from "@blast/components";
import { Component, lazy, Suspense, type ReactNode } from "react";

/** Dev-only views served from the same dev server (`?view=...`). Loaded lazily so they stay out of the app bundle. */
export const DEV_VIEWS = {
  gallery: {
    label: "Component gallery",
    Component: lazy(() =>
      import("@blast/components/gallery").then((m) => ({ default: m.Gallery })),
    ),
  },
  "graph-playground": {
    label: "Graph playground",
    Component: lazy(() =>
      import("@blast/libraries/playground").then((m) => ({ default: m.Playground })),
    ),
  },
} as const;

export type DevViewId = keyof typeof DEV_VIEWS;

export function readDevView(search: string): DevViewId | null {
  const view = new URLSearchParams(search).get("view");
  return view === "gallery" || view === "graph-playground" ? view : null;
}

function goTo(search: string) {
  window.location.assign(`${window.location.pathname}${search}`);
}

/** Small nav for the top bar (dev builds only). */
export function DevNav() {
  return (
    <Stack direction="row" gap={2} align="center">
      {Object.entries(DEV_VIEWS).map(([id, view]) => (
        <Button
          key={id}
          variant="ghost"
          size="sm"
          onClick={() => {
            goTo(`?view=${id}`);
          }}
        >
          {view.label}
        </Button>
      ))}
    </Stack>
  );
}

interface BoundaryState {
  error: Error | null;
}

class DevViewBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  override state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="This dev view is not available yet"
          description={this.state.error.message}
          onRetry={() => {
            window.location.reload();
          }}
        />
      );
    }
    return this.props.children;
  }
}

export function DevView({ id }: { id: DevViewId }) {
  const { Component: View, label } = DEV_VIEWS[id];
  return (
    <Stack direction="column" gap={4} padding={4}>
      <Stack direction="row" gap={2} align="center">
        <Button
          variant="link"
          onClick={() => {
            goTo("");
          }}
        >
          Back to app
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            goTo(`?view=${id === "gallery" ? "graph-playground" : "gallery"}`);
          }}
        >
          {id === "gallery" ? DEV_VIEWS["graph-playground"].label : DEV_VIEWS.gallery.label}
        </Button>
      </Stack>
      <DevViewBoundary>
        <Suspense fallback={<Spinner label={`Loading ${label.toLowerCase()}`} />}>
          <View />
        </Suspense>
      </DevViewBoundary>
    </Stack>
  );
}
