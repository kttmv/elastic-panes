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

  private createResizerElement(): HTMLElement {
    const resizerElement = document.createElement("div");

    if (this.direction === "horizontal") {
      resizerElement.className = "elastic-resizer-horizontal";
    } else {
      resizerElement.className = "elastic-resizer-vertical";
    }

    return resizerElement;
  }

  public getSize(): number {
    const [firstRect, secondRect] = this.panes.map((pane) =>
      pane.element.getBoundingClientRect()
    );

    if (this.direction === "horizontal") {
      return firstRect.width + secondRect.width;
    } else {
      return firstRect.height + secondRect.height;
    }
  }

  public apply(): void {
    this.parentElement.insertBefore(this.resizerElement, this.panes[1].element);
    this.addDragHandler();
  }

  private addDragHandler(): void {
    let dragStartPosition: number;
    let resizerStartPosition: number;

    const dragStart = (e: MouseEvent): void => {
      dragStartPosition = this.getPositionWithinSplit(
        this.direction === "horizontal" ? e.clientX : e.clientY
      );

      const resizerRect = this.resizerElement.getBoundingClientRect();
      resizerStartPosition = this.getPositionWithinSplit(
        this.direction === "horizontal"
          ? resizerRect.left + resizerRect.width / 2
          : resizerRect.top + resizerRect.height / 2
      );

      document.addEventListener("mousemove", dragMove);
      document.addEventListener("mouseup", dragEnd);
    };

    const dragMove = (e: MouseEvent): void => {
      const mousePosition = this.getPositionWithinSplit(
        this.direction === "horizontal" ? e.clientX : e.clientY
      );

      const offset = resizerStartPosition + mousePosition - dragStartPosition;

      this.updatePaneSizes(offset);
    };

    const dragEnd = (): void => {
      document.removeEventListener("mousemove", dragMove);
      document.removeEventListener("mouseup", dragEnd);
    };

    this.resizerElement.addEventListener("mousedown", dragStart);
  }

  private updatePaneSizes(offsetPosition: number): void {
    const layoutSizePixels = this.layout.getSize();
    const splitSizePixels = this.getSize();

    const splitSizeRatio = splitSizePixels / layoutSizePixels;

    const resizerRect = this.resizerElement.getBoundingClientRect();
    const resizerSizePixels =
      this.direction === "horizontal" ? resizerRect.width : resizerRect.height;

    let firstPaneSizePixels = offsetPosition - resizerSizePixels / 2;

    const firstPaneMinSizePixels = this.panes[0].options.minSizePixels;
    const secondPaneMinSizePixels = this.panes[1].options.minSizePixels;

    if (
      firstPaneMinSizePixels !== undefined &&
      firstPaneSizePixels < firstPaneMinSizePixels
    ) {
      firstPaneSizePixels = firstPaneMinSizePixels;
    } else if (
      secondPaneMinSizePixels !== undefined &&
      splitSizePixels - firstPaneSizePixels < secondPaneMinSizePixels
    ) {
      firstPaneSizePixels = splitSizePixels - secondPaneMinSizePixels;
    }

    let secondPaneSizePixels = splitSizePixels - firstPaneSizePixels;

    const firstPaneSizeRatioWithinSplit = firstPaneSizePixels / splitSizePixels;

    let firstPaneSizePercentage =
      firstPaneSizeRatioWithinSplit * splitSizeRatio * 100;

    const firstPaneMinSizePercents = this.panes[0].options.minSize;
    const secondPaneMinSizePercents = this.panes[1].options.minSize;

    if (
      firstPaneMinSizePercents !== undefined &&
      firstPaneSizePercentage < firstPaneMinSizePercents
    ) {
      firstPaneSizePercentage = firstPaneMinSizePercents;
    } else if (
      secondPaneMinSizePercents !== undefined &&
      splitSizeRatio * 100 - firstPaneSizePercentage < secondPaneMinSizePercents
    ) {
      firstPaneSizePercentage =
        splitSizeRatio * 100 - secondPaneMinSizePercents;
    }

    let secondPaneSizePercentage =
      splitSizeRatio * 100 - firstPaneSizePercentage;

    this.panes[0].applySizePercentage(firstPaneSizePercentage, this.direction);
    this.panes[1].applySizePercentage(secondPaneSizePercentage, this.direction);
  }

  private getPositionWithinSplit(position: number) {
    const rect = this.panes[0].element.getBoundingClientRect();

    const relativePosition =
      position - (this.direction === "horizontal" ? rect.left : rect.top);

    const relativePositionClamped = Math.max(
      0,
      Math.min(relativePosition, this.getSize())
    );

    return relativePositionClamped;
  }
}
