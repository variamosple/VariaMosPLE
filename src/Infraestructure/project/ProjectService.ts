import { getLanguages, getLanguagesNative } from "../../DataProvider/Services/languageService";

export default class ProjectService {
  private graph: any;
  private project: any;

  constructor() {
    //instancia project
  }

  setGraph(graph: any) {
    this.graph = graph;
  }
  getGraph() {
    return this.graph;
  }
  open() {
    //open file
  }
  getStyleDefinition(language: string, callBack:any) {
    getLanguages(callBack);
  }
}
