import React, { Component } from "react";

interface Props { 
}
interface State {}

class RightClic extends Component<Props, State> {
  state = {};

  render() {
    return (
      <div>
        <ul className="dropdown-menu" id="context-menu">
          <li>
            <span className="dropdown-item" id="newModel">
              New Model
            </span>
          </li>
          <li>
            <span className="dropdown-item" id="newProducLine">
              New Product Line
            </span>
          </li>
          <li>
            <span className="dropdown-item" id="newApplication">
              New Application
            </span>
          </li>
          <li>
            <span className="dropdown-item" id="newAdaptation">
              New Adaptation
            </span>
          </li>
          <li>
            <hr className="dropdown-divider" />
          </li>
          <li>
            <span className="dropdown-item" id="renameItem">
              Raname
            </span>
          </li>
          <li>
            <span className="dropdown-item" id="deleteItem">
              Delete
            </span>
          </li>
        </ul>
        <script></script>
      </div>
    );
  }
}

export default RightClic;
