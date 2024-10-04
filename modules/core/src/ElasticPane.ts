export class ElasticPane {
  public element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  public applyWidthPercentage(percentage: number, resizerWidth: number) {
    // this.element.style.width = `calc(${percentage}% - ${resizerWidth / 2}px)`;
    this.element.style.width = `${percentage}%`;
  }
}
