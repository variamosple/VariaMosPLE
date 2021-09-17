import { Model } from "../Entities/Model";
import RestrictionService from "../../../DataProvider/Services/restrictionService";

export default class RestrictionsUseCases {
  private restrictionService: RestrictionService = new RestrictionService();

  getRestrictions(language: any): any {
    let restrictions: any = [];

    restrictions = Object.assign(
      restrictions,
      language.abstractSyntax.restrictions
    );

    return restrictions;
  }

  applyRestrictions(callback: any, model: Model, restrictions: any) {
    console.log();
    if (Object.entries(restrictions).length < 1) {
      let response = {
        data: {
          state: "ALLOWED",
        },
      };
      callback(response);
    } else {
      Object.entries(restrictions).forEach(async ([name, definition]) => {
        this.restrictionService.applyRestriction(
          callback,
          model,
          name,
          definition
        );
      });
    }
  }
}
