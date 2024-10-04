export type ElasticPaneOptions =
  | { initialSizePixels: number; initialSizePercents?: never }
  | { initialSizePixels?: never; initialSizePercents: number };

export class ElasticPane {
  constructor(
    public readonly element: HTMLElement,
    public readonly options: ElasticPaneOptions
  ) {
    if (
      options.initialSizePixels !== undefined &&
      options.initialSizePercents !== undefined
    ) {
      throw new Error(
        "Initial size must be set either as pixels or as percents, not both"
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
