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
    if (restrictions.unique_name) {
      let result = this.uniqueName(model, restrictions.unique_name);
      if (result.state == "DENIED") {
        callback({ data: result });
        return;
      }
    }
    if (restrictions.quantity_element) {
      let result = this.quantityElement(model, restrictions.quantity_element);
      if (result.state == "DENIED") {
        callback({ data: result });
        return;
      }
    }
    if (restrictions.quantity_target) {
      let result = this.quantityTarget(model, restrictions.quantity_target);
      if (result.state == "DENIED") {
        callback({ data: result });
        return;
      }
    }
    let result = {
      data: {
        state: "ALLOWED",
        message:""
      },
    };
    callback(result);
  }

  uniqueName(model: Model, restriction: any) {
    let configRestriction: any = {
      definition: restriction
    };

    //ALLOWED and DENIED
    let restrictionResponse = {
      state: "DENIED",
      message: "Restriction applied by unique name",
    };

    let elemntsFound = 0;
    for (let i = 0; i < model.elements.length; i++) {
      const element: any = model.elements[i];

      for (let a = 0; a < configRestriction.definition.elements.length; a++) {
        const elementsGroup = configRestriction.definition.elements[a];
        if (elementsGroup.includes(element.type)) {
          for (let x = 0; x < model.elements.length; x++) {
            const elementFind: any = model.elements[x];
            if (
              element.id !== elementFind.id &&
              element.name === elementFind.name &&
              elementsGroup.includes(elementFind.type)
            ) {
              elemntsFound++;
              break;
            }
          }
        }
      }
      if (elemntsFound > 0) break;
    }

    if (elemntsFound === 0) {
      restrictionResponse.state = "ALLOWED";
      restrictionResponse.message = "";
    }
    return restrictionResponse;
  }

  quantityElement(model: Model, restriction: any) {
    let configRestriction: any = {
      definition: restriction
    };

    //ALLOWED and DENIED
    let restrictionResponse = {
      state: "DENIED",
      message: "Restriction applied by quantity element",
    };

    let message = restrictionResponse.message;

    let elemntsFound = 0;

    for (let i = 0; i < configRestriction.definition.length; i++) {
      const object = configRestriction.definition[i];
      const quantityElement = model.elements.filter(
        (element) => element.type === object.element
      );

      if (quantityElement.length > object.max) {
        restrictionResponse.state = "DENIED";
        elemntsFound++;
        message =
          message +
          " - max quantity for " +
          object.element +
          " element is " +
          object.max;
        //DENIED
      } else if (quantityElement.length < object.min) {
        message =
          message +
          " - min quantity for " +
          object.element +
          " element is " +
          object.min;
        //ALLOWED

        if (elemntsFound === 0) restrictionResponse.state = "ALLOWED";
      }
    }

    if (elemntsFound === 0) {
      restrictionResponse.state = "ALLOWED";
      message !== restrictionResponse.message
        ? (restrictionResponse.message = message)
        : (restrictionResponse.message = "");
    }
    return restrictionResponse;
  }

  quantityTarget(model: Model, restriction: any) {
    let configRestriction: any = {
      definition: restriction
    };

    //ALLOWED and DENIED
    let restrictionResponse = {
      state: "DENIED",
      message: "Restriction applied by quantity element",
    };

    let message = restrictionResponse.message;

    let elemntsFound = 0;

    configRestriction.definition.forEach((object: any) => {
      const quantityElement = model.elements.filter(
        (element) => element.type === object.element
      );

      if (quantityElement.length > object.max) {
        restrictionResponse.state = "DENIED";
        elemntsFound++;
        message =
          message +
          " - max quantity for " +
          object.element +
          " element is " +
          object.max;
        //DENIED
      } else if (quantityElement.length < object.min) {
        message =
          message +
          " - min quantity for " +
          object.element +
          " element is " +
          object.min;
        //ALLOWED

        if (elemntsFound === 0) restrictionResponse.state = "ALLOWED";
      }
    });

    if (elemntsFound === 0) {
      restrictionResponse.state = "ALLOWED";
      message !== restrictionResponse.message
        ? (restrictionResponse.message = message)
        : (restrictionResponse.message = "");
    }

    return restrictionResponse;
  }
}  
