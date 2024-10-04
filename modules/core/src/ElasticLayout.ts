import { getMousePositionInsideElement } from "./convert";
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
      totalSize += pane.element.getBoundingClientRect().width;
    }

    return totalSize;
  }

  public apply() {
    for (const split of this.splits) {
      split.apply();
    }

    for (const pane of this.panes) {
      pane.applySizePercentage(100 / this.panes.length);
    }
  }
}
