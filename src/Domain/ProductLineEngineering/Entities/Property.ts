export class Property {
  id: string;
  name: string; //name
  value: any; //ConfigurationValue
  type: any; //Domain - String/Integer/Boolean/
  options: any; //PossibleValues
  linked_property: any;
  linked_value: any;
  custom: boolean;
  display: boolean;
  comment?: string; //comments
  possibleValues?: any; //list with "," - range with ".."" - example: one, two, ten - 1..10 - true, false
  possibleValuesLinks?: {}; //list with "," - range with ".."" - example: one, two, ten - 1..10 - true, false
  minCardinality?:number;
  maxCardinality?:number;
  metadata?: any;
  constraint?: string; //[1..1];[2..4]

  constructor(
    name: string,
    value: any,
    type: any,
    options: any,
    linked_property: any,
    linked_value: any,
    custom: boolean,
    display: boolean,
    comment: string,
    possibleValues: any,
    possibleValuesLinks: {},
    minCardinality: any,
    maxCardinality: any,
    constraint: any
  ) {
    this.id = generateId();
    this.name = name;
    this.value = value;
    this.type = type;
    this.options = options;
    this.linked_property = linked_property;
    this.linked_value = linked_value;
    this.custom = custom;
    this.display = display;
    this.comment = comment;
    this.possibleValues = possibleValues;
    this.possibleValuesLinks = possibleValuesLinks;
    this.minCardinality = minCardinality;
    this.maxCardinality = maxCardinality;
    this.constraint = constraint;
  }
}

function generateId(): string {
  var dt = new Date().getTime();
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    }
  );
  return uuid;
}
