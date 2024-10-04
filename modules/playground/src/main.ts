import "./style.css";
import { ElasticLayout, ElasticPane } from "@elastic-panes/core";

const container1 = document.getElementById("test-container-horizontal")!;
const container2 = document.getElementById("test-container-vertical")!;

const containerPane1 = new ElasticPane(container1, { initialSizePercents: 50 });
const containerPane2 = new ElasticPane(container2, { initialSizePercents: 50 });

const containerLayout = new ElasticLayout([containerPane1, containerPane2], {
  direction: "vertical",
});
containerLayout.apply();

const horizontal1 = document.getElementById("horizontal_1")!;
const horizontal2 = document.getElementById("horizontal_2")!;
const horizontal3 = document.getElementById("horizontal_3")!;
const horizontal4 = document.getElementById("horizontal_4")!;

const horizontalPane1 = new ElasticPane(horizontal1, {
  initialSizePixels: 15,
});
const horizontalPane2 = new ElasticPane(horizontal2, {
  initialSizePercents: 35,
});
const horizontalPane3 = new ElasticPane(horizontal3, {
  initialSizePercents: 40,
});
const horizontalPane4 = new ElasticPane(horizontal4, {
  initialSizePercents: 10,
});

const horizontalLayout = new ElasticLayout(
  [horizontalPane1, horizontalPane2, horizontalPane3, horizontalPane4],
  {
    direction: "horizontal",
  }
);
horizontalLayout.apply();

const vertical1 = document.getElementById("vertical_1")!;
const vertical2 = document.getElementById("vertical_2")!;
const vertical3 = document.getElementById("vertical_3")!;
const vertical4 = document.getElementById("vertical_4")!;

const verticalPane1 = new ElasticPane(vertical1, { initialSizePercents: 10 });
const verticalPane2 = new ElasticPane(vertical2, { initialSizePercents: 10 });
const verticalPane3 = new ElasticPane(vertical3, { initialSizePercents: 10 });
const verticalPane4 = new ElasticPane(vertical4, { initialSizePercents: 70 });

const verticalLayout = new ElasticLayout(
  [verticalPane1, verticalPane2, verticalPane3, verticalPane4],
  {
    direction: "vertical",
  }
);
verticalLayout.apply();
