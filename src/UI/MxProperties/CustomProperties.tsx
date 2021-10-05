import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";

interface Props {
  projectService: ProjectService;
}
interface State {
  values: any[];
}

export default class CustomProperties extends Component<Props, State> {
  containerRef: any;
  currentModel?: Model;
  currentObject?: any;
  elementDefinition?: any;

  constructor(props: Props) {
    super(props);
    this.containerRef = React.createRef();

    this.state = {
      values: [],
    };
  }

  render() {
    return <div className="CustomProperties"></div>;
  }
}
