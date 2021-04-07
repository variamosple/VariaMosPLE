import React, { Component } from "react";
import VariaMosLogo from "../../Addons/images/VariaMosLogo.png";

interface Props {}
interface State {}

class navBar extends Component<Props, State> {
  state = {};

  render() {
    return (
      <div>
        <nav className="navbar navbar-light bg-light p-2 shadow-sm bg-body rounded">
          <div className="container-fluid">
            <a
              className="navbar-brand p-1"
              href="https://variamos.com/home/variamos-web/"
              target="_blanck"
            >
              <img
                src={VariaMosLogo}
                alt=""
                width="240"
                height="48"
                className="d-inline-block align-top"
              />
            </a>
            <div className="row align-items-center">
              <ul className="list-inline">
                <li className="list-inline-item bg-light p-1">
                  <a
                    className="btn btn-darkVariamos"
                    href="https://variamos.com/home/variamos-web/"
                    target="_blanck"
                  >
                    Home
                  </a>
                </li>
                <li className="list-inline-item bg-light p-1">
                  <button
                    type="button"
                    className="btn btn-darkVariamos"
                    data-bs-toggle="modal"
                    data-bs-target="#staticBackdrop"
                    id="projectManagement"
                  >
                    Project Management
                  </button>
                </li>
                <li className="list-inline-item bg-light p-1">
                  <a
                    className="btn btn-darkVariamos"
                    href="https://github.com/VariaMosORG/VariaMos/wiki"
                    target="_blanck"
                  >
                    Docs
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}

export default navBar;
