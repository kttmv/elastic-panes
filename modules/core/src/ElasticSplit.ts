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

      const firstPaneSize =
        offsetPosition - this.resizerElement.getBoundingClientRect().width / 2;
      const secondPaneSize = splitSize - firstPaneSize;

      const firstPaneSizeRatioInsideSplit = firstPaneSize / splitSize;
      const secondPaneSizeRatioInsideSplit = secondPaneSize / splitSize;

      const firstPaneSizeRatio = firstPaneSizeRatioInsideSplit * splitSizeRatio;
      const secondPaneSizeRatio =
        secondPaneSizeRatioInsideSplit * splitSizeRatio;

      const firstPaneSizePercentage = firstPaneSizeRatio * 100;
      const secondPaneSizePercentage = secondPaneSizeRatio * 100;

      this.panes[0].applySizePercentage(firstPaneSizePercentage);
      this.panes[1].applySizePercentage(secondPaneSizePercentage);
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
