class ElasticPane {
    constructor(element) {
        this.element = element;
    }
    applyWidthPercentage(percentage, resizerWidth) {
        // this.element.style.width = `calc(${percentage}% - ${resizerWidth / 2}px)`;
        this.element.style.width = `${percentage}%`;
    }
}

function getPositionInsideSplit(position, split) {
    const relativePosition = position - split.panes[0].element.getBoundingClientRect().left;
    const relativePositionClamped = Math.max(0, Math.min(relativePosition, split.getSize()));
    return relativePositionClamped;
}

class ElasticSplit {
    constructor(layout, parentElement, firstPane, secondPane, resizerWidth) {
        const resizerElement = document.createElement("div");
        resizerElement.className = "elastic-resizer";
        resizerElement.style.width = `${resizerWidth}px`;
        resizerElement.style.minWidth = `${resizerWidth}px`;
        resizerElement.style.cursor = "col-resize";
        this.layout = layout;
        this.parentElement = parentElement;
        this.panes = [firstPane, secondPane];
        this.splitPercentage = 0;
        this.resizerElement = resizerElement;
        this.resizerWidth = resizerWidth;
    }
    apply() {
        this.parentElement.insertBefore(this.resizerElement, this.panes[1].element);
        this.addDragHandler();
    }
    addDragHandler() {
        let dragStartPosition;
        let resizerStartPosition;
        const dragStart = (e) => {
            dragStartPosition = getPositionInsideSplit(e.clientX, this);
            const resizerBoundingClientRect = this.resizerElement.getBoundingClientRect();
            console.log(resizerBoundingClientRect);
            resizerStartPosition = getPositionInsideSplit(resizerBoundingClientRect.left + resizerBoundingClientRect.width / 2, this);
            document.addEventListener("mousemove", dragMove);
            document.addEventListener("mouseup", dragEnd);
        };
        const dragMove = (e) => {
            console.log("drag move");
            const parentSize = this.layout.getSize();
            console.log(`parent: ${parentSize}`);
            let splitSize = this.getSize();
            console.log(`split: ${splitSize}`);
            const splitSizeRatio = splitSize / parentSize;
            console.log(`split ratio: ${splitSizeRatio}`);
            const mousePosition = getPositionInsideSplit(e.clientX, this);
            const offset = mousePosition - dragStartPosition;
            console.log(offset);
            console.log(resizerStartPosition);
            const offsetPosition = resizerStartPosition + offset;
            console.log(offsetPosition);
            const newFirstPaneWidth = offsetPosition - this.resizerWidth / 2;
            const newSecondPaneWidth = splitSize - newFirstPaneWidth;
            console.log(newFirstPaneWidth);
            console.log(newSecondPaneWidth);
            const newFirstPaneWidthRatioInsideSplit = newFirstPaneWidth / splitSize;
            const newSecondPaneWidthRatioInsideSplit = newSecondPaneWidth / splitSize;
            const newFirstPaneWidthRatio = newFirstPaneWidthRatioInsideSplit * splitSizeRatio;
            const newSecondPaneWidthRatio = newSecondPaneWidthRatioInsideSplit * splitSizeRatio;
            const newFirstPaneWidthPercentage = newFirstPaneWidthRatio * 100;
            const newSecondPaneWidthPercentage = newSecondPaneWidthRatio * 100;
            console.log(`first percentage: ${newFirstPaneWidthPercentage}`);
            console.log(`second percentage: ${newSecondPaneWidthPercentage}`);
            this.panes[0].applyWidthPercentage(newFirstPaneWidthPercentage, this.resizerWidth);
            this.panes[1].applyWidthPercentage(newSecondPaneWidthPercentage, this.resizerWidth);
        };
        const dragEnd = () => {
            document.removeEventListener("mousemove", dragMove);
            document.removeEventListener("mouseup", dragEnd);
        };
        this.resizerElement.addEventListener("mousedown", dragStart);
    }
    getSize() {
        const firstRect = this.panes[0].element.getBoundingClientRect();
        const secondRect = this.panes[1].element.getBoundingClientRect();
        let size = firstRect.width + secondRect.width;
        // const splitIndex = this.layout.splits.indexOf(this);
        // if (splitIndex > 0) {
        //   size += this.layout.splits[splitIndex - 1].resizerWidth / 2;
        // }
        // if (splitIndex < this.layout.splits.length - 1) {
        //   size += this.layout.splits[splitIndex + 1].resizerWidth / 2;
        // }
        return size;
    }
}

class ElasticLayout {
    constructor(panes, options) {
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
        const splits = [];
        for (let i = 0; i < panes.length; i++) {
            if (i === 0)
                continue;
            const split = new ElasticSplit(this, parent, panes[i - 1], panes[i], options.resizerWidth);
            splits.push(split);
        }
        this.panes = panes;
        this.splits = splits;
        this.parentElement = parent;
        this.resizerWidth = options.resizerWidth;
    }
    getSize() {
        let totalWidth = 0;
        for (const pane of this.panes) {
            totalWidth += pane.element.getBoundingClientRect().width;
        }
        return totalWidth;
    }
    apply() {
        for (const split of this.splits) {
            split.apply();
        }
        for (const pane of this.panes) {
            pane.applyWidthPercentage(100 / this.panes.length, this.resizerWidth);
        }
    }
}

export { ElasticLayout, ElasticPane };
