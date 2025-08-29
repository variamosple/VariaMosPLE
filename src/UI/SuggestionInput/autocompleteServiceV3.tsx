import axios, { Method } from "axios";
import secretGraph from './secretGraph.json';
import Graph from "./graph";

export default class AutocompleteService {
    graph: Graph;
    initialNodes: any[];

    constructor() {
        this.graph = this.loadGraph();
        this.initialNodes = this.graph.findInitialNodes();
    }


    async getAllDomainsList() {
        try {
            let domains = ["Retail"];
            return domains;
        }
        catch (e) {
            console.log(e)
        }
    }

    domainFunctionalRequirementsSuggest(req) {
        let me = this;
        var words = req.input.trim().split(" ");
        var sentence = req.input.trim();
        var secret: any = {};

        var options = me.processInput(req.input);
        let data = { "input": sentence, "options": options, "secret": secret };
        return data;
    }

    loadGraph() {
        let graph = new Graph();
        if (true) {
            let dic = [];
            for (let i = 0; i < secretGraph.nodes.length; i++) {
                const node = secretGraph.nodes[i];
                graph.addVertex(i);
                dic[node.id] = i;
            }
            for (let i = 0; i < secretGraph.edges.length; i++) {
                const edge = secretGraph.edges[i];
                let sourceId = dic[edge.sourceNodeId];
                let targetId = dic[edge.targetNodeId];
                graph.addEdge(sourceId, targetId);
            }
        } else {
            graph.addVertex('A');
            graph.addVertex('B');
            graph.addVertex('C');
            graph.addVertex('D');

            graph.addEdge('A', 'B');
            graph.addEdge('A', 'C');
            graph.addEdge('B', 'D');
            graph.addEdge('C', 'D');
        }
        return graph;
    }

    processInput(description) {
        let me = this;
        let ret = [];
        let indexes = [];
        if (description.trim() != "") {
            let parts = me.getSecretParts(me.graph, me.initialNodes, description);
            if (parts) {
                let keys = Object.keys(parts);
                let key = keys[keys.length - 1];
                let lastPart = parts["" + key];
                const lastIndex = lastPart.id;
                indexes = me.graph.findNextNodes(lastIndex);
            }
        } else {
            if (me.initialNodes) {
                indexes = me.initialNodes;
            }
        }
        me.generateNodes(ret, indexes)
        return ret;
    }

    generateNodes(nodes, indexes) {
        let me=this;
        if (indexes) {
        for (let i = 0; i < indexes.length; i++) {
            const index = indexes[i];
            let node = secretGraph.nodes[index];
            if(node.name!="//"){
                nodes.push(node.name);
            }else{
               let childIndexes = me.graph.findNextNodes(index);
               me.generateNodes(nodes, childIndexes);
            }
        }
        }
    }

    getSecretParts(graph, initialNodes, description) {
        if (description.includes("choose")) {
            let jjj = 0;
        }
        let words = this.normalizeWords(description);
        let coincidentPaths = [];
        for (let i = 0; i < initialNodes.length; i++) {
            const initialNode = initialNodes[i];
            let token = this.getTokenFromNode(initialNode);
            if (token == words[0]) {
                const paths = graph.findAllPaths(initialNode);
                for (let p = 0; p < paths.length; p++) {
                    console.log(p);
                    if (p == 66) {
                        let x = 0;
                    }
                    const path = paths[p];
                    let candidateParts = this.getCandidateParts(path, words);
                    if (candidateParts != null) {
                        coincidentPaths.push(candidateParts);
                    }
                }
            }
        }
        if (coincidentPaths.length > 0) {
            let p = 0;
            let maxL = 0;
            for (let c = 0; c < coincidentPaths.length; c++) {
                const coincidentPath = coincidentPaths[c];
                let l = this.countElements(coincidentPath);
                if (maxL < l) {
                    maxL = l;
                    p = c;
                }
            }
            return coincidentPaths[p];
        }
        return null;
    }

    getTokenFromNode(id) {
        let word = secretGraph.nodes[id].name;
        return word;
    }

    getTagFromNode(id) {
        let tag = secretGraph.nodes[id].tag;
        return tag;
    }

    normalizeWords(text) {
        let str = text.toLowerCase();
        // if (!str.endsWith(".")) {
        //     str += ".";
        // }
        str = str.replace(/\./g, ' . ');
        str = str.replace(/\(/g, ' ( ');
        str = str.replace(/\)/g, ' ) ');
        str = str.replace(/\r/g, '');
        str = str.replace(/\n/g, '');
        str = str.trim();
        while (str.includes('  ')) {
            str = this.replaceDoubleSpacesWithSingle(str);
        }

        let tokens = str.split(' ');
        return tokens;
    }

    replaceDoubleSpacesWithSingle(inputString) {
        return inputString.replace(/ {2}/g, ' ');
    }

    countElements(obj) {
        let count = 0;
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                count++;
            }
        }
        return count;
    }

    getCandidateParts(path, words) {
        this.showPath(path);
        let tokenCount = 0;
        for (let t = 0; t < path.length; t++) {
            let index = path[t];
            let token = this.getTokenFromNode(index);
            if (token != "//") {
                tokenCount++;
            }
        }
        let tokenCoincidences = [];
        let parts = null;
        let candidateParts = [];
        let w = 0;
        let wildCard = -1;
        let t = 0;
        for (let w = 0; w < words.length; w++) {
            const word = words[w];
            let index = null;
            let token = null;
            let tag = null;
            while (true) {
                index = path[t];
                tag = this.getTagFromNode(index);
                token = this.getTokenFromNode(index);
                if (token != "//") {
                    break;
                } else {
                    if (!tokenCoincidences.includes(index)) {
                        tokenCoincidences.push(index);
                    }
                }
                if (t < path.length - 1) {
                    t++;
                } else {
                    if (t == wildCard) {
                        return null;
                    }
                }
            }

            if (token == word) {
                let item = {
                    word: word,
                    key: token,
                    tag: tag + '_' + token,
                    id: index
                }
                candidateParts['_' + index] = item;
                wildCard = -1;
                if (!tokenCoincidences.includes(index)) {
                    tokenCoincidences.push(index);
                }
                t++;
            } else {
                if (token.startsWith('[')) {
                    if (!candidateParts['_' + index]) {
                        let item = {
                            word: word,
                            key: token,
                            tag: tag + '_' + token,
                            id: index
                        }
                        candidateParts['_' + index] = item;
                    } else {
                        candidateParts['_' + index].word = candidateParts['_' + index].word + ' ' + word;
                    }
                    wildCard = t;
                    if (!tokenCoincidences.includes(index)) {
                        tokenCoincidences.push(index);
                    }
                    t++;
                }
                else {
                    if (wildCard > -1) {
                        t = wildCard;
                        wildCard = -1;
                        w--;
                    } else {
                        // t++;
                        return null;
                    }
                }
            }
            if (w == words.length - 1) {
                return candidateParts;
            }
        }
        return null;
    }

    showPath(path) {
        let words = [];
        for (let j = 0; j < path.length; j++) {
            const id = path[j];
            let name = secretGraph.nodes[id].name;
            if (name != "//") {
                words.push(name);
            }
        }
        console.log(words.join(' '));
    }
} 