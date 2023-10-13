//@ts-nocheck
import '@testing-library/jest-dom/extend-expect';
import MxgraphUtils from "./MxgraphUtils";
import {Model} from "../../Domain/ProductLineEngineering/Entities/Model";
import {Element} from "../../Domain/ProductLineEngineering/Entities/Element";
import {Relationship} from "../../Domain/ProductLineEngineering/Entities/Relationship";
import mx from "../../UI/MxGEditor/mxgraph";
import React from "react";

beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.123456789);
    jest.useFakeTimers('modern');
    jest.setSystemTime(1655108206699);
});

afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
    jest.useRealTimers();
})


describe('Testing deleteSelection', function () {
    test('Testing deleteSelection',()=>{

        // ARRANGE
        let mxgraphUtils = new MxgraphUtils();
        let graphContainerRef = React.createRef()
        let element: Element[]=[]
        let relationShip: Relationship[] = []
        let model = new Model('Model Id','Model Name','Type',element,relationShip, "Type Engineering")
        let graph = new mx.mxGraph(graphContainerRef.current);
        let doc = mx.mxUtils.createXmlDocument();
        let type = "Type"
        let node = doc.createElement(type);
        node.setAttribute("type", type);
        let cell = new mx.mxCell(node,new mx.mxGeometry(0, 0, 40, 50));


        // ACT
        // console.log(graph.getSelectionCells()) --> []
        graph.addSelectionCell(cell)
        // console.log(graph.isEnabled()) --> true
        console.log(graph.getSelectionCells())
        MxgraphUtils.deleteSelection(graph, model)
        console.log(graph.getSelectionCells())

        //ASSERT

    })
})

describe('Testing findVerticeById', function () {
    test('Testing findVerticeById',()=>{

    })
})

describe('Testing findEdgeById', function () {
    test('Testing findEdgeById',()=>{

    })
})
