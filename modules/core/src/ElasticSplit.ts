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

    sizes[0] = parseFloat(sizes[0].toFixed(1));
    sizes[1] = parseFloat(sizes[1].toFixed(1));

    return sizes;
  }

  private getPositionWithinSplit(position: number) {
    const rect = this.panes[0].element.getBoundingClientRect();

    const relativePosition =
      position -
      (this.layout.options.direction === "horizontal" ? rect.left : rect.top);

    return parseFloat(relativePosition.toFixed(1));
  }

  public getResizerCenterPosition(): number {
    const resizerRect = this.resizerElement.getBoundingClientRect();
    const center = this.getPositionWithinSplit(
      this.layout.options.direction === "horizontal"
        ? resizerRect.left + resizerRect.width / 2
        : resizerRect.top + resizerRect.height / 2
    );

    return parseFloat(center.toFixed(1));
  }

  private getResizerSize(): number {
    const resizerRect = this.resizerElement.getBoundingClientRect();
    const size =
      this.layout.options.direction === "horizontal"
        ? resizerRect.width
        : resizerRect.height;

    return parseFloat(size.toFixed(1));
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
      newResizerPosition = parseFloat(newResizerPosition.toFixed(1));

      this.updatePaneSizes(newResizerPosition, true, true);

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
    applyFirstPaneSize: boolean,
    applySecondPaneSize: boolean
  ): [number, number] {
    const layoutPanesTotalSize = this.layout.getPanesTotalSize();
    const splitTotalSize = this.getPanesTotalSize();
    const resizerSize = this.getResizerSize();

    const sizes: [number, number] = [
      newResizerPosition - resizerSize / 2,
      splitTotalSize - newResizerPosition + resizerSize / 2,
    ];

    const clampedSizes = this.clampSizes(sizes);
    const newSizes = this.cascadeResize(clampedSizes, sizes);

    const percentages = [
      (newSizes[0] / layoutPanesTotalSize) * 100,
      (newSizes[1] / layoutPanesTotalSize) * 100,
    ];

    percentages[0] = parseFloat(percentages[0].toFixed(1));
    percentages[1] = parseFloat(percentages[1].toFixed(1));

    const previousSizes = this.getPaneSizes();

    const direction = this.layout.options.direction;

    if (applyFirstPaneSize)
      this.panes[0].applySize(percentages[0], "%", direction);
    if (applySecondPaneSize)
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

    const maxSizes = this.getMaxSizes();
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

    const minSizes = this.getMinSizes();
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

  private cascadeResize(
    clampedSizes: [number, number],
    sizes: [number, number]
  ): [number, number] {
    let sizesAfterCascade = this.cascadeShrink(clampedSizes, sizes);
    return sizesAfterCascade;
  }

  /**
   * Handles increasing the sizes of adjacent panels when a panel reaches its
   * maximum size during resizing. This function allows a panel to continue
   * expanding by adjusting the sizes of neighboring panels accordingly.
   */
  private cascadeExpand() {}

  /**
   * Handles decreasing the sizes of adjacent panels when a panel reaches its
   * minimum size during resizing. This function ensures that additional space
   * is freed up to allow a panel to expand without restrictions.
   */
  private cascadeShrink(
    clampedSizes: [number, number],
    sizes: [number, number]
  ): [number, number] {
    const splitIndex = this.layout.splits.indexOf(this);
    const splitSize = this.getPanesTotalSize();

    const sizesAfterCascade: [number, number] = [...clampedSizes];

    if (sizes[0] < clampedSizes[0] && splitIndex !== 0) {
      const previousSplit = this.layout.splits[splitIndex - 1];
      const previousSplitCenter = previousSplit.getResizerCenterPosition();

      const position = previousSplitCenter - clampedSizes[0] + sizes[0];

      const difference = previousSplit.updatePaneSizes(position, true, false);

      sizesAfterCascade[1] += difference[1];
    } else if (
      sizes[0] > splitSize - clampedSizes[1] &&
      splitIndex !== this.layout.splits.length - 1
    ) {
      const nextSplit = this.layout.splits[splitIndex + 1];
      const nextSplitCenter = nextSplit.getResizerCenterPosition();

      const position = nextSplitCenter + sizes[0] - clampedSizes[0];

      const difference = nextSplit.updatePaneSizes(position, false, true);

      sizesAfterCascade[0] += difference[0];
    }

    return sizesAfterCascade;
  }

  private getMinSizes(): [number, number] {
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

  private getMaxSizes(): [number, number] {
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
