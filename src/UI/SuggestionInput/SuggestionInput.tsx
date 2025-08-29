import React, { Component } from "react";
import axios, { Method } from "axios";
import "./SuggestionInput.css"
import ProjectService from "../../Application/Project/ProjectService";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import SuggestionInputReceivedEventArgs from "./SuggestionInputReceivedEventArgs";
import SuggestionInputHelper from "./SuggestionInputHelper";

interface Props {
  projectService: ProjectService;
  onSuggestionReceived?: SuggestionInputReceivedEventArgs;
}
interface State { }

export default class SuggestionInput extends Component<Props, State> {
  props = {
    className: null,
    onChange: null,
    value: null,
    endPoint: null,
    projectService: null,
    onSuggestionReceived: null
  };

  state = {
    text: null,
    showModal: false,
    data: null,
    highlightedIndex: -1
  };

  inputTextRef = null;
  modalDialogRef = null;
  value = null;
  suggestionInputHelper = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      text: props["value"],
      showModal: false,
      data: null,
      highlightedIndex: -1
    }

    this.modalDialogRef = React.createRef();
    this.inputTextRef = React.createRef();

    this.suggestionInputHelper = new SuggestionInputHelper();
  }

  raiseOnChange(value) {
    if (this.props.onChange) {
      this.value = value;
      this.props.onChange({
        target: this
      })
    }
  }

  loadSuggestions() {
    let me = this;
    let input = this.state.text;
    if (!input) {
      input = "";
    }

    let productLine: ProductLine = this.props.projectService.getProductLineSelected();

    let request = {
      input: input,
      domain: productLine.domain,
      type: productLine.type
    };

    let data = me.suggestionInputHelper.getOptions(request);
    me.state.data = data;
    me.state.text = data.input;
    if (data.input.length > 0) {
      if (!me.state.text.endsWith(" ")) {
        me.state.text += " ";
      }
    }

    me.state.showModal = true;
    me.state.highlightedIndex = data.options && data.options.length > 0 ? 0 : -1;
    me.modalDialogRef.current.classList.add("show");
    me.forceUpdate();
    if (me.props.onSuggestionReceived) {
      me.props.onSuggestionReceived({
        target: me,
        data: data
      })
    }
  }

  inputText_onKeyDown(e) {
    if (e.keyCode == 32) {
      e.preventDefault();
      this.loadSuggestions();
    }

    if (this.state.showModal && this.state.data) {
      const options = this.state.data.options || [];
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.setState((prev: any) => ({
          highlightedIndex: (prev.highlightedIndex + 1) % options.length
        }));
      }
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.setState((prev: any) => ({
          highlightedIndex: (prev.highlightedIndex - 1 + options.length) % options.length
        }));
      }
      else if (e.key === "Enter" || e.key === "Tab") {
        if (this.state.highlightedIndex >= 0 && this.state.highlightedIndex < options.length) {
          e.preventDefault();
          this.selectOption(options[this.state.highlightedIndex]);
        }
      }
    }
  }

  inputText_onChange(e) {
    if (!e.target.value) {
      this.state.text = e.target.value;
      this.forceUpdate();
      this.loadSuggestions();
    } else {
      this.setState({
        text: e.target.value
      });
    }
    this.raiseOnChange(e.target.value);
  }

  inputText_onFocus(e) {
    this.loadSuggestions();
  }

  inputOption_onClick(e) {
    let value = e.target.attributes["data-value"].value;
    this.selectOption(value);
  }

  selectOption(value) {
    this.state.data = null;
    let text = this.state.text;
    if (!value.startsWith("[")) {
      text += value + " ";
    }

    this.setState(
      {
        text: text,
        showModal: false,
        highlightedIndex: -1
      },
      () => {
        this.raiseOnChange(text);
        this.inputTextRef.current.focus();
        this.loadSuggestions(); // 👈 recargar sugerencias después de seleccionar
      }
    );
  }


  componentDidMount() { }

  renderOptions() {
    if (!this.state.data) {
      return;
    }
    let items = [];
    for (let i = 0; i < this.state.data.options.length; i++) {
      const option = this.state.data.options[i];
      let className = "div-item";
      if (i === this.state.highlightedIndex) {
        className += " highlighted";
      }
      items.push(
        <div
          key={i}
          className={className}
          data-value={option}
          onClick={this.inputOption_onClick.bind(this)}>
          {option}
        </div>
      )
    }
    return (
      <div className="div-container">
        {items}
      </div>
    )
  }

  render() {
    return (
      <span>
        <div className="autocomplete">
          <textarea
            className="form-control"
            ref={this.inputTextRef}
            onKeyDown={this.inputText_onKeyDown.bind(this)}
            onChange={this.inputText_onChange.bind(this)}
            onFocus={this.inputText_onFocus.bind(this)}
            value={this.state.text}
          />
          <div ref={this.modalDialogRef} className="autocomplete-items" >
            {this.renderOptions()}
          </div>
        </div>
      </span>
    );
  }
}
