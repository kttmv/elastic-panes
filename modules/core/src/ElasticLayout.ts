import { ElasticPane } from "./ElasticPane";
import { ElasticSplit } from "./ElasticSplit";
import { Direction } from "./types";

export type ElasticLayoutOptions = {
  direction?: Direction;
  snapDistance?: number;
};

export class ElasticLayout {
  public readonly panes: ElasticPane[];
  public readonly splits: ElasticSplit[];

  private readonly parentElement: HTMLElement;

  public readonly options: Required<ElasticLayoutOptions>;

  constructor(
    panes: ElasticPane[],
    { direction = "horizontal", snapDistance = 10 }: ElasticLayoutOptions
  ) {
    if (direction !== "horizontal" && direction !== "vertical") {
      throw new Error(
        `Unkown direction "${direction}". It must be either "horizontal" or "vertical"`
      );
    }

    if (panes.length < 2) {
      throw new Error("At least 2 panes must be provided");
    }

    const parent = panes[0].element.parentElement;
    if (parent === null) {
      throw new Error("Cannot find element parent");
    }

    for (let pane of panes) {
      if (pane.element.parentElement !== parent) {
        throw new Error("Elements have different parents");
      }
    }

    this.options = {
      direction,
      snapDistance,
    };

    const splits: ElasticSplit[] = [];
    for (let i = 0; i < panes.length; i++) {
      if (i === 0) continue;

      const split = new ElasticSplit(this, parent, panes[i - 1], panes[i]);
      splits.push(split);
    }

    this.panes = panes;
    this.splits = splits;
    this.parentElement = parent;
  }

  public getSize() {
    let totalSize = 0;

    for (const pane of this.panes) {
      const rect = pane.element.getBoundingClientRect();
      totalSize +=
        this.options.direction === "horizontal" ? rect.width : rect.height;
    }

    return totalSize;
  }

  public apply() {
    for (const split of this.splits) {
      split.apply();
    }

    let totalSizePercentage = 0;
    let totalSizePixels = 0;

    for (const pane of this.panes) {
      if (pane.options.initialSize !== undefined) {
        totalSizePercentage += pane.options.initialSize;
      } else {
        totalSizePixels += pane.options.initialSizePixels;
      }
    }

    const parentRect = this.parentElement.getBoundingClientRect();
    const availableSize =
      this.options.direction === "horizontal"
        ? parentRect.width
        : parentRect.height;
    const availableSizePercentage =
      ((availableSize - totalSizePixels) / availableSize) * 100;

    if (totalSizePercentage === 0) {
      throw new Error(
        "At least one pane should have initial size of greater than zero percents"
      );
    } else if (totalSizePercentage !== availableSizePercentage) {
      const scaleFactor = availableSizePercentage / totalSizePercentage;

      for (const pane of this.panes) {
        if (pane.options.initialSize !== undefined) {
          pane.options.initialSize *= scaleFactor;
        }
      }
    }

    for (const pane of this.panes) {
      if (pane.options.initialSizePixels !== undefined) {
        pane.applySizePixels(
          pane.options.initialSizePixels,
          this.options.direction
        );
      } else {
        pane.applySizePercentage(
          pane.options.initialSize,
          this.options.direction
        );
      }
    }
  }
}
