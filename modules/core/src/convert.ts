import { ElasticSplit } from "./ElasticSplit";

export function getMousePositionInsideElement(
  mouseX: number,
  mouseY: number,
  element: HTMLElement
) {
  const rect = element.getBoundingClientRect();

  const x = mouseX - rect.left;
  const y = mouseY - rect.top;

  const relativeX = Math.max(0, Math.min(x, rect.width));
  const relativeY = Math.max(0, Math.min(y, rect.height));

  return { x: relativeX, y: relativeY };
}

export function getPositionInsideSplit(position: number, split: ElasticSplit) {
  const relativePosition =
    position - split.panes[0].element.getBoundingClientRect().left;

  const relativePositionClamped = Math.max(
    0,
    Math.min(relativePosition, split.getSize())
  );

  return relativePositionClamped;
}
