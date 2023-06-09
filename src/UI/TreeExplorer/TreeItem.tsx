import React, { Component } from "react";
import "./TreeItem.css";

interface Props {
  icon: string,
  label: string,
  dataKey?: string,
  tag?: any,
  onClick?:any,
  onDoubleClick?:any,
  onAuxClick?:any
}

interface State {
  expanded: boolean
}

export class TreeItem extends Component<Props, State> {
  state = {
    expanded: true
  };

  constructor(props: any) {
    super(props);
  }

  expand_onClick() {
    this.setState({
      expanded: !this.state.expanded
    })
  }

  onClick(e){
    e.preventDefault();
    if (this.props.onClick) {
      this.props.onClick(this);
    }
  }

  onDoubleClick(e){
    e.preventDefault();
    if (this.props.onDoubleClick) {
      this.props.onDoubleClick(this);
    }
  }

  onAuxClick(e){
    e.preventDefault();
    if (this.props.onAuxClick) {
      this.props.onAuxClick({
        target: this,
        event: e
      });
    }
  }

  render() {
    let spanExpand;
    if (this.props.children) {
      if (this.state.expanded) {
        spanExpand= <span className="fa fa-plus-square fa-minus-square-o lps" onClick={this.expand_onClick.bind(this)} />
      }else{ 
        spanExpand= <span className="fa fa-plus-square fa-plus-square-o lps" onClick={this.expand_onClick.bind(this)} />
      }
    }

    return (
      <div className="TreeItem">
        <div>
          <span>
            {spanExpand}
            <span onClick={this.onClick.bind(this)} onDoubleClick={this.onDoubleClick.bind(this)}  onAuxClick={this.onAuxClick.bind(this)}><img src={this.props.icon} />{this.props.label}</span>
          </span>
        </div>
        {
          this.state.expanded &&
          <div className="children">
            {this.props.children}
          </div>
        }
      </div>
    )
  }
}