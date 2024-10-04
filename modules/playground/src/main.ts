import "./style.css";
import { ElasticLayout, ElasticPane } from "@elastic-panes/core";

const a = document.getElementById("A")!;
const b = document.getElementById("B")!;
const c = document.getElementById("C")!;
const d = document.getElementById("D")!;

const paneA = new ElasticPane(a);
const paneB = new ElasticPane(b);
const paneC = new ElasticPane(c);
const paneD = new ElasticPane(d);

const layout = new ElasticLayout([paneA, paneB, paneC, paneD], {
  resizerWidth: 32,
});
layout.apply();
