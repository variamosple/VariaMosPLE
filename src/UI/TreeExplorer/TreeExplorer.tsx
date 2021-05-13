import React, { Component} from "react";
import {
  cProductLine,
} from "../../Domain/ProjectManagement/Entities/ProjectModel"; 
import RightClic from "./RightClic";
import ProjectService from "../../Infraestructure/project/ProjectService";

interface Props {
  projectService: ProjectService
}
interface State {}

class TreeExplorer extends Component<Props, State> {
  state = {};


  constructor(props: any) {
    super(props); 
    this.btnSave_onClick=this.btnSave_onClick.bind(this);
  }

  btnSave_onClick(e: any){
   this.props.projectService.saveProject();
  }

  render() {
    return (
      <div id="TreePannel" className="col-sm-2 p-1 h-100">
        <RightClic />
        <div className="col-sm-12 p-1 h-100">
          <div className="col-sm-12 h-100">
            <div className="card h-100 shadow-sm p-1 bg-body rounded">
              <div className="card-header text-center bg-lightblue-Variamos border-title-lighblue-variamos"> 
                {this.props.projectService.project.projectName}
              </div>
              <div className="card-body">
                <ul id="ul">
                  {this.props.projectService.project.productLines.map((pl: cProductLine, i: number) => (
                    <div>
                      <li key={i}>
                        <span className="fa fa-plus-square lps">
                          {pl.productLineName}
                        </span>
                        <ul className="nested">
                          <li>
                            <span className="fa fa-plus-square domainE">
                              Domain Engineering
                            </span>
                            <ul className="nested">
                              {pl.domainEngineering?.models?.map(
                                (domainModel) => (
                                  <div>
                                    <li>{domainModel.modelName}</li>
                                  </div>
                                )
                              )}
                            </ul>
                          </li>
                          <li>
                            <span className="fa fa-plus-square appE">
                              Application Engineering
                            </span>
                            <ul className="nested">
                              {pl.applicationEngineering?.models?.map(
                                (appEModel) => (
                                  <div>
                                    <li>{appEModel.modelName}</li>
                                  </div>
                                )
                              )}
                              <li>
                                {pl.applicationEngineering?.applications?.map((aeApp) => (
                                  <div>
                                    <span className="fa fa-plus-square aeApp">
                                      {aeApp.applicationName}
                                    </span>
                                    <ul className="nested">
                                      {aeApp.models?.map((aeApp) => (
                                        <div>
                                          <li>{aeApp.modelName}</li>
                                        </div>
                                      ))}
                                      {aeApp.adaptations?.map((aeCotext) => (
                                        <div>
                                          <li>
                                            <span className="fa fa-plus-square aeContext">
                                              {aeCotext.adaptationName}
                                            </span>
                                            <ul className="nested">
                                              {aeCotext.models?.map(
                                                (aeCotextModel) => (
                                                  <div>
                                                    <li>
                                                      {aeCotextModel.modelName}
                                                    </li>
                                                  </div>
                                                )
                                              )}
                                            </ul>
                                          </li>
                                        </div>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </div>
                  ))}
                </ul>
              </div>
              <div className="card-footer text-muted d-inline-block">
                <button className="btn btn-darkVariamos" onClick={this.btnSave_onClick}>Export Project</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TreeExplorer;
