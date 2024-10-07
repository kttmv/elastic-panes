type SizeOption = {
  value: number;
  unit: "px" | "%";
};

export type ElasticPaneOptions = {
  initialSize: number | SizeOption;
  minSize?: SizeOption;
};

function checkSizeOption(size?: SizeOption): void {
  if (size === undefined) {
    return;
  }

  if (!["px", "%"].includes(size.unit)) {
    throw new Error(`Unsupported unit type '${size.unit}'`);
  }

  if (size.value < 0) {
    throw new Error("Size value must be greater or equal to zero");
  }
}

export class ElasticPane {
  public readonly options: ElasticPaneOptions;

  constructor(
    public readonly element: HTMLElement,
    { initialSize, minSize = undefined }: ElasticPaneOptions
  ) {
    if (typeof initialSize !== "number") {
      checkSizeOption(initialSize);
    }
    checkSizeOption(minSize);

    this.options = {
      initialSize,
      minSize,
    };
  }

  public applySize(
    value: number,
    units: "px" | "%",
    direction: "vertical" | "horizontal"
  ) {
    const sizeValue = `${value}${units}`;

    if (direction === "horizontal") {
      this.element.style.width = sizeValue;
    } else {
      this.element.style.height = sizeValue;
    }
  }
}
