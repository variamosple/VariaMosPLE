import {ExternalFuntion} from "./ExternalFuntion";

test('The constructor should give the right values', () => {

  let externalFuntion = new ExternalFuntion(345, 'test_name','test_label','test_url',{},{}, 'test_resulting_action', 667);

  expect(externalFuntion.id).toBe(345);
  expect(externalFuntion.name).toBe('test_name');
  expect(externalFuntion.label).toBe('test_label');
  expect(externalFuntion.url).toBe('test_url');
  expect(externalFuntion.header).toEqual({});
  expect(externalFuntion.request).toEqual({});
  expect(externalFuntion.resulting_action).toBe('test_resulting_action');
  expect(externalFuntion.language_id).toBe(667);
});


