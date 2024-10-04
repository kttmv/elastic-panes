import { ElasticLayout } from "./ElasticLayout";
import { ElasticPane } from "./ElasticPane";
export declare class ElasticSplit {
    panes: readonly [ElasticPane, ElasticPane];
    private layout;
    private splitPercentage;
    private parentElement;
    private resizerElement;
    resizerWidth: number;
    constructor(layout: ElasticLayout, parentElement: HTMLElement, firstPane: ElasticPane, secondPane: ElasticPane, resizerWidth: number);
    apply(): void;
    private addDragHandler;
    getSize(): number;
}
