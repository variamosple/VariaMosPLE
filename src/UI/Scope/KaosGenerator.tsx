// src/Infraestructure/Mxgraph/KaosGenerator.ts

import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";
import { Element } from "../../Domain/ProductLineEngineering/Entities/Element";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
import { v4 as uuidv4 } from "uuid";

export default class KaosGenerator {
  /**
   * Transforma un Context Diagram en un modelo KAOS
   */
  static generateFromContext(
    contextModel: Model,
    projectService: ProjectService
  ): Model {
    // 1) Creamos el KAOS Model usando el constructor
    const kaosModel = new Model(
      uuidv4(),
      `${contextModel.name} - KAOS`,
      "KAOS",
      [], // elements
      [], // relationships
      undefined,
      ""
    );

    // Parámetros de layout
    const NODE_WIDTH = 140;
    const NODE_HEIGHT = 60;
    const ROOT_X = 200;
    const ROOT_Y = 100;
    const COLUMN_SPACING = 250;
    const ROW_SPACING = 100;

    // 2) Extraemos la única ProductLine
    const pl = contextModel.elements.find(e => e.type === "ProductLine")!;
    const purpose = pl.properties.find(p => p.name === "Purpose")?.value || "";
    const qgString = pl.properties.find(p => p.name === "QualityGoals")?.value || "";

    // 3) Hard Goal raíz
    const root: Element = {
      id: uuidv4(),
      name: `G_${pl.name.replace(/\s+/g, "")}`,
      type: "Goal",
      x: ROOT_X,
      y: ROOT_Y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      parentId: null,
      properties: [
        new Property(
          "Description", purpose, "String",
          undefined, undefined, undefined,
          false, true, "Hard goal",
          "", {}, 0, 0, "", ""
        )
      ],
      sourceModelElements: [],
      instanceOfId: null
    };
    kaosModel.elements.push(root);

    // 4) SoftGoals hijos del root a partir de QualityGoals
    qgString
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(s => s)
      .forEach((text, i) => {
        const sg: Element = {
          id: uuidv4(),
          name: `SG_${text.replace(/\s+/g, "")}`,
          type: "SoftGoal",
          x: ROOT_X + COLUMN_SPACING,
          y: ROOT_Y + i * ROW_SPACING,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          parentId: null,
          properties: [
            new Property(
              "Description", text, "String",
              undefined, undefined, undefined,
              false, true, "Soft goal",
              "", {}, 0, 0, "", ""
            )
          ],
          sourceModelElements: [],
          instanceOfId: null
        };
        kaosModel.elements.push(sg);

        // Claim_SoftGoal root→sg
        kaosModel.relationships.push({
          id: uuidv4(),
          name: `${root.id}_${sg.id}`,
          type: "Claim_SoftGoal",
          sourceId: root.id,
          targetId: sg.id,
          points: [],
          min: 0,
          max: 999999,
          properties: []
        });
      });

    // 5) Para cada Association Entity→PL: SubGoal + SoftGoals + Operationalization + Bundle
    contextModel.relationships
      .filter(rel => rel.type === "Association" && rel.targetId === pl.id)
      .forEach((assoc, idx) => {
        const ent = contextModel.elements.find(e => e.id === assoc.sourceId)!;
        const need = assoc.properties.find(p => p.name === "Entity_need")?.value || "";
        const solution = assoc.properties.find(p => p.name === "SPL_solution")?.value || "";

        // 5.1) SubGoal para la necesidad de la entidad
        const sub: Element = {
          id: uuidv4(),
          name: `G_Need_${ent.name.replace(/\s+/g, "")}`,
          type: "Goal",
          x: ROOT_X,
          y: ROOT_Y + ROW_SPACING * (1 + idx),
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          parentId: null,
          properties: [
            new Property(
              "Description", need, "String",
              undefined, undefined, undefined,
              false, true, "Hard goal",
              "", {}, 0, 0, "", ""
            )
          ],
          sourceModelElements: [],
          instanceOfId: null
        };
        kaosModel.elements.push(sub);

        // Relación SubGoal root→sub
        kaosModel.relationships.push({
          id: uuidv4(),
          name: `${root.id}_${sub.id}`,
          type: "SubGoal",
          sourceId: root.id,
          targetId: sub.id,
          points: [],
          min: 1,
          max: 1,
          properties: []
        });

        // 5.2) SoftGoals a partir de Conditions_of_use de la entidad
        const conds = ent.properties.find(p => p.name === "Conditions_of_use")?.value || "";
        conds
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(s => s)
          .forEach((text, j) => {
            const sg: Element = {
              id: uuidv4(),
              name: `SG_${text.replace(/\s+/g, "")}`,
              type: "SoftGoal",
              x: ROOT_X + COLUMN_SPACING,
              y: sub.y + j * (NODE_HEIGHT + 20),
              width: NODE_WIDTH,
              height: NODE_HEIGHT,
              parentId: null,
              properties: [
                new Property(
                  "Description", text, "String",
                  undefined, undefined, undefined,
                  false, true, "Soft goal",
                  "", {}, 0, 0, "", ""
                )
              ],
              sourceModelElements: [],
              instanceOfId: null
            };
            kaosModel.elements.push(sg);

            // Claim_SoftGoal sub→sg
            kaosModel.relationships.push({
              id: uuidv4(),
              name: `${sub.id}_${sg.id}`,
              type: "Claim_SoftGoal",
              sourceId: sub.id,
              targetId: sg.id,
              points: [],
              min: 0,
              max: 999999,
              properties: []
            });
          });

        // 5.3) Operationalization para la SPL_solution
        const op: Element = {
          id: uuidv4(),
          name: solution,
          type: "Operationalization",
          x: ROOT_X + COLUMN_SPACING * 2,
          y: sub.y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          parentId: null,
          properties: [
            new Property(
              "Description", `Implements ${sub.name}`, "String",
              undefined, undefined, undefined,
              false, true, "Operationalization",
              "", {}, 0, 0, "", ""
            )
          ],
          sourceModelElements: [],
          instanceOfId: null
        };
        kaosModel.elements.push(op);

        // 5.4) Bundle sub→op con cardinalidad 1..1
        kaosModel.relationships.push({
          id: uuidv4(),
          name: `${sub.id}_${op.id}`,
          type: "Bundle",
          sourceId: sub.id,
          targetId: op.id,
          points: [],
          min: 1,
          max: 1,
          properties: []
        });
      });

    return kaosModel;
  }
}
