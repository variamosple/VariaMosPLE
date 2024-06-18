
import { domainRequirementsSuggest, getAllDomains } from "./autocompleteServiceV2";

class SuggestionInputHelper  { 
  
    constructor() { 
        this.domains=[];
        this.initialize();
    }

    initialize(){
        let me=this;
        getAllDomains().then((data) => { 
            me.domains=data;
        });
    }

    getOptions(request) {
      let me=this;
      let data = domainRequirementsSuggest(request, me.domains); 
      return data;
    }


}

export default SuggestionInputHelper;