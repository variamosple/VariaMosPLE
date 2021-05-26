export class Language {
  id: number;
  name: string;
  abstractSyntax: string;
  concreteSyntax: string;
  type: string;

  constructor(
    id: number,
    name: string,
    abstractSyntax: string,
    concreteSyntax: string,
    type: string
  ) {
    this.id = id;
    this.name = name;
    this.abstractSyntax = abstractSyntax;
    this.concreteSyntax = concreteSyntax;
    this.type = type;
  }
}
