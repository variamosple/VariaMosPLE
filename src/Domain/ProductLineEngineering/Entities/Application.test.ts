import {Application} from "./Application";
import {Adaptation} from "./Adaptation";
import {Model} from "./Model";


test('The constructor should give the right values', () => {

  let models: Model[] = []
  let adaptations: Adaptation[] = []
  let application = new Application('test_id','test_name',models,adaptations);

  expect(application.id).toBe('test_id');
  expect(application.name).toBe('test_name');
  expect(application.models).toBe(models);
  expect(application.adaptations).toBe(adaptations);
});


