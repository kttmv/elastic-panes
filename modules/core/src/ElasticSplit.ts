import { ElasticLayout } from "./ElasticLayout";
import { ElasticPane } from "./ElasticPane";

export class ElasticSplit {
  public readonly panes: readonly [ElasticPane, ElasticPane];

  private readonly resizerElement: HTMLElement;

  constructor(
    private readonly layout: ElasticLayout,
    private readonly parentElement: HTMLElement,
    firstPane: ElasticPane,
    secondPane: ElasticPane,
    private readonly direction: "vertical" | "horizontal"
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

    if (this.direction === "horizontal") {
      resizerElement.className = "elastic-resizer-horizontal";
    } else {
      resizerElement.className = "elastic-resizer-vertical";
    }

    return resizerElement;
  }

  private getSize(): number {
    const firstRect = this.panes[0].element.getBoundingClientRect();
    const secondRect = this.panes[1].element.getBoundingClientRect();

    if (this.direction === "horizontal") {
      return firstRect.width + secondRect.width;
    } else {
      return firstRect.height + secondRect.height;
    }
  }

  private getPositionWithinSplit(position: number) {
    const rect = this.panes[0].element.getBoundingClientRect();
    const resizerRect = this.resizerElement.getBoundingClientRect();
    const resizerSize =
      this.direction === "horizontal" ? resizerRect.width : resizerRect.height;

    const relativePosition =
      position - (this.direction === "horizontal" ? rect.left : rect.top);

    // const relativePositionClamped = Math.max(
    //   0,
    //   Math.min(relativePosition, this.getSize() + resizerSize)
    // );

    return relativePosition;
  }

  public getResizerCenterPosition(): number {
    const resizerRect = this.resizerElement.getBoundingClientRect();
    const center = this.getPositionWithinSplit(
      this.direction === "horizontal"
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
        this.direction === "horizontal" ? e.clientX : e.clientY
      );

      resizerStartPosition = this.getResizerCenterPosition();

      document.addEventListener("mousemove", dragMove);
      document.addEventListener("mouseup", dragEnd);
    };

    const dragMove = (e: MouseEvent): void => {
      const mousePosition = this.getPositionWithinSplit(
        this.direction === "horizontal" ? e.clientX : e.clientY
      );

      const position = resizerStartPosition + mousePosition - dragStartPosition;

      this.updatePaneSizes(position);
    };

    const dragEnd = (): void => {
      document.removeEventListener("mousemove", dragMove);
      document.removeEventListener("mouseup", dragEnd);
    };

    this.resizerElement.addEventListener("mousedown", dragStart);
  }

  public updatePaneSizes(position: number): void {
    // console.log(position);
    const layoutSizePixels = this.layout.getSize();
    const splitSizePixels = this.getSize();
    const splitSizeRatio = splitSizePixels / layoutSizePixels;

    const resizerRect = this.resizerElement.getBoundingClientRect();
    const resizerSizePixels =
      this.direction === "horizontal" ? resizerRect.width : resizerRect.height;

    let firstPaneSizePixels = position - resizerSizePixels / 2;

    const firstPaneSizeRatioWithinSplit = firstPaneSizePixels / splitSizePixels;
    let firstPaneSizePercentage =
      firstPaneSizeRatioWithinSplit * splitSizeRatio * 100;

    firstPaneSizePercentage = this.clampFirstPaneSizeToMinSizes(
      firstPaneSizePercentage,
      splitSizePixels,
      splitSizeRatio
    );

    const secondPaneSizePercentage =
      splitSizeRatio * 100 - firstPaneSizePercentage;

    this.applyPaneSizes(firstPaneSizePercentage, secondPaneSizePercentage);
  }

  private clampFirstPaneSizeToMinSizes(
    firstPaneSizePercentage: number,
    splitSizePixels: number,
    splitSizeRatio: number
  ): number {
    let firstPaneMinSizePercents = this.panes[0].options.minSize;
    let secondPaneMinSizePercents = this.panes[1].options.minSize;

    const firstPaneMinSizePixels = this.panes[0].options.minSizePixels ?? 0;
    const secondPaneMinSizePixels = this.panes[1].options.minSizePixels ?? 0;

    if (
      firstPaneMinSizePercents === undefined &&
      firstPaneMinSizePixels !== undefined
    ) {
      firstPaneMinSizePercents =
        (firstPaneMinSizePixels / splitSizePixels) * 100 * splitSizeRatio;
    }

    if (
      secondPaneMinSizePercents === undefined &&
      secondPaneMinSizePixels !== undefined
    ) {
      secondPaneMinSizePercents =
        (secondPaneMinSizePixels / splitSizePixels) * 100 * splitSizeRatio;
    }

    let firstPaneSizePercentageClamped = firstPaneSizePercentage;

    const splitIndex = this.layout.splits.indexOf(this);

    if (
      firstPaneMinSizePercents !== undefined &&
      firstPaneSizePercentage < firstPaneMinSizePercents
    ) {
      firstPaneSizePercentageClamped = firstPaneMinSizePercents;

      if (splitIndex > 0) {
        const previousSplit = this.layout.splits[splitIndex - 1];

        const position =
          ((firstPaneSizePercentage - firstPaneMinSizePercents) / 100) *
            splitSizePixels +
          previousSplit.getResizerCenterPosition();

        // console.log(`split size: ${splitSizePixels}`);
        // console.log(`firstPaneSizePercentage: ${firstPaneSizePercentage}`);
        // console.log(`firstPaneMinSizePercents: ${firstPaneMinSizePercents}`);
        // console.log(
        //   "result: " +
        //     ((firstPaneSizePercentage - firstPaneMinSizePercents) / 100) *
        //       splitSizePixels
        // );

        previousSplit.updatePaneSizes(position);
      }
    } else if (
      secondPaneMinSizePercents !== undefined &&
      splitSizeRatio * 100 - firstPaneSizePercentage < secondPaneMinSizePercents
    ) {
      firstPaneSizePercentageClamped =
        splitSizeRatio * 100 - secondPaneMinSizePercents;

      if (splitIndex < this.layout.splits.length - 1) {
        const nextSplit = this.layout.splits[splitIndex + 1];

        const position =
          ((firstPaneSizePercentage - firstPaneSizePercentageClamped) / 100) *
            splitSizePixels +
          nextSplit.getResizerCenterPosition();

        nextSplit.updatePaneSizes(position);
      }
    }

    return firstPaneSizePercentageClamped;
  }

  private applyPaneSizes(
    firstPaneSizePercentage: number,
    secondPaneSizePercentage: number
  ): void {
    this.panes[0].applySizePercentage(firstPaneSizePercentage, this.direction);
    this.panes[1].applySizePercentage(secondPaneSizePercentage, this.direction);
  }
}
