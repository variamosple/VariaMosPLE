import React, { Component } from "react";
import { Nav, Tab } from "react-bootstrap";
import ProjectService from "../../Application/Project/ProjectService";
import MxPalette from "../MxPalette/MxPalette";import {
  getCurrentConstraints,
  setModelConstraints,
} from "../../Domain/ProductLineEngineering/UseCases/QueryUseCases";
import "./ElementsPannel.css";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-lisp";

interface Props {
  projectService: ProjectService;
}
interface State { 
  arbitraryConstraints: string,
}

class ElementsPannel extends Component<Props, State> {
  state = {
    arbitraryConstraints: "",
  };

  constructor(props: Props) {
    super(props);
    this.setArbitraryConstraints = this.setArbitraryConstraints.bind(this);
  }

  setArbitraryConstraints(newArbitraryConstraints: string) {
    this.setState((prevState) => ({
      ...prevState,
      arbitraryConstraints: newArbitraryConstraints
    }))

    //Handle changes on the model's arbitrary constraints
    setModelConstraints(this.props.projectService, newArbitraryConstraints);
  }

  componentDidMount(): void {
    //Load constraints on model change
    const constraints = getCurrentConstraints(this.props.projectService);
    this.setArbitraryConstraints(constraints);
  }

  render() {
    return (
      <div id="ElementsPannel" className="ElementsPannel">
        <Tab.Container defaultActiveKey="palette">
          <Nav justify variant="tabs">
            <Nav.Item>
              <Nav.Link eventKey="palette"><span><img src="/images/palette/diagram.png" alt="Diagram palette"></img></span></Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="constraint"><span><img src="/images/editor/constraints.png" alt="Constraints editor"></img></span></Nav.Link>
            </Nav.Item>
          </Nav>  
          <Tab.Content>
            <Tab.Pane eventKey="palette">
              <div className="mxPaletteContainer">
                <MxPalette projectService={this.props.projectService} />
              </div>
            </Tab.Pane>
            <Tab.Pane eventKey="constraint">
              <p className="text-muted small w-100">
                Specify any relationships or constraints that cannot be
                graphically represented in your language using the CLIF
                language.
              </p>

              <Editor
                value={this.state.arbitraryConstraints}
                onValueChange={this.setArbitraryConstraints}
                highlight={(arbitraryConstraints) =>
                  highlight(arbitraryConstraints, languages.lisp, "lisp")
                }
                padding={10}
                className="editor"
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 18,
                  backgroundColor: "#1e1e1e",
                  caretColor: "gray",
                  color: "gray",
                  borderRadius: "10px",
                  overflow: "auto",
                }}
              />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </div>
    );
  }
}

export default ElementsPannel;


