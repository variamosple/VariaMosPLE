import {Model} from "./Model";
import {Element} from "./Element";
import {Relationship} from "./Relationship";


test('The constructor should give the right values', () => {

  let elements: Element[] = []
  let relationships: Relationship[] = []

  let model = new Model('test_id','test_name','test_type',elements, relationships, 'test_type_engineering');

  expect(model.id).toBe('test_id');
  expect(model.name).toBe('test_name');
  expect(model.elements).toBe(elements);
  expect(model.relationships).toBe(relationships);
  expect(model.type).toBe('test_type');
  expect(model.typeEngineering).toBe('test_type_engineering');
});


