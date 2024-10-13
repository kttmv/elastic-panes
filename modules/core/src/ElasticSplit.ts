import { ElasticLayout } from "./ElasticLayout";
import { ElasticPane } from "./ElasticPane";

export class ElasticSplit {
  public readonly panes: readonly [ElasticPane, ElasticPane];

  public readonly resizerElement: HTMLElement;

  constructor(
    private readonly layout: ElasticLayout,
    private readonly parentElement: HTMLElement,
    firstPane: ElasticPane,
    secondPane: ElasticPane
  ) {
    this.panes = [firstPane, secondPane];
    this.resizerElement = this.createResizerElement();
  }

  public apply(): void {
    this.parentElement.insertBefore(this.resizerElement, this.panes[1].element);
    this.addDragHandler();
  }

  private createResizerElement(): HTMLElement {
    const resizerElement = document.createElement("div");

    if (this.layout.options.direction === "horizontal") {
      resizerElement.className = "elastic-resizer-horizontal";
    } else {
      resizerElement.className = "elastic-resizer-vertical";
    }

    return resizerElement;
  }

  private getPanesTotalSize(): number {
    const sizes = this.getPaneSizes();

    return sizes[0] + sizes[1];
  }

  private getPaneSizes(): [number, number] {
    const firstRect = this.panes[0].element.getBoundingClientRect();
    const secondRect = this.panes[1].element.getBoundingClientRect();

    let sizes: [number, number] | undefined;

    if (this.layout.options.direction === "horizontal") {
      sizes = [firstRect.width, secondRect.width];
    } else {
      sizes = [firstRect.height, secondRect.height];
    }

    sizes[0] = parseFloat(sizes[0].toFixed(2));
    sizes[1] = parseFloat(sizes[1].toFixed(2));

    return sizes;
  }

  private getPositionWithinSplit(position: number) {
    const rect = this.panes[0].element.getBoundingClientRect();

    const relativePosition =
      position -
      (this.layout.options.direction === "horizontal" ? rect.left : rect.top);

    return parseFloat(relativePosition.toFixed(2));
  }

  public getResizerCenterPosition(): number {
    const resizerRect = this.resizerElement.getBoundingClientRect();
    const center = this.getPositionWithinSplit(
      this.layout.options.direction === "horizontal"
        ? resizerRect.left + resizerRect.width / 2
        : resizerRect.top + resizerRect.height / 2
    );

    return parseFloat(center.toFixed(2));
  }

  private getResizerSize(): number {
    const resizerRect = this.resizerElement.getBoundingClientRect();
    const size =
      this.layout.options.direction === "horizontal"
        ? resizerRect.width
        : resizerRect.height;

    return parseFloat(size.toFixed(2));
  }

  private addDragHandler(): void {
    let dragStartPosition: number;
    let resizerStartPosition: number;

    const dragStart = (e: MouseEvent): void => {
      dragStartPosition = this.getPositionWithinSplit(
        this.layout.options.direction === "horizontal" ? e.clientX : e.clientY
      );

      resizerStartPosition = this.getResizerCenterPosition();

      document.addEventListener("mousemove", dragMove);
      document.addEventListener("mouseup", dragEnd);
    };

    const dragMove = (e: MouseEvent): void => {
      if (this.layout.getPanesTotalSize() === 0) {
        return;
      }

      const mousePosition = this.getPositionWithinSplit(
        this.layout.options.direction === "horizontal" ? e.clientX : e.clientY
      );

      let newResizerPosition =
        resizerStartPosition + mousePosition - dragStartPosition;
      newResizerPosition = parseFloat(newResizerPosition.toFixed(2));

      this.updatePaneSizes(newResizerPosition);

      const totalPercentage = this.layout.panes
        .map((pane) =>
          this.layout.options.direction === "horizontal"
            ? pane.element.style.width
            : pane.element.style.height
        )
        .filter((width) => width.includes("%"))
        .map((width) => width.replace("%", ""))
        .reduce((total, width) => total + parseFloat(width), 0);

      if (Math.abs(totalPercentage - 100) > 0.0001) {
        console.error(totalPercentage);
      }
    };

    const dragEnd = (): void => {
      document.removeEventListener("mousemove", dragMove);
      document.removeEventListener("mouseup", dragEnd);
    };

    this.resizerElement.addEventListener("mousedown", dragStart);
  }

  public updatePaneSizes(
    newResizerPosition: number,
    cascadedFrom?: "left" | "right"
  ): [number, number] {
    const layoutPanesTotalSize = this.layout.getPanesTotalSize();
    const splitTotalSize = this.getPanesTotalSize();
    const resizerSize = this.getResizerSize();

    const sizes: [number, number] = [
      newResizerPosition - resizerSize / 2,
      splitTotalSize - newResizerPosition + resizerSize / 2,
    ];

    const clampedSizes = this.clampSizes(sizes);

    // clampedSizes[0] = parseFloat(clampedSizes[0].toFixed(2));
    // clampedSizes[1] = parseFloat(clampedSizes[1].toFixed(2));

    const newSizes = this.cascadeResize(clampedSizes, sizes, cascadedFrom);

    const percentages = [
      (newSizes[0] / layoutPanesTotalSize) * 100,
      (newSizes[1] / layoutPanesTotalSize) * 100,
    ];

    percentages[0] = parseFloat(percentages[0].toFixed(2));
    percentages[1] = parseFloat(percentages[1].toFixed(2));

    const previousSizes = this.getPaneSizes();

    const direction = this.layout.options.direction;

    if (cascadedFrom === undefined || cascadedFrom === "right")
      this.panes[0].applySize(percentages[0], "%", direction);
    if (cascadedFrom === undefined || cascadedFrom === "left")
      this.panes[1].applySize(percentages[1], "%", direction);

    return [newSizes[0] - previousSizes[0], newSizes[1] - previousSizes[1]];
  }

  private clampSizes(sizes: [number, number]): [number, number] {
    let clampedSizes = this.clampToMaxSizes(sizes);
    clampedSizes = this.clampToMinSizes(clampedSizes);

    return clampedSizes;
  }

  private clampToMaxSizes(sizes: [number, number]): [number, number] {
    const splitSize = this.getPanesTotalSize();

    const maxSizes = this.getPaneMaxSizes();
    const clampedSizes: [number, number] = [...sizes];

    if (isFinite(maxSizes[0]) && sizes[0] > maxSizes[0]) {
      clampedSizes[0] = maxSizes[0];
      clampedSizes[1] = splitSize - clampedSizes[0];
    } else if (isFinite(maxSizes[1]) && sizes[1] > maxSizes[1]) {
      clampedSizes[1] = maxSizes[1];
      clampedSizes[0] = splitSize - clampedSizes[1];
    }

    return clampedSizes;
  }

  private clampToMinSizes(sizes: [number, number]): [number, number] {
    const splitSize = this.getPanesTotalSize();

    const minSizes = this.getPaneMinSizes();
    const clampedSizes: [number, number] = [...sizes];

    if (sizes[0] < minSizes[0]) {
      clampedSizes[0] = minSizes[0];
      clampedSizes[1] = splitSize - clampedSizes[0];
    } else if (sizes[0] > splitSize - minSizes[1]) {
      clampedSizes[0] = splitSize - minSizes[1];
      clampedSizes[1] = minSizes[1];
    }

    return clampedSizes;
  }

  /**
   * Handles increasing or decreasing the sizes of adjacent panes when a pane
   * reaches its maximum size during resizing. This function allows a pane to
   * continue expanding by adjusting the sizes of neighboring panes accordingly.
   */
  private cascadeResize(
    clampedSizes: [number, number],
    sizes: [number, number],
    cascadedFrom?: "left" | "right"
  ): [number, number] {
    const splitIndex = this.layout.splits.indexOf(this);
    const lastSplitIndex = this.layout.splits.length - 1;

    const minSizes = this.getPaneMinSizes();
    const maxSizes = this.getPaneMaxSizes();

    const sizesAfterCascade: [number, number] = [...clampedSizes];

    const a = clampedSizes[0] == minSizes[0] && clampedSizes[1] == maxSizes[1];
    const b = clampedSizes[1] == minSizes[1] && clampedSizes[0] == maxSizes[0];

    // investigate if comparing to min and max sizes is really necessary
    const shouldCascadeShrinkLeft =
      sizes[0] < clampedSizes[0] && (clampedSizes[1] < maxSizes[1] || a);
    const shouldCascadeExpandLeft =
      sizes[0] > clampedSizes[0] && (clampedSizes[1] > minSizes[1] || b);
    const shouldCascadeShrinkRight =
      sizes[1] < clampedSizes[1] && (clampedSizes[0] < maxSizes[0] || a);
    const shouldCascadeExpandRight =
      sizes[1] > clampedSizes[1] && (clampedSizes[0] > minSizes[0] || b);

    const shouldCascadeLeft =
      cascadedFrom !== "left" &&
      splitIndex > 0 &&
      (shouldCascadeShrinkLeft || shouldCascadeExpandLeft);

    const shouldCascadeRight =
      cascadedFrom !== "right" &&
      splitIndex < lastSplitIndex &&
      (shouldCascadeShrinkRight || shouldCascadeExpandRight);

    if (shouldCascadeRight) {
      const nextSplit = this.layout.splits[splitIndex + 1];
      const nextSplitPosition = nextSplit.getResizerCenterPosition();

      const position = nextSplitPosition + (sizes[0] - clampedSizes[0]);

      const difference = nextSplit.updatePaneSizes(position, "left");

      if (!shouldCascadeLeft) {
        sizesAfterCascade[0] += difference[0];
      }
    }

    if (shouldCascadeLeft) {
      const previousSplit = this.layout.splits[splitIndex - 1];
      const previousSplitPosition = previousSplit.getResizerCenterPosition();

      const position = previousSplitPosition - (clampedSizes[0] - sizes[0]);

      const difference = previousSplit.updatePaneSizes(position, "right");

      if (!shouldCascadeRight) {
        sizesAfterCascade[1] += difference[1];
      }
    }

    return sizesAfterCascade;
  }

  private getPaneMinSizes(): [number, number] {
    const layoutSize = this.layout.getPanesTotalSize();

    const minSizes = [
      this.panes[0].options.minSize,
      this.panes[1].options.minSize,
    ];

    let result: [number, number] = [
      minSizes[0]?.value ?? 0,
      minSizes[1]?.value ?? 0,
    ];

    if (minSizes[0]?.unit === "%") {
      result[0] = (layoutSize * minSizes[0].value) / 100;
    }

    if (minSizes[1]?.unit === "%") {
      result[1] = (layoutSize * minSizes[1].value) / 100;
    }

    return result;
  }

  private getPaneMaxSizes(): [number, number] {
    const layoutSize = this.layout.getPanesTotalSize();

    const maxSizes = [
      this.panes[0].options.maxSize,
      this.panes[1].options.maxSize,
    ];

    let result: [number, number] = [
      maxSizes[0]?.value ?? Infinity,
      maxSizes[1]?.value ?? Infinity,
    ];

    if (maxSizes[0]?.unit === "%") {
      result[0] = (layoutSize * maxSizes[0].value) / 100;
    }

    if (maxSizes[1]?.unit === "%") {
      result[1] = (layoutSize * maxSizes[1].value) / 100;
    }

    return result;
  }
}
