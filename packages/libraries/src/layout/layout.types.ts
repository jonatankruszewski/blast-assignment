export interface LayeredLayoutOptions {
  /** Horizontal gap between columns. Default 56. */
  rankSpacing?: number | undefined;
  /** Vertical gap between nodes in one column. Default 16. */
  nodeSpacing?: number | undefined;
  /** Space between a group's frame and its children. Default 24. */
  groupPadding?: number | undefined;
  /** Default distance between a satellite and its anchor (`attach.gap` wins). Default 16. */
  satelliteGap?: number | undefined;
  /** Gap between satellites sharing the same anchor side. Default 12. */
  satelliteSpacing?: number | undefined;
}

export interface ManualLayoutOptions {
  /** Space between a group's frame and its children. Default 24. */
  groupPadding?: number | undefined;
  /** Default distance between a satellite and its anchor (`attach.gap` wins). Default 16. */
  satelliteGap?: number | undefined;
  /** Gap between satellites sharing the same anchor side. Default 12. */
  satelliteSpacing?: number | undefined;
}
