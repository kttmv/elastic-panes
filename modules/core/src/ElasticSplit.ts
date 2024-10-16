import { ElasticLayout } from "./ElasticLayout";
import { ElasticPane } from "./ElasticPane";
import { roundToDecimalPlaces } from "./utilities";

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

    sizes[0] = roundToDecimalPlaces(sizes[0], 1);
    sizes[1] = roundToDecimalPlaces(sizes[1], 1);

    return sizes;
  }

  private getPositionWithinSplit(position: number) {
    const rect = this.panes[0].element.getBoundingClientRect();

    const relativePosition =
      position -
      (this.layout.options.direction === "horizontal" ? rect.left : rect.top);

    return roundToDecimalPlaces(relativePosition, 1);
  }

  public getResizerCenterPosition(): number {
    const resizerRect = this.resizerElement.getBoundingClientRect();
    const center = this.getPositionWithinSplit(
      this.layout.options.direction === "horizontal"
        ? resizerRect.left + resizerRect.width / 2
        : resizerRect.top + resizerRect.height / 2
    );

    return roundToDecimalPlaces(center, 1);
  }

  private getResizerSize(): number {
    const resizerRect = this.resizerElement.getBoundingClientRect();
    const size =
      this.layout.options.direction === "horizontal"
        ? resizerRect.width
        : resizerRect.height;

    return roundToDecimalPlaces(size, 1);
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
      if (this.layout.getAvailableSize() === 0) {
        return;
      }

      const mousePosition = this.getPositionWithinSplit(
        this.layout.options.direction === "horizontal" ? e.clientX : e.clientY
      );

      let newResizerPosition =
        resizerStartPosition + mousePosition - dragStartPosition;

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
    newResizerPosition = roundToDecimalPlaces(newResizerPosition, 0);

    const layoutPanesTotalSize = this.layout.getAvailableSize();
    const splitTotalSize = this.getPanesTotalSize();
    const resizerSize = this.getResizerSize();

    const previousSizes = this.getPaneSizes();

    const sizes: [number, number] = [
      newResizerPosition - resizerSize / 2,
      splitTotalSize - newResizerPosition + resizerSize / 2,
    ];

    sizes[0] = roundToDecimalPlaces(sizes[0], 1);
    sizes[1] = roundToDecimalPlaces(sizes[1], 1);

    const clampedSizes = this.clampSizes(sizes);

    const resizeDirection = sizes[0] > previousSizes[0] ? "right" : "left";
    const newSizes = this.cascadeResize(
      clampedSizes,
      sizes,
      resizeDirection,
      cascadedFrom
    );

    const percentages = [
      (newSizes[0] / layoutPanesTotalSize) * 100,
      (newSizes[1] / layoutPanesTotalSize) * 100,
    ];

    const direction = this.layout.options.direction;

    if (cascadedFrom === undefined || cascadedFrom === "right")
      this.panes[0].applySize(percentages[0], "%", direction);
    if (cascadedFrom === undefined || cascadedFrom === "left")
      this.panes[1].applySize(percentages[1], "%", direction);

    const difference: [number, number] = [
      newSizes[0] - previousSizes[0],
      newSizes[1] - previousSizes[1],
    ];

    return difference;
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

    clampedSizes[0] = roundToDecimalPlaces(clampedSizes[0], 1);
    clampedSizes[1] = roundToDecimalPlaces(clampedSizes[1], 1);

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

    clampedSizes[0] = roundToDecimalPlaces(clampedSizes[0], 1);
    clampedSizes[1] = roundToDecimalPlaces(clampedSizes[1], 1);

    return clampedSizes;
  }

  /**
   * Handles increasing or decreasing the sizes of adjacent panes when a pane
   * reaches its min and/or max size during resizing. This function allows a
   * pane to continue shrinking or expanding by adjusting the sizes of
   * neighboring panes accordingly.
   */
  private cascadeResize(
    clampedSizes: [number, number],
    sizes: [number, number],
    resizeDirection: "left" | "right",
    cascadedFrom?: "left" | "right"
  ): [number, number] {
    const splitIndex = this.layout.splits.indexOf(this);

    const minSizes = this.getPaneMinSizes();
    const maxSizes = this.getPaneMaxSizes();

    const sizesAfterCascade: [number, number] = [...clampedSizes];

    const firstSplit = splitIndex === 0;
    const lastSplit = splitIndex === this.layout.splits.length - 1;
    const edgeSplit = firstSplit || lastSplit;

    const a =
      clampedSizes[0] == minSizes[0] &&
      clampedSizes[1] == maxSizes[1] &&
      !edgeSplit;
    const b =
      clampedSizes[1] == minSizes[1] &&
      clampedSizes[0] == maxSizes[0] &&
      !edgeSplit;

    const shouldCascadeShrinkLeft =
      sizes[0] < clampedSizes[0] && (clampedSizes[1] < maxSizes[1] || a);
    const shouldCascadeExpandLeft =
      sizes[0] > clampedSizes[0] && (clampedSizes[1] > minSizes[1] || b);
    const shouldCascadeShrinkRight =
      sizes[1] < clampedSizes[1] && (clampedSizes[0] < maxSizes[0] || b);
    const shouldCascadeExpandRight =
      sizes[1] > clampedSizes[1] && (clampedSizes[0] > minSizes[0] || a);

    const shouldCascadeLeft =
      cascadedFrom !== "left" &&
      !firstSplit &&
      (shouldCascadeShrinkLeft || shouldCascadeExpandLeft);

    const shouldCascadeRight =
      cascadedFrom !== "right" &&
      !lastSplit &&
      (shouldCascadeShrinkRight || shouldCascadeExpandRight);

    let cascaded = false;
    const cascadeDifference: [number, number] = [0, 0]; // space freed up by cascade resize

    // we first try to cascade in the direction of the resize
    if (resizeDirection === "left" && shouldCascadeLeft) {
      const difference = this.cascadeLeft(clampedSizes, sizes);
      cascaded = true;

      if (!shouldCascadeRight) {
        cascadeDifference[1] += difference[1];
      }
    } else if (resizeDirection === "right" && shouldCascadeRight) {
      const difference = this.cascadeRight(clampedSizes, sizes);
      cascaded = true;

      if (!shouldCascadeLeft) {
        cascadeDifference[0] += difference[0];
      }
    }

    // if we cascaded in the resize direction and did not manage to free
    // up any space, then return early
    if (
      !(a || b) &&
      cascaded &&
      cascadeDifference[0] === 0 &&
      cascadeDifference[1] === 0
    ) {
      return sizesAfterCascade;
    }

    // cascade in the direction opposite to the resize direction
    if (resizeDirection === "left" && shouldCascadeRight) {
      const difference = this.cascadeRight(clampedSizes, sizes);
      if (!shouldCascadeLeft) {
        cascadeDifference[0] += difference[0];
      }
    } else if (resizeDirection === "right" && shouldCascadeLeft) {
      const difference = this.cascadeLeft(clampedSizes, sizes);
      if (!shouldCascadeRight) {
        cascadeDifference[1] += difference[1];
      }
    }

    sizesAfterCascade[0] += cascadeDifference[0];
    sizesAfterCascade[1] += cascadeDifference[1];

    return sizesAfterCascade;
  }

  private cascadeLeft(
    clampedSizes: [number, number],
    sizes: [number, number]
  ): [number, number] {
    const splitIndex = this.layout.splits.indexOf(this);
    const previousSplit = this.layout.splits[splitIndex - 1];
    const previousSplitPosition = previousSplit.getResizerCenterPosition();

    const position = previousSplitPosition - (clampedSizes[0] - sizes[0]);
    const difference = previousSplit.updatePaneSizes(position, "right");

    return difference;
  }

  private cascadeRight(
    clampedSizes: [number, number],
    sizes: [number, number]
  ): [number, number] {
    const splitIndex = this.layout.splits.indexOf(this);
    const nextSplit = this.layout.splits[splitIndex + 1];
    const nextSplitPosition = nextSplit.getResizerCenterPosition();

    const position = nextSplitPosition + (sizes[0] - clampedSizes[0]);
    const difference = nextSplit.updatePaneSizes(position, "left");

    return difference;
  }

  private getPaneMinSizes(): [number, number] {
    const layoutSize = this.layout.getAvailableSize();

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

    result[0] = roundToDecimalPlaces(result[0], 1);
    result[1] = roundToDecimalPlaces(result[1], 1);

    return result;
  }

  private getPaneMaxSizes(): [number, number] {
    const layoutSize = this.layout.getAvailableSize();

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

    result[0] = roundToDecimalPlaces(result[0], 1);
    result[1] = roundToDecimalPlaces(result[1], 1);

    return result;
  }
}
