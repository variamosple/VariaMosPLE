import { 
  calculateModelDiff, 
  hasMeaningfulChanges,
  applyModelDiffIncremental 
} from './incrementalSyncService';
import { Model } from '../../Domain/ProductLineEngineering/Entities/Model';
import { Element } from '../../Domain/ProductLineEngineering/Entities/Element';
import { Relationship } from '../../Domain/ProductLineEngineering/Entities/Relationship';
import { Property } from '../../Domain/ProductLineEngineering/Entities/Property';

describe('IncrementalSyncService', () => {
  let baseModel: Model;
  let baseElement: Element;
  let baseRelationship: Relationship;

  beforeEach(() => {
    // Crear elemento base
    baseElement = new Element(
      'Test Element',
      'TestType',
      [],
      ''
    );
    baseElement.id = 'element1';
    baseElement.x = 100;
    baseElement.y = 100;
    baseElement.width = 80;
    baseElement.height = 40;
    baseElement.properties = [
      new Property('prop1', 'value1', 'String', null, null, null, false, true, '', '', {}, 1, 1, '', '')
    ];

    // Crear relación base
    baseRelationship = new Relationship(
      'rel1',
      'Test Relationship',
      'TestRelType',
      'element1',
      'element2',
      [],
      0,
      1,
      []
    );

    // Crear modelo base
    baseModel = new Model(
      'model1',
      'Test Model',
      'TestModelType',
      'lang1',
      'Test Description',
      'Test Author',
      'Test Source'
    );
    baseModel.elements = [baseElement];
    baseModel.relationships = [baseRelationship];
  });

  describe('calculateModelDiff', () => {
    it('should detect added elements', () => {
      const newElement = new Element(
        'New Element',
        'TestType',
        [],
        ''
      );
      newElement.id = 'element2';
      newElement.x = 200;
      newElement.y = 200;
      newElement.width = 80;
      newElement.height = 40;

      const newModelData = {
        elements: [baseElement, newElement],
        relationships: [baseRelationship]
      };

      const diff = calculateModelDiff(baseModel, newModelData);

      expect(diff.elementsAdded).toHaveLength(1);
      expect(diff.elementsAdded[0].id).toBe('element2');
      expect(diff.elementsUpdated).toHaveLength(0);
      expect(diff.elementsRemoved).toHaveLength(0);
    });

    it('should detect removed elements', () => {
      const newModelData = {
        elements: [],
        relationships: [baseRelationship]
      };

      const diff = calculateModelDiff(baseModel, newModelData);

      expect(diff.elementsAdded).toHaveLength(0);
      expect(diff.elementsUpdated).toHaveLength(0);
      expect(diff.elementsRemoved).toHaveLength(1);
      expect(diff.elementsRemoved[0]).toBe('element1');
    });

    it('should detect updated elements', () => {
      const updatedElement = { ...baseElement };
      updatedElement.name = 'Updated Element';
      updatedElement.x = 150;

      const newModelData = {
        elements: [updatedElement],
        relationships: [baseRelationship]
      };

      const diff = calculateModelDiff(baseModel, newModelData);

      expect(diff.elementsAdded).toHaveLength(0);
      expect(diff.elementsUpdated).toHaveLength(1);
      expect(diff.elementsUpdated[0].name).toBe('Updated Element');
      expect(diff.elementsRemoved).toHaveLength(0);
    });

    it('should detect added relationships', () => {
      const newRelationship = new Relationship(
        'rel2',
        'New Relationship',
        'TestRelType',
        'element1',
        'element3',
        [],
        0,
        1,
        []
      );

      const newModelData = {
        elements: [baseElement],
        relationships: [baseRelationship, newRelationship]
      };

      const diff = calculateModelDiff(baseModel, newModelData);

      expect(diff.relationshipsAdded).toHaveLength(1);
      expect(diff.relationshipsAdded[0].id).toBe('rel2');
      expect(diff.relationshipsUpdated).toHaveLength(0);
      expect(diff.relationshipsRemoved).toHaveLength(0);
    });

    it('should detect removed relationships', () => {
      const newModelData = {
        elements: [baseElement],
        relationships: []
      };

      const diff = calculateModelDiff(baseModel, newModelData);

      expect(diff.relationshipsAdded).toHaveLength(0);
      expect(diff.relationshipsUpdated).toHaveLength(0);
      expect(diff.relationshipsRemoved).toHaveLength(1);
      expect(diff.relationshipsRemoved[0]).toBe('rel1');
    });

    it('should detect updated relationships', () => {
      const updatedRelationship = { ...baseRelationship };
      updatedRelationship.name = 'Updated Relationship';

      const newModelData = {
        elements: [baseElement],
        relationships: [updatedRelationship]
      };

      const diff = calculateModelDiff(baseModel, newModelData);

      expect(diff.relationshipsAdded).toHaveLength(0);
      expect(diff.relationshipsUpdated).toHaveLength(1);
      expect(diff.relationshipsUpdated[0].name).toBe('Updated Relationship');
      expect(diff.relationshipsRemoved).toHaveLength(0);
    });
  });

  describe('hasMeaningfulChanges', () => {
    it('should return true when there are changes', () => {
      const diff = calculateModelDiff(baseModel, {
        elements: [],
        relationships: []
      });

      expect(hasMeaningfulChanges(diff)).toBe(true);
    });

    it('should return false when there are no changes', () => {
      const diff = calculateModelDiff(baseModel, {
        elements: [baseElement],
        relationships: [baseRelationship]
      });

      expect(hasMeaningfulChanges(diff)).toBe(false);
    });
  });

  describe('applyModelDiffIncremental', () => {
    it('should apply added elements correctly', () => {
      const newElement = new Element(
        'New Element',
        'TestType',
        [],
        ''
      );
      newElement.id = 'element2';
      newElement.x = 200;
      newElement.y = 200;
      newElement.width = 80;
      newElement.height = 40;

      const diff = {
        elementsAdded: [newElement],
        elementsUpdated: [],
        elementsRemoved: [],
        relationshipsAdded: [],
        relationshipsUpdated: [],
        relationshipsRemoved: []
      };

      const updatedModel = applyModelDiffIncremental(baseModel, diff);

      expect(updatedModel.elements).toHaveLength(2);
      expect(updatedModel.elements.find(e => e.id === 'element2')).toBeDefined();
    });

    it('should apply removed elements correctly', () => {
      const diff = {
        elementsAdded: [],
        elementsUpdated: [],
        elementsRemoved: ['element1'],
        relationshipsAdded: [],
        relationshipsUpdated: [],
        relationshipsRemoved: []
      };

      const updatedModel = applyModelDiffIncremental(baseModel, diff);

      expect(updatedModel.elements).toHaveLength(0);
    });

    it('should apply updated elements correctly', () => {
      const updatedElement = { ...baseElement };
      updatedElement.name = 'Updated Element';

      const diff = {
        elementsAdded: [],
        elementsUpdated: [updatedElement],
        elementsRemoved: [],
        relationshipsAdded: [],
        relationshipsUpdated: [],
        relationshipsRemoved: []
      };

      const updatedModel = applyModelDiffIncremental(baseModel, diff);

      expect(updatedModel.elements).toHaveLength(1);
      expect(updatedModel.elements[0].name).toBe('Updated Element');
    });
  });

  describe('Property changes detection', () => {
    it('should detect property value changes', () => {
      const updatedElement = { ...baseElement };
      updatedElement.properties = [
        new Property('prop1', 'updated_value', 'String', null, null, null, false, true, '', '', {}, 1, 1, '', '')
      ];

      const newModelData = {
        elements: [updatedElement],
        relationships: [baseRelationship]
      };

      const diff = calculateModelDiff(baseModel, newModelData);

      expect(diff.elementsUpdated).toHaveLength(1);
      expect(diff.elementsUpdated[0].properties[0].value).toBe('updated_value');
    });

    it('should detect added properties', () => {
      const updatedElement = { ...baseElement };
      updatedElement.properties = [
        ...baseElement.properties,
        new Property('prop2', 'value2', 'String', null, null, null, false, true, '', '', {}, 1, 1, '', '')
      ];

      const newModelData = {
        elements: [updatedElement],
        relationships: [baseRelationship]
      };

      const diff = calculateModelDiff(baseModel, newModelData);

      expect(diff.elementsUpdated).toHaveLength(1);
      expect(diff.elementsUpdated[0].properties).toHaveLength(2);
    });
  });
});
