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

  private getSize(): number {
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

    return relativePosition;
  }

  public getResizerCenterPosition(): number {
    const resizerRect = this.resizerElement.getBoundingClientRect();
    const center = this.getPositionWithinSplit(
      this.layout.options.direction === "horizontal"
        ? resizerRect.left + resizerRect.width / 2
        : resizerRect.top + resizerRect.height / 2
    );

    return center;
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
      const mousePosition = this.getPositionWithinSplit(
        this.layout.options.direction === "horizontal" ? e.clientX : e.clientY
      );

      const position = resizerStartPosition + mousePosition - dragStartPosition;

      this.updatePaneSizes(position, true, true);

      const totalPercentage = this.layout.panes
        .map((pane) =>
          this.layout.options.direction === "horizontal"
            ? pane.element.style.width
            : pane.element.style.height
        )
        .filter((width) => width.includes("%"))
        .map((width) => width.replace("%", ""))
        .reduce((total, width) => total + parseFloat(width), 0);

      if (totalPercentage !== 100) {
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
    const paneSizesBeforeUpdate = this.getPaneSizes();

    const resizerRect = this.resizerElement.getBoundingClientRect();
    let resizerSizePixels =
      this.layout.options.direction === "horizontal"
        ? resizerRect.width
        : resizerRect.height;
    resizerSizePixels = parseFloat(resizerSizePixels.toFixed(1));

    let firstPaneSizePixels = newResizerPosition - resizerSizePixels / 2;
    let secondPaneSizePixels = this.getSize() - firstPaneSizePixels;

    const [firstPaneSizePixelsClamped, secondPaneSizePixelsClamped] =
      this.clampAndCascade(firstPaneSizePixels, secondPaneSizePixels);

    const layoutSizePixels = this.layout.getSize();

    const firstPaneSizePercentage =
      (firstPaneSizePixelsClamped / layoutSizePixels) * 100;

    const secondPaneSizePercentage =
      (secondPaneSizePixelsClamped / layoutSizePixels) * 100;

    if (applyFirstPaneSize) {
      this.panes[0].applySize(
        firstPaneSizePercentage,
        "%",
        this.layout.options.direction
      );
    }

    if (applySecondPaneSize) {
      this.panes[1].applySize(
        secondPaneSizePercentage,
        "%",
        this.layout.options.direction
      );
    }

    return [
      firstPaneSizePixelsClamped - paneSizesBeforeUpdate[0],
      secondPaneSizePixelsClamped - paneSizesBeforeUpdate[1],
    ];
  }

  private clampAndCascade(
    firstPaneSizeToApplyPixels: number,
    secondPaneSizeToApplyPixels: number
  ): [number, number] {
    const splitSizePixels = this.getSize();

    const [firstPaneMinSizePixels, secondPaneMinSizePixels] =
      this.getMinSizes();
    let [firstPaneMaxSizePixels, secondPaneMaxSizePixels] = this.getMaxSizes();

    if (firstPaneMinSizePixels > firstPaneMaxSizePixels) {
      firstPaneMaxSizePixels = firstPaneMinSizePixels;
    }
    if (secondPaneMinSizePixels > secondPaneMaxSizePixels) {
      secondPaneMaxSizePixels = secondPaneMinSizePixels;
    }

    let firstPaneSizePixelsClamped = firstPaneSizeToApplyPixels;
    let secondPaneSizePixelsClamped = secondPaneSizeToApplyPixels;

    const splitIndex = this.layout.splits.indexOf(this);

    if (
      isFinite(firstPaneMaxSizePixels) &&
      firstPaneSizeToApplyPixels > firstPaneMaxSizePixels
    ) {
      firstPaneSizePixelsClamped = firstPaneMaxSizePixels;
      secondPaneSizePixelsClamped =
        splitSizePixels - firstPaneSizePixelsClamped;
    } else if (
      isFinite(secondPaneMaxSizePixels) &&
      secondPaneSizeToApplyPixels > secondPaneMaxSizePixels
    ) {
      secondPaneSizePixelsClamped = secondPaneMaxSizePixels;
      firstPaneSizePixelsClamped =
        splitSizePixels - secondPaneSizePixelsClamped;
    }

    if (firstPaneSizePixelsClamped < firstPaneMinSizePixels) {
      firstPaneSizePixelsClamped = firstPaneMinSizePixels;
      secondPaneSizePixelsClamped =
        splitSizePixels - firstPaneSizePixelsClamped;

      if (splitIndex > 0) {
        const previousSplit = this.layout.splits[splitIndex - 1];

        const position =
          firstPaneSizeToApplyPixels -
          firstPaneMinSizePixels +
          previousSplit.getResizerCenterPosition();

        const previousSplitComputedPaneSizeDifferences =
          previousSplit.updatePaneSizes(position, true, false);

        secondPaneSizePixelsClamped +=
          previousSplitComputedPaneSizeDifferences[1];
      }
    } else if (
      firstPaneSizePixelsClamped >
      splitSizePixels - secondPaneMinSizePixels
    ) {
      firstPaneSizePixelsClamped = splitSizePixels - secondPaneMinSizePixels;
      secondPaneSizePixelsClamped =
        splitSizePixels - firstPaneSizePixelsClamped;

      if (splitIndex < this.layout.splits.length - 1) {
        const nextSplit = this.layout.splits[splitIndex + 1];

        const position =
          firstPaneSizeToApplyPixels -
          firstPaneSizePixelsClamped +
          nextSplit.getResizerCenterPosition();

        const nextSplitComputedPaneSizeDifferences = nextSplit.updatePaneSizes(
          position,
          false,
          true
        );

        firstPaneSizePixelsClamped += nextSplitComputedPaneSizeDifferences[0];
      }
    }

    return [firstPaneSizePixelsClamped, secondPaneSizePixelsClamped];
  }

  private getMinSizes(): [number, number] {
    const layoutSizePixels = this.layout.getSize();

    const firstPaneMinSize = this.panes[0].options.minSize;
    const secondPaneMinSize = this.panes[1].options.minSize;

    let result: [number, number] = [
      firstPaneMinSize?.value ?? 0,
      secondPaneMinSize?.value ?? 0,
    ];

    if (firstPaneMinSize?.unit === "%") {
      result[0] = (layoutSizePixels * firstPaneMinSize.value) / 100;
    }

    if (secondPaneMinSize?.unit === "%") {
      result[1] = (layoutSizePixels * secondPaneMinSize.value) / 100;
    }

    return result;
  }

  private getMaxSizes(): [number, number] {
    const layoutSizePixels = this.layout.getSize();

    const firstPaneMaxSize = this.panes[0].options.maxSize;
    const secondPaneMaxSize = this.panes[1].options.maxSize;

    let result: [number, number] = [
      firstPaneMaxSize?.value ?? Infinity,
      secondPaneMaxSize?.value ?? Infinity,
    ];

    if (firstPaneMaxSize?.unit === "%") {
      result[0] = (layoutSizePixels * firstPaneMaxSize.value) / 100;
    }

    if (secondPaneMaxSize?.unit === "%") {
      result[1] = (layoutSizePixels * secondPaneMaxSize.value) / 100;
    }

    return result;
  }
}
