import { getMousePositionInsideElement } from "./convert";
import { ElasticPane } from "./ElasticPane";
import { ElasticSplit } from "./ElasticSplit";

export class ElasticLayout {
  public panes: ElasticPane[];
  public splits: ElasticSplit[];

  public resizerWidth: number;
  private parentElement: HTMLElement;

  constructor(panes: ElasticPane[], options: { resizerWidth: number }) {
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
        options.resizerWidth
      );
      splits.push(split);
    }

    this.panes = panes;
    this.splits = splits;
    this.parentElement = parent;
    this.resizerWidth = options.resizerWidth;
  }

  public getSize() {
    let totalWidth = 0;

    for (const pane of this.panes) {
      totalWidth += pane.element.getBoundingClientRect().width;
    }

    return totalWidth;
  }

  public apply() {
    for (const split of this.splits) {
      split.apply();
    }

    for (const pane of this.panes) {
      pane.applyWidthPercentage(100 / this.panes.length, this.resizerWidth);
    }
  }
}
