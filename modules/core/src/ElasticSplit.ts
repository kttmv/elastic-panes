import { getPositionInsideSplit } from "./convert";
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
    resizerElement.className = "elastic-resizer";
    return resizerElement;
  }

  public getSize(): number {
    const [firstRect, secondRect] = this.panes.map((pane) =>
      pane.element.getBoundingClientRect()
    );

    return firstRect.width + secondRect.width;
  }

  public apply(): void {
    this.parentElement.insertBefore(this.resizerElement, this.panes[1].element);
    this.addDragHandler();
  }

  private addDragHandler(): void {
    let dragStartPosition: number;
    let resizerStartPosition: number;

    const dragStart = (e: MouseEvent): void => {
      dragStartPosition = getPositionInsideSplit(e.clientX, this);

      const resizerRect = this.resizerElement.getBoundingClientRect();
      resizerStartPosition = getPositionInsideSplit(
        resizerRect.left + resizerRect.width / 2,
        this
      );

      document.addEventListener("mousemove", dragMove);
      document.addEventListener("mouseup", dragEnd);
    };

    const dragMove = (e: MouseEvent): void => {
      const mousePosition = getPositionInsideSplit(e.clientX, this);
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
    const layoutSize = this.layout.getSize();
    const splitSize = this.getSize();
    const splitSizeRatio = splitSize / layoutSize;

    const resizerSize = this.resizerElement.getBoundingClientRect().width;
    const firstPaneSize = offsetPosition - resizerSize / 2;
    const secondPaneSize = splitSize - firstPaneSize;

    const firstPaneSizeRatioInsideSplit = firstPaneSize / splitSize;
    const secondPaneSizeRatioInsideSplit = secondPaneSize / splitSize;

    const firstPaneSizePercentage =
      firstPaneSizeRatioInsideSplit * splitSizeRatio * 100;
    const secondPaneSizePercentage =
      secondPaneSizeRatioInsideSplit * splitSizeRatio * 100;

    this.panes[0].applySizePercentage(firstPaneSizePercentage);
    this.panes[1].applySizePercentage(secondPaneSizePercentage);
  }
}
