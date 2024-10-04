import { ElasticPane } from "./ElasticPane";
import { ElasticSplit } from "./ElasticSplit";

export class ElasticLayout {
  public panes: ElasticPane[];
  public splits: ElasticSplit[];

  private parentElement: HTMLElement;
  private direction: "vertical" | "horizontal";

  constructor(
    panes: ElasticPane[],
    options: { direction?: "vertical" | "horizontal" }
  ) {
    if (
      options.direction !== undefined &&
      !["horizontal", "vertical"].includes(options.direction)
    ) {
      throw new Error(
        `Unkown direction "${options.direction}". It must be either "horizontal" or "vertical"`
      );
    }

    this.direction = options.direction ?? "horizontal";

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

    const splits: ElasticSplit[] = [];
    for (let i = 0; i < panes.length; i++) {
      if (i === 0) continue;

      const split = new ElasticSplit(
        this,
        parent,
        panes[i - 1],
        panes[i],
        this.direction
      );
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
      totalSize += this.direction === "horizontal" ? rect.width : rect.height;
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
      if (pane.options.initialSizePercents !== undefined) {
        totalSizePercentage += pane.options.initialSizePercents;
      } else {
        totalSizePixels += pane.options.initialSizePixels;
      }
    }

    const parentRect = this.parentElement.getBoundingClientRect();
    const availableSize =
      this.direction === "horizontal" ? parentRect.width : parentRect.height;
    const availableSizePercentage =
      ((availableSize - totalSizePixels) / availableSize) * 100;

    if (totalSizePercentage === 0) {
      throw new Error(
        "At least one pane should have initial size of greater than zero percents"
      );
    } else if (totalSizePercentage !== availableSizePercentage) {
      const scaleFactor = availableSizePercentage / totalSizePercentage;

      for (const pane of this.panes) {
        if (pane.options.initialSizePercents !== undefined) {
          pane.options.initialSizePercents *= scaleFactor;
        }
      }
    }

    for (const pane of this.panes) {
      if (pane.options.initialSizePixels !== undefined) {
        pane.applySizePixels(pane.options.initialSizePixels, this.direction);
      } else {
        pane.applySizePercentage(
          pane.options.initialSizePercents,
          this.direction
        );
      }
    }
  }
}
