import {Adaptation} from "./Adaptation";
import {Model} from "./Model";


test('The constructor should give the right values', () => {

  let models: Model[] = []
  let adaptation = new Adaptation('test_id','test_name',models);

  expect(adaptation.id).toBe('test_id');
  expect(adaptation.name).toBe('test_name');
  expect(adaptation.models).toBe(models);
});


