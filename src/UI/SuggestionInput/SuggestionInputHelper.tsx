
import  {domainRequirementsSuggest, getAllDomainsList, domainFunctionalRequirementsSuggest}    from "./autocompleteServiceV2";

export default class SuggestionInputHelper  {
    domains: string[]; 
  
    constructor() { 
        this.domains=[];
        this.initialize();
    }

    async initialize(){
        let me=this;
        me.domains= await getAllDomainsList() ;
    }

    getOptions(request) {
      let me=this;
      let data = domainFunctionalRequirementsSuggest(request); 
      return data;
    }


} 