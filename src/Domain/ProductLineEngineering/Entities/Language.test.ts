import {Language} from "./Language";


test('The constructor should give the right values', () => {

  let language = new Language(345,'test_name','test_abstract_syntax','test_concrete_syntax','test_type','test_state_accept');

  expect(language.id).toBe(345);
  expect(language.name).toBe('test_name');
  expect(language.abstractSyntax).toBe('test_abstract_syntax');
  expect(language.concreteSyntax).toBe('test_concrete_syntax');
  expect(language.type).toBe('test_type');
  expect(language.stateAccept).toBe('test_state_accept');
});


