import React, { Component } from "react";
import DiagramEditor from "../DiagramEditor/DiagramEditor";
import ElementsPannel from "../DiagramEditor/ElementsPannel";
import PropiertiesPannel from "../DiagramEditor/PropiertiesPannel";
import TreeExplorer from "../TreeExplorer/TreeExplorer";
import NavBar from "./navBar";

interface Props {}
interface State {}

class DashBoard extends Component<Props, State> {
  state = {};

  render() {
    return (
      <div className="container-fluid">
        <NavBar />

        <div className="row p-1 align-items-center" style={{ height: "92vh" }}>
          <TreeExplorer />

          <DiagramEditor />

          <div className="col-sm-2 p-1 h-100">
            <ElementsPannel />
            <PropiertiesPannel />
          </div>
        </div>
      </div>
    );
  }
}

export default DashBoard;
