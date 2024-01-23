import { Property } from "./Property";


beforeEach(() => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0.123456789);
  jest.useFakeTimers();
  jest.setSystemTime(1655108206699);
});

afterEach(() => {
  jest.spyOn(global.Math, 'random').mockRestore();
  jest.useRealTimers();
})

test('The constructor should give the right values', () => {

  let property= new Property('test_name','test_value','test_type','test_option','test_linked_property','test_linked_value',false,false,'test_comment','test_possible_value', null, null , null, null);

  expect(property.id).toBe('c71143d6-2921-4111-9111-111111111111');
  expect(property.name).toBe('test_name');
  expect(property.value).toBe('test_value');
  expect(property.type).toBe('test_type');
  expect(property.options).toBe('test_option');
  expect(property.linked_property).toBe('test_linked_property');
  expect(property.linked_value).toBe('test_linked_value');
  expect(property.custom).toBe(false);
  expect(property.display).toBe(false);
  expect(property.comment).toBe('test_comment');
  expect(property.possibleValues).toBe('test_possible_value');

});

