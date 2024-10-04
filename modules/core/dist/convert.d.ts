import { ElasticSplit } from "./ElasticSplit";
export declare function getMousePositionInsideElement(mouseX: number, mouseY: number, element: HTMLElement): {
    x: number;
    y: number;
};
export declare function getPositionInsideSplit(position: number, split: ElasticSplit): number;
