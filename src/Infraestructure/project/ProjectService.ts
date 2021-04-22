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
    getStyleDefinition(language: String) {
        let str = '{' +
        '"elements": { '+
        '"RootFeature": {'+
        '"design": "shape=rectangle;",'+
        '"width": 100,'+
        '"height": 50'+
        '},'+
        '"Bundle": {'+
        '"design": "shape=ellipse;perimter=ellipsePerimeter",'+
        '"width": 100,'+
        '"height": 50'+
        '}'+
        '}'+
        '}';


        return JSON.parse(str);
    }
}
