import { Method } from "axios";

export class ExternalFuntion {
  id: number;
  name: string;
  label: string;
  url: string;
  method: Method;
  header: object;
  request: object;
  resulting_action: string;
  language_id: number;

  constructor(
    id: number,
    name: string,
    label: string,
    url: string,
    method: Method,
    header: object,
    request: object,
    resulting_action: string,
    language_id: number
  ) {
    this.id = id;
    this.name = name;
    this.label = label;
    this.url = url;
    this.method = method;
    this.header = header;
    this.request = request;
    this.resulting_action = resulting_action;
    this.language_id = language_id;
  }
}
