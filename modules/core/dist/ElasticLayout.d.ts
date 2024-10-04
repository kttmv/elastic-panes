import { ElasticPane } from "./ElasticPane";
import { ElasticSplit } from "./ElasticSplit";
export declare class ElasticLayout {
    panes: ElasticPane[];
    splits: ElasticSplit[];
    resizerWidth: number;
    private parentElement;
    constructor(panes: ElasticPane[], options: {
        resizerWidth: number;
    });
    getSize(): number;
    apply(): void;
}
