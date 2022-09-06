import { DomainEngineering } from "./DomainEngineering";
import {Model} from "./Model";

test('The constructor should give the right values', () => {

  let models: Model[] = []
  let languageAllowed: string[] = []
  let domainEngineering = new DomainEngineering(models, languageAllowed);

  expect(domainEngineering.models).toBe(models);
  expect(domainEngineering.languagesAllowed).toBe(languageAllowed);

});

