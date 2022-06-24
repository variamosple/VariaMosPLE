import { ApplicationEngineering } from "./ApplicationEngineering";
import {Model} from "./Model";
import {Application} from "./Application";

test('The constructor should give the right values', () => {

  let models: Model[] = []
  let languageAllowed: string[] = []
  let applications: Application[] = []
  let applicationEngineering = new ApplicationEngineering(models, languageAllowed, applications);

  expect(applicationEngineering.models).toBe(models);
  expect(applicationEngineering.languagesAllowed).toBe(languageAllowed);
  expect(applicationEngineering.applications).toBe(applications);

});

