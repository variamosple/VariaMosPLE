import React, { Component } from "react";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
 

interface Props { 
  model: Model
}

interface State {  
}

export default class ModelInformationEditor extends Component<Props, State> {
  state = {  
  };

  constructor(props: any) {
    super(props);   
  }   

  render() {
    return (
      <div className=""> 
          <div className="row">
                <div>
                  <div>
                    <label>Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder=""
                      id="inputName"
                      value={this.props.model.name}
                      onChange={this.inputName_onChange}
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      placeholder=""
                      id="inputDescription"
                      value={this.props.model.description}
                      onChange={this.inputDescription_onChange}
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <label>Author</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter the reference author"
                      id="inputAuthor"
                      value={this.props.model.author}
                      onChange={this.inputAuthor_onChange}
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <label>Source</label>
                    <textarea 
                      className="form-control"
                      placeholder="Enter the reference source"
                      id="inputSource"
                      value={this.props.model.source}
                      onChange={this.inputSource_onChange}
                    />
                  </div>
                </div>
              </div>
      </div>
    );
  }

  inputName_onChange=(e)=>{
     this.props.model.name=e.target.value;
     this.forceUpdate();
  }

  inputDescription_onChange=(e)=>{
     this.props.model.description=e.target.value;
     this.forceUpdate();
  }

  inputAuthor_onChange=(e)=>{
     this.props.model.author=e.target.value;
     this.forceUpdate();
  }

  inputSource_onChange=(e)=>{
     this.props.model.source=e.target.value;
     this.forceUpdate();
  }

} 
