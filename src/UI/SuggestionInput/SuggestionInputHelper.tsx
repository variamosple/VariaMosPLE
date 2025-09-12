
import AutocompleteService from "./autocompleteServiceV3";

export default class SuggestionInputHelper  {
    domains: string[]; 
    autocompleteService: AutocompleteService;
    secretGraph: any;
  
    constructor(secretGraph) { 
        this.secretGraph=secretGraph;
        this.domains=[];
        this.initialize();
    }

    async initialize(){
        let me=this;
        me.autocompleteService=new AutocompleteService(this.secretGraph);
        me.domains= await me.autocompleteService.getAllDomainsList() ;
    }

    getOptions(request) {
      let me=this;
      let data = me.autocompleteService.domainFunctionalRequirementsSuggest(request); 
      return data;
    }


} 