import React, { Component } from "react";
import axios, { Method } from "axios";
import "./SuggestionInput.css"

interface Props { }
interface State { }

export default class SuggestionInput extends Component<Props, State> {
  props = {
    className: null,
    onChange: null,
    value: null,
    endPoint: null
  };

  state = {
    text: null,
    showModal: false,
    data: null
  };

  inputTextRef = null;
  modalDialogRef = null;
  value = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      text: props["value"],
      showModal: false,
      data: null
    }

    this.modalDialogRef = React.createRef();
    this.inputTextRef = React.createRef();
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
    if (!this.props.endPoint) {
      return;
    }
    let url = this.props.endPoint;
    let request = {
      input: this.state.text
    };

    const config = {
      baseURL: url,
      method: "POST" as Method,
      data: request,
    };

    try {
      axios(config).then((res) => {
        let data = res.data;
        this.state.data = data;
        this.state.showModal = true;
        this.modalDialogRef.current.classList.add("show");
        this.forceUpdate();
      }).catch(function (error) {
        let x = 0;
        if (error.response) {
          // Request made and server responded
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
        }

      });
    } catch (error) {
      console.log("Something wrong in getExternalFunctions Service: " + error);
    }
  }

  loadSuggestionsHiba() {
    let url = "http://193.52.45.42:8989/suggest";
    let data = new URLSearchParams();
    data.append('q', 'The system shall provide');
    const config = {
      baseURL: url,
      method: "POST" as Method,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: data.toString(),
    };

    try {
      axios(config).then((res) => {
        let data = res.data;
        let x = 0;
      }).catch(function (error) {
        let x = 0;
        if (error.response) {
          // Request made and server responded
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
        }

      });
    } catch (error) {
      console.log("Something wrong in getExternalFunctions Service: " + error);
    }
  }

  inputText_onKeyDown(e) {
    if (e.keyCode == 32) {
      this.loadSuggestions();
    }
  }

  inputText_onChange(e) {
    this.setState({
      text: e.target.value
    });
    this.raiseOnChange(e.target.value);
  }

  inputOption_onClick(e) {
    this.state.data = null;
    let value = e.target.attributes["data-value"].value;
    let text = this.state.text
    if (!value.startsWith("<")) {
      text += value;
    }
    this.setState({
      text: text
    })
    this.raiseOnChange(text);
    this.inputTextRef.current.focus();
  }

  componentDidMount() { }

  renderOptions() {
    if (!this.state.data) {
      return;
    }
    let items = [];
    for (let i = 0; i < this.state.data.options.length; i++) {
      const option = this.state.data.options[i];
      items.push(
        <div data-value={option} onClick={this.inputOption_onClick.bind(this)}>
          {option}
        </div>
      )
    }
    return (
      <div>
        {items}
      </div>
    )
  }

  render() {
    return (
      <span>
        <div className="autocomplete">
          <textarea className="form-control" ref={this.inputTextRef} onKeyDown={this.inputText_onKeyDown.bind(this)} onChange={this.inputText_onChange.bind(this)} value={this.state.text} />
          <div ref={this.modalDialogRef} className="autocomplete-items" >
            {this.renderOptions()}
          </div>
        </div>
      </span>
    );
  }
} 
