type InitialSizeOptions =
  | { initialSizePixels: number; initialSize?: never }
  | { initialSizePixels?: never; initialSize: number };

type MinSizeOptions =
  | { minSizePixels?: never; minSize?: never }
  | { minSizePixels: number; minSize?: never }
  | { minSizePixels?: never; minSize: number };

export type ElasticPaneOptions = InitialSizeOptions & MinSizeOptions & {};

export class ElasticPane {
  constructor(
    public readonly element: HTMLElement,
    public readonly options: ElasticPaneOptions
  ) {
    if (
      options.initialSizePixels !== undefined &&
      options.initialSize !== undefined
    ) {
      throw new Error(
        "Initial size must be set either as pixels or as percents, not both"
      );
    }

    if (options.minSize !== undefined && options.minSizePixels !== undefined) {
      throw new Error(
        "Minimal size must be set either as pixels or as percents, not both"
      );
    }
  }

  public applySizePercentage(
    percentage: number,
    direction: "vertical" | "horizontal"
  ) {
    const value = `${percentage}%`;

    if (direction === "horizontal") {
      this.element.style.width = value;
    } else {
      this.element.style.height = value;
    }
  }

  public applySizePixels(pixels: number, direction: "vertical" | "horizontal") {
    const value = `${pixels}px`;

    if (direction === "horizontal") {
      this.element.style.width = value;
    } else {
      this.element.style.height = value;
    }
  }
}
