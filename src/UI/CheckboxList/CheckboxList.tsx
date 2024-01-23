import React, { Component, ChangeEvent } from 'react';

export interface CheckboxItem {
  id: string;
  label: string;
}

interface CheckboxListProps {
  title: string;
  items: CheckboxItem[];
  onChange: any
}

interface CheckboxListState {
  checkboxes: { [key: string]: boolean };
}

export default class CheckboxList extends Component<CheckboxListProps, CheckboxListState> {

  value = [];

  constructor(props: CheckboxListProps) {
    super(props);
    this.state = {
      checkboxes: {},
    };

    if (this.props.items) {
      for (let i = 0; i < this.props.items.length; i++) {
        const item:any = this.props.items[i];
        this.state.checkboxes[item.id]=item.checked;
        if (item.checked) {
          this.value.push(item.id);
        }
      }
    }
  }

  // Handle checkbox change
  handleCheckboxChange = (checkboxId: string) => {
    let me = this;
    this.setState((prevState) => {
      const checkboxes = { ...prevState.checkboxes };
      checkboxes[checkboxId] = !checkboxes[checkboxId];
      return { checkboxes };
    });

    const indice = me.value.indexOf(checkboxId);

    if (indice !== -1) { 
      me.value.splice(indice, 1); 
    } else { 
      me.value.push(checkboxId); 
    } 

    if (this.props.onChange) {
      this.props.onChange({
        target: me,
        value: me.value
      })
    }
  };

  componentDidMount(): void {
    // if (this.props.items) {
    //   for (let i = 0; i < this.props.items.length; i++) {
    //     const item:any = this.props.items[i];
    //     this.state.checkboxes[item.id]=item.checked;
    //   }
    // }
  }

  // Render the checkbox list
  renderCheckboxes = () => {
    const { checkboxes } = this.state;

    return this.props.items.map((item) => (
      <div key={item.id}>
        <input
          type="checkbox"
          id={item.id}
          checked={checkboxes[item.id] || false}
          onChange={() => this.handleCheckboxChange(item.id)}
        />
        <label htmlFor={item.id}>{item.label}</label>
      </div>
    ));
  };

  render() {
    return (
      <div>
        {this.renderCheckboxes()}
      </div>
    );
  }
}