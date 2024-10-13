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

  public getPanesTotalSize() {
    const rect = this.parentElement.getBoundingClientRect();

    let totalSize =
      this.options.direction === "horizontal" ? rect.width : rect.height;

    for (const split of this.splits) {
      const rect = split.resizerElement.getBoundingClientRect();
      const resizerSize =
        this.options.direction === "horizontal" ? rect.width : rect.height;
      totalSize -= resizerSize;
    }

    return totalSize <= 0 ? 0 : totalSize;
  }

  // todo: apply does not respect min sizes
  // it is possible to scale initial sizes so that they would be
  // smaller than their min sizes
  public apply() {
    for (const split of this.splits) {
      split.apply();
    }

    let totalSizeRelative = 0;
    let totalSizePercentage = 0;
    let totalSizePixels = 0;

    for (const pane of this.panes) {
      const initialSize = pane.options.initialSize;

      if (typeof initialSize === "number") {
        totalSizeRelative += initialSize;
      } else if (initialSize.unit === "%") {
        totalSizePercentage += initialSize.value;
      } else {
        totalSizePixels += initialSize.value;
      }
    }

    const parentRect = this.parentElement.getBoundingClientRect();
    const availableSize =
      this.options.direction === "horizontal"
        ? parentRect.width
        : parentRect.height;
    let availableSizePercentage =
      ((availableSize - totalSizePixels) / availableSize) * 100;

    if (
      (totalSizeRelative === 0 &&
        totalSizePercentage < availableSizePercentage) ||
      totalSizePercentage > availableSizePercentage
    ) {
      const scaleFactor = availableSizePercentage / totalSizePercentage;

      for (const pane of this.panes) {
        const initialSize = pane.options.initialSize;

        if (typeof initialSize !== "number" && initialSize.unit === "%") {
          initialSize.value *= scaleFactor;
        }
      }

      availableSizePercentage = 0;
    } else {
      availableSizePercentage -= totalSizePercentage;
    }

    for (const pane of this.panes) {
      const initialSize = pane.options.initialSize;

      if (typeof initialSize === "number") {
        pane.applySize(
          (initialSize / totalSizeRelative) * availableSizePercentage,
          "%",
          this.options.direction
        );
      } else if (initialSize.unit === "%") {
        pane.applySize(initialSize.value, "%", this.options.direction);
      } else {
        pane.applySize(initialSize.value, "px", this.options.direction);
      }
    }
  }
}
