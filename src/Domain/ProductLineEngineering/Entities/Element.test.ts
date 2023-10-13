import { Property } from "./Property";
import {Element} from "./Element";


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

  let properties: Property[] = [];
  let element_class = new Element("test_name","test_type", properties, "test_parent_id");

  expect(element_class.x).toBe(0);
  expect(element_class.y).toBe(0);
  expect(element_class.width).toBe(0);
  expect(element_class.height).toBe(0);
  expect(element_class.name).toBe("test_name");
  expect(element_class.type).toBe("test_type");
  expect(element_class.properties).toBe(properties);
  expect(element_class.parentId).toBe("test_parent_id");
  expect(element_class.id).toBe("c71143d6-2921-4111-9111-111111111111");
});

