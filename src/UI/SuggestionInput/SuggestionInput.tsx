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

  updateHighlightFromLastWord(text) {
    if (!this.state.data || !this.state.data.options || this.state.data.options.length === 0) {
      this.setState({ highlightedIndex: -1 });
      return;
    }
    const options = this.state.data.options;
    const parts = (text || "").split(/\s+/);
    const last = parts[parts.length - 1] || "";
    let idx = -1;
    if (last.length > 0) {
      const lw = last.toLowerCase();
      idx = options.findIndex(o => String(o).toLowerCase().startsWith(lw));
    }
    if (idx === -1) idx = 0;
    this.setState({ highlightedIndex: idx });
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
      if (data.options.length > 0) {
        if (!me.state.text.endsWith(" ")) {
          me.state.text += " ";
        }
      }
    }

    let highlightedIndex = -1;
    if (data.options && data.options.length > 0) {
      const base = (data.input || "").trim();
      const last = base.split(/\s+/).pop() || "";
      const lw = last.toLowerCase();
      highlightedIndex = lw.length > 0 ? data.options.findIndex(o => String(o).toLowerCase().startsWith(lw)) : 0;
      if (highlightedIndex === -1) highlightedIndex = 0;
    }

    me.state.showModal = true;
    me.state.highlightedIndex = highlightedIndex;
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
      if (options.length === 0) return;
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
    const value = e.target.value;
    if (!value) {
      this.state.text = value;
      this.forceUpdate();
      this.loadSuggestions();
    } else {
      this.setState({ text: value }, () => {
        if (this.state.showModal && this.state.data) {
          this.updateHighlightFromLastWord(this.state.text);
        }
      });
    }
    this.raiseOnChange(value);
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
    let text = this.state.text || "";
    if (value == ".") {
      text += value + "";
      text = text.replace(/ \./g, ".");
    }
    else if (value.startsWith("[")) {
      text += " ";
    }
    else {
      if (text.endsWith(" ")) {
        text += value + " ";
      }
      else {
        let parts = text.trimEnd().split(/\s+/);
        if (parts.length > 0) {
          parts[parts.length - 1] = value;
        } else {
          parts.push(value);
        }
        text = parts.join(" ") + " ";
      }
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
        this.loadSuggestions();
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
            autoComplete="new-item"
          />
          <div ref={this.modalDialogRef} className="autocomplete-items" >
            {this.renderOptions()}
          </div>
        </div>
      </span>
    );
  }
}
