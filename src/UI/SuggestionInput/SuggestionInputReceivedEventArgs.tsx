
export default class SuggestionInputReceivedEventArgs {
    target: any;
    data: any; 
    constructor(target: any, data: any) {
      this.target = target;
      this.data = data;
    }
}