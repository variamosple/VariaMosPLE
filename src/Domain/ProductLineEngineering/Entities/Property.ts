export class Property {
  name: string;
  type: string;
  config: any;
  value: any;
  constructor(name: string, type: string, value: any) {
    this.name = name;
    this.value = value;
  }
}
