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

  public updatePaneSizes(positionWithinSplit: number): void {
    const layoutSizePixels = this.layout.getSize();
    const splitSizePixels = this.getSize();
    const splitSizePercentage = (splitSizePixels / layoutSizePixels) * 100;

    const resizerRect = this.resizerElement.getBoundingClientRect();
    const resizerSizePixels =
      this.direction === "horizontal" ? resizerRect.width : resizerRect.height;

    let firstPaneSizePixels = positionWithinSplit - resizerSizePixels / 2;

    firstPaneSizePixels = this.clampFirstPaneSizeToMinSizes(
      firstPaneSizePixels,
      layoutSizePixels,
      splitSizePixels
    );

    const firstPaneSizeRatioWithinSplit =
      splitSizePixels === 0 ? 0 : firstPaneSizePixels / splitSizePixels;
    let firstPaneSizePercentage =
      firstPaneSizeRatioWithinSplit * splitSizePercentage;

    const secondPaneSizePercentage =
      splitSizePercentage - firstPaneSizePercentage;

    console.log(secondPaneSizePercentage);

    this.applyPaneSizes(firstPaneSizePercentage, secondPaneSizePercentage);
  }

  private clampFirstPaneSizeToMinSizes(
    firstPaneSizeToApplyPixels: number,
    layoutSizePixels: number,
    splitSizePixels: number
  ): number {
    const firstPaneMinSizePercents = this.panes[0].options.minSize;
    const secondPaneMinSizePercents = this.panes[1].options.minSize;

    let firstPaneMinSizePixels = this.panes[0].options.minSizePixels ?? 0;
    let secondPaneMinSizePixels = this.panes[1].options.minSizePixels ?? 0;

    if (
      firstPaneMinSizePixels === undefined &&
      firstPaneMinSizePercents !== undefined
    ) {
      firstPaneMinSizePixels =
        (layoutSizePixels * firstPaneMinSizePercents) / 100;
    }

    if (
      secondPaneMinSizePixels === undefined &&
      secondPaneMinSizePercents !== undefined
    ) {
      secondPaneMinSizePixels =
        (layoutSizePixels * secondPaneMinSizePercents) / 100;
    }

    let firstPaneSizePixelsClamped = firstPaneSizeToApplyPixels;

    const splitIndex = this.layout.splits.indexOf(this);

    if (
      firstPaneMinSizePixels !== undefined &&
      firstPaneSizeToApplyPixels < firstPaneMinSizePixels
    ) {
      firstPaneSizePixelsClamped = firstPaneMinSizePixels;

      if (splitIndex > 0) {
        const previousSplit = this.layout.splits[splitIndex - 1];

        const position =
          firstPaneSizeToApplyPixels -
          firstPaneMinSizePixels +
          previousSplit.getResizerCenterPosition();

        // console.log(`split size: ${splitSizePixels}`);
        // console.log(`firstPaneSizePercentage: ${firstPaneSizePercentage}`);
        // console.log(`firstPaneMinSizePercents: ${firstPaneMinSizePercents}`);
        // console.log(
        //   "result: " +
        //     ((firstPaneSizePercentage - firstPaneMinSizePercents) / 100) *
        //       splitSizePixels
        // );

        // const previousSplitFirstPaneRect =
        //   previousSplit.panes[0].element.getBoundingClientRect();
        // const previousSplitFirstPaneSize =
        //   this.direction === "horizontal"
        //     ? previousSplitFirstPaneRect.width
        //     : previousSplitFirstPaneRect.height;

        previousSplit.updatePaneSizes(position);
      }
    } else if (
      secondPaneMinSizePixels !== undefined &&
      firstPaneSizeToApplyPixels > splitSizePixels - secondPaneMinSizePixels
    ) {
      firstPaneSizePixelsClamped = splitSizePixels - secondPaneMinSizePixels;

      if (splitIndex < this.layout.splits.length - 1) {
        const nextSplit = this.layout.splits[splitIndex + 1];

        const position =
          firstPaneSizeToApplyPixels -
          firstPaneSizePixelsClamped +
          nextSplit.getResizerCenterPosition();

        nextSplit.updatePaneSizes(position);
      }
    }

    return firstPaneSizePixelsClamped;
  }

  private applyPaneSizes(
    firstPaneSizePercentage: number,
    secondPaneSizePercentage: number
  ): void {
    this.panes[0].applySizePercentage(firstPaneSizePercentage, this.direction);
    this.panes[1].applySizePercentage(secondPaneSizePercentage, this.direction);
  }
}
