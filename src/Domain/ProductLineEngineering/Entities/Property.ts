export class Property {
  name: string;
  type: string;
  config: any;
  value: any;
<<<<<<< HEAD
  constructor(name: string, type: string, value: any) {
=======
  type: any;
  options: any; 
  linked_property: any; 
  linked_value: any; 
  custom:boolean;
  display:boolean;
  constructor(name: string, value: any, type:any, options:any,linked_property:any,linked_value:any,custom:boolean,display:boolean) { 
>>>>>>> 463baa90e5a000e73c80a4800aedd9b0516b4172
    this.name = name;
    this.value = value;
    this.type = type;
    this.options = options;
    this.linked_property = linked_property;
    this.linked_value = linked_value;
    this.custom=custom;
    this.display=display;
  }
}
