
import AutocompleteService from "./autocompleteServiceV3";

export default class SuggestionInputHelper  {
    domains: string[]; 
    autocompleteService: AutocompleteService;
  
    constructor() { 
        this.domains=[];
        this.initialize();
    }

    async initialize(){
        let me=this;
        me.autocompleteService=new AutocompleteService();
        me.domains= await me.autocompleteService.getAllDomainsList() ;
    }

    getOptions(request) {
      let me=this;
      let data = me.autocompleteService.domainFunctionalRequirementsSuggest(request); 
      return data;
    }


} 