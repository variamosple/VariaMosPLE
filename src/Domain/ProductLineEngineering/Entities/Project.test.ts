import {Project} from "./Project";


test('The constructor should give the right values', () => {

  let project = new Project('test_id','test_name');
  expect(project.id).toBe('test_id');
  expect(project.name).toBe('test_name');
});


