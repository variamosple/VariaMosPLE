export class Property { 
  name: string;
  value: any;
  type: any;
  options: any; 
  linked_property: any; 
  linked_value: any; 
  constructor(name: string, value: any, type:any, options:any,linked_property:any,linked_value:any) { 
    this.name = name;
    this.value = value;
    this.type = type;
    this.options = options;
    this.linked_property = linked_property;
    this.linked_value = linked_value;
  }
}
