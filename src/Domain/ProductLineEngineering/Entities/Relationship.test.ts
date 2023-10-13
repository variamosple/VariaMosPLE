import {Relationship} from './Relationship'
import {Point} from "./Point";
import {Property} from "./Property";

test('The constructor should give the right values', () => {

  let points: Point[] = []
  let properties: Property[] = [];
  let relationship = new Relationship('test_id', 'test_name','test_type','test_source_id','test_target_id',points,345,667,properties)

  expect(relationship.id).toBe('test_id');
  expect(relationship.type).toBe('test_type');
  expect(relationship.name).toBe('test_name');
  expect(relationship.sourceId).toBe('test_source_id');
  expect(relationship.targetId).toBe('test_target_id');
  expect(relationship.points).toBe(points);
  expect(relationship.min).toBe(345);
  expect(relationship.max).toBe(667);
  expect(relationship.properties).toBe(properties);

});
