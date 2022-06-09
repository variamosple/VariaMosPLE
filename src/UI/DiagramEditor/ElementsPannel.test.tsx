import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import MxPalette from "../MxPalette/MxPalette";

interface Props {
  projectService: ProjectService;
}
interface State {}

class ElementsPannel extends Component<Props, State> {
  state = {};

  // constructor(props: Props) {
  //     super(props);
  // }

  render() {
    return (
      <div id="ElementsPannel" className="" style={{ height: "35vh",overflow:"auto" }}>
        <div className="col-sm h-100 distribution-variamos">
          <div className="card text-center h-100 distribution-variamos shadow-sm bg-body rounded">
            <div className="card-header background-variamos">Elements</div>
            <div className="card-body bg-white-Variamos">
              <MxPalette projectService={this.props.projectService} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ElementsPannel;
