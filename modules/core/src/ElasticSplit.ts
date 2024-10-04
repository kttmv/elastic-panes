import { getPositionInsideSplit } from "./convert";
import { ElasticLayout } from "./ElasticLayout";
import { ElasticPane } from "./ElasticPane";

export class ElasticSplit {
  public panes: readonly [ElasticPane, ElasticPane];

  private layout: ElasticLayout;
  private parentElement: HTMLElement;
  private resizerElement: HTMLElement;
  private direction: "vertical" | "horizontal";

  constructor(
    layout: ElasticLayout,
    parentElement: HTMLElement,
    firstPane: ElasticPane,
    secondPane: ElasticPane,
    direction: "vertical" | "horizontal"
  ) {
    const resizerElement = document.createElement("div");
    resizerElement.className = "elastic-resizer";

    this.layout = layout;
    this.parentElement = parentElement;
    this.panes = [firstPane, secondPane];
    this.resizerElement = resizerElement;
    this.direction = direction;
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

      const firstPaneWidth =
        offsetPosition - this.resizerElement.getBoundingClientRect().width / 2;
      const secondPaneWidth = splitSize - firstPaneWidth;

      const firstPaneWidthRatioInsideSplit = firstPaneWidth / splitSize;
      const secondPaneWidthRatioInsideSplit = secondPaneWidth / splitSize;

      const firstPaneWidthRatio =
        firstPaneWidthRatioInsideSplit * splitSizeRatio;
      const secondPaneWidthRatio =
        secondPaneWidthRatioInsideSplit * splitSizeRatio;

      const firstPaneWidthPercentage = firstPaneWidthRatio * 100;
      const secondPaneWidthPercentage = secondPaneWidthRatio * 100;

      this.panes[0].applyWidthPercentage(firstPaneWidthPercentage);
      this.panes[1].applyWidthPercentage(secondPaneWidthPercentage);
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

    return firstRect.width + secondRect.width;
  }
}
