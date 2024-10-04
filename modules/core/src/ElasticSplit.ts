import { getPositionInsideSplit } from "./convert";
import { ElasticLayout } from "./ElasticLayout";
import { ElasticPane } from "./ElasticPane";

export class ElasticSplit {
  public panes: readonly [ElasticPane, ElasticPane];

  private layout: ElasticLayout;
  private splitPercentage: number;
  private parentElement: HTMLElement;
  private resizerElement: HTMLElement;
  public resizerWidth: number;

  constructor(
    layout: ElasticLayout,
    parentElement: HTMLElement,
    firstPane: ElasticPane,
    secondPane: ElasticPane,
    resizerWidth: number
  ) {
    const resizerElement = document.createElement("div");
    resizerElement.className = "elastic-resizer";
    resizerElement.style.width = `${resizerWidth}px`;
    resizerElement.style.minWidth = `${resizerWidth}px`;
    resizerElement.style.cursor = "col-resize";

    this.layout = layout;
    this.parentElement = parentElement;
    this.panes = [firstPane, secondPane];
    this.splitPercentage = 0;
    this.resizerElement = resizerElement;
    this.resizerWidth = resizerWidth;
  }

  public apply() {
    this.parentElement.insertBefore(this.resizerElement, this.panes[1].element);

    this.addDragHandler();
  }

  private addDragHandler() {
    let dragStartPosition: number;
    let resizerStartPosition: number;

    const dragStart = (e: MouseEvent) => {
      dragStartPosition = getPositionInsideSplit(e.clientX, this);

      const resizerBoundingClientRect =
        this.resizerElement.getBoundingClientRect();

      console.log(resizerBoundingClientRect);

      resizerStartPosition = getPositionInsideSplit(
        resizerBoundingClientRect.left + resizerBoundingClientRect.width / 2,
        this
      );

      document.addEventListener("mousemove", dragMove);
      document.addEventListener("mouseup", dragEnd);
    };

    const dragMove = (e: MouseEvent) => {
      const parentSize = this.layout.getSize();
      const splitSize = this.getSize();
      const splitSizeRatio = splitSize / parentSize;

      const mousePosition = getPositionInsideSplit(e.clientX, this);

      const offset = mousePosition - dragStartPosition;

      const offsetPosition = resizerStartPosition + offset;

      const firstPaneWidth = offsetPosition - this.resizerWidth / 2;
      const secondPaneWidth = splitSize - firstPaneWidth;

      const firstPaneWidthRatioInsideSplit = firstPaneWidth / splitSize;
      const secondPaneWidthRatioInsideSplit = secondPaneWidth / splitSize;

      const firstPaneWidthRatio =
        firstPaneWidthRatioInsideSplit * splitSizeRatio;
      const secondPaneWidthRatio =
        secondPaneWidthRatioInsideSplit * splitSizeRatio;

      const firstPaneWidthPercentage = firstPaneWidthRatio * 100;
      const secondPaneWidthPercentage = secondPaneWidthRatio * 100;

      this.panes[0].applyWidthPercentage(
        firstPaneWidthPercentage,
        this.resizerWidth
      );
      this.panes[1].applyWidthPercentage(
        secondPaneWidthPercentage,
        this.resizerWidth
      );
    };

    const dragEnd = () => {
      document.removeEventListener("mousemove", dragMove);
      document.removeEventListener("mouseup", dragEnd);
    };

    this.resizerElement.addEventListener("mousedown", dragStart);
  }

  public getSize() {
    const firstRect = this.panes[0].element.getBoundingClientRect();
    const secondRect = this.panes[1].element.getBoundingClientRect();

    let size = firstRect.width + secondRect.width;

    // const splitIndex = this.layout.splits.indexOf(this);
    // if (splitIndex > 0) {
    //   size += this.layout.splits[splitIndex - 1].resizerWidth / 2;
    // }

    // if (splitIndex < this.layout.splits.length - 1) {
    //   size += this.layout.splits[splitIndex + 1].resizerWidth / 2;
    // }

    return size;
  }
}
