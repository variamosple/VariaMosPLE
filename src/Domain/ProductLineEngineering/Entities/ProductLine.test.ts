import {ProductLine} from "./ProductLine";
import {DomainEngineering} from "./DomainEngineering";
import {ApplicationEngineering} from "./ApplicationEngineering";

test('The constructor should give the right values', () => {

  let domainEngineering = new DomainEngineering()
  let applicationEngineering = new ApplicationEngineering()
  let productline = new ProductLine('test_id','test_name', 'System', 'Retail', domainEngineering, applicationEngineering)

  expect(productline.id).toBe('test_id');
  expect(productline.name).toBe('test_name');
  expect(productline.domainEngineering).toBe(domainEngineering);
  expect(productline.applicationEngineering).toBe(applicationEngineering);

});

