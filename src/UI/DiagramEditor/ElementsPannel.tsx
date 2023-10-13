import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import MxPalette from "../MxPalette/MxPalette";
import "./ElementsPannel.css";

interface Props {
  projectService: ProjectService;
}
interface State { }

class ElementsPannel extends Component<Props, State> {
  state = {};

  // constructor(props: Props) {
  //     super(props);
  // }

  render() {
    return (
      <div id="ElementsPannel" className="ElementsPannel">
        <div className="header">
          <i title="Elements"><span><img src="/images/palette/diagram.png"></img></span></i>
        </div>
        <div className="mxPaletteContainer">
          <MxPalette projectService={this.props.projectService} />
        </div>
      </div>
    );
  }
}

export default ElementsPannel;
