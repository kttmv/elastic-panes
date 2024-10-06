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

  private getPaneSizes(): [number, number] {
    const firstRect = this.panes[0].element.getBoundingClientRect();
    const secondRect = this.panes[1].element.getBoundingClientRect();

    if (this.direction === "horizontal") {
      return [firstRect.width, secondRect.width];
    } else {
      return [firstRect.height, secondRect.height];
    }
  }

  private getPositionWithinSplit(position: number) {
    const rect = this.panes[0].element.getBoundingClientRect();
    const resizerRect = this.resizerElement.getBoundingClientRect();
    const resizerSize =
      this.direction === "horizontal" ? resizerRect.width : resizerRect.height;

    const relativePosition =
      position - (this.direction === "horizontal" ? rect.left : rect.top);

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

      this.updatePaneSizes(position, true, true);
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
    const layoutSizePixels = this.layout.getSize();
    const splitSizePixels = this.getSize();

    const paneSizesBeforeUpdate = this.getPaneSizes();

    const resizerRect = this.resizerElement.getBoundingClientRect();
    const resizerSizePixels =
      this.direction === "horizontal" ? resizerRect.width : resizerRect.height;

    let firstPaneSizePixels = newResizerPosition - resizerSizePixels / 2;
    let secondPaneSizePixels = splitSizePixels - firstPaneSizePixels;

    const [firstPaneSizePixelsClamped, secondPaneSizePixelsClamped] =
      this.clampToMinSizes(
        firstPaneSizePixels,
        secondPaneSizePixels,
        layoutSizePixels,
        splitSizePixels
      );

    const newSplitSizePixels =
      firstPaneSizePixelsClamped + secondPaneSizePixelsClamped;

    const newSplitSizePercentage =
      (newSplitSizePixels / layoutSizePixels) * 100;

    const firstPaneSizePercentage =
      newSplitSizePixels !== 0
        ? (firstPaneSizePixelsClamped / newSplitSizePixels) *
          newSplitSizePercentage
        : 0;

    const secondPaneSizePercentage =
      newSplitSizePixels !== 0
        ? (secondPaneSizePixelsClamped / newSplitSizePixels) *
          newSplitSizePercentage
        : 0;

    if (applyFirstPaneSize) {
      this.panes[0].applySizePercentage(
        firstPaneSizePercentage,
        this.direction
      );
    }

    if (applySecondPaneSize) {
      this.panes[1].applySizePercentage(
        secondPaneSizePercentage,
        this.direction
      );
    }

    return [
      firstPaneSizePixelsClamped - paneSizesBeforeUpdate[0],
      secondPaneSizePixelsClamped - paneSizesBeforeUpdate[1],
    ];
  }

  private clampToMinSizes(
    firstPaneSizeToApplyPixels: number,
    secondPaneSizeToApplyPixels: number,
    layoutSizePixels: number,
    splitSizePixels: number
  ): [number, number] {
    const firstPaneMinSizePercents = this.panes[0].options.minSize;
    const secondPaneMinSizePercents = this.panes[1].options.minSize;

    let firstPaneMinSizePixels = this.panes[0].options.minSizePixels ?? 0;
    let secondPaneMinSizePixels = this.panes[1].options.minSizePixels ?? 0;

    if (firstPaneMinSizePercents !== undefined) {
      firstPaneMinSizePixels =
        (layoutSizePixels * firstPaneMinSizePercents) / 100;
    }

    if (secondPaneMinSizePercents !== undefined) {
      secondPaneMinSizePixels =
        (layoutSizePixels * secondPaneMinSizePercents) / 100;
    }

    let firstPaneSizePixelsClamped = firstPaneSizeToApplyPixels;
    let secondPaneSizePixelsClamped = secondPaneSizeToApplyPixels;

    const splitIndex = this.layout.splits.indexOf(this);

    if (
      firstPaneMinSizePixels !== undefined &&
      firstPaneSizeToApplyPixels < firstPaneMinSizePixels
    ) {
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
      secondPaneMinSizePixels !== undefined &&
      firstPaneSizeToApplyPixels > splitSizePixels - secondPaneMinSizePixels
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
}
