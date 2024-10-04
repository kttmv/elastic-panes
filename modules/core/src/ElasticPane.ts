export class ElasticPane {
  public element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  public applySizePercentage(
    percentage: number,
    direction: "vertical" | "horizontal"
  ) {
    const value = `${percentage}%`;

    if (direction === "horizontal") {
      this.element.style.width = value;
    } else {
      this.element.style.height = value;
    }
  }
}
