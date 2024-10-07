import { c } from "../../../node_modules/vite/dist/node/types.d-aGj9QkWt";
import { ElasticLayout } from "./ElasticLayout";
import { ElasticPane } from "./ElasticPane";

export class ElasticSplit {
  public readonly panes: readonly [ElasticPane, ElasticPane];

  private readonly resizerElement: HTMLElement;

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
    const firstRect = this.panes[0].element.getBoundingClientRect();
    const secondRect = this.panes[1].element.getBoundingClientRect();

    if (this.layout.options.direction === "horizontal") {
      return firstRect.width + secondRect.width;
    } else {
      return firstRect.height + secondRect.height;
    }
  }

  private getPaneSizes(): [number, number] {
    const firstRect = this.panes[0].element.getBoundingClientRect();
    const secondRect = this.panes[1].element.getBoundingClientRect();

    if (this.layout.options.direction === "horizontal") {
      return [firstRect.width, secondRect.width];
    } else {
      return [firstRect.height, secondRect.height];
    }
  }

  private getPositionWithinSplit(position: number) {
    const rect = this.panes[0].element.getBoundingClientRect();
    const resizerRect = this.resizerElement.getBoundingClientRect();
    const resizerSize =
      this.layout.options.direction === "horizontal"
        ? resizerRect.width
        : resizerRect.height;

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
      this.layout.options.direction === "horizontal"
        ? resizerRect.width
        : resizerRect.height;

    let firstPaneSizePixels = newResizerPosition - resizerSizePixels / 2;
    let secondPaneSizePixels = splitSizePixels - firstPaneSizePixels;

    const [firstPaneSizePixelsClamped, secondPaneSizePixelsClamped] =
      this.clampAndCascade(firstPaneSizePixels, secondPaneSizePixels);

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
