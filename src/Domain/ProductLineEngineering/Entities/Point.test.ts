import {Point} from "./Point";


test('The constructor should give the right values', () => {

  let point = new Point(354,667);
  expect(point.x).toBe(354);
  expect(point.y).toBe(667);
});


