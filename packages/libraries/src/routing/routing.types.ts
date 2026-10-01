export interface RouteOptions {
  /** `orthogonal` (default): elbow paths with rounded corners. `straight`: one segment. */
  routing?: "orthogonal" | "straight" | undefined;
  /** Corner radius for orthogonal paths. Default 8. */
  cornerRadius?: number | undefined;
  /** Minimum straight run out of / into a node before turning. Default 12. */
  stub?: number | undefined;
}
