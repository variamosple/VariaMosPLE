import { Model } from "./Model";

export type Prioridad = "Low" | "Medium" | "High";

export interface Capability {
  name: string;
  isMandatory: boolean;
  importance: number; // Escala (por ejemplo, 1 a 5)
}

export class ScopeSPL {
  // Datos ya existentes
  models: Model[] = [];
  languagesAllowed: string[] = [];
  
  // Información estratégica básica
  lineName: string = "";                // Nombre de la línea de productos
  definition: string = "";              // Breve descripción/definición
  purpose: string = "";                 // Propósito o misión
  strategicObjectives: string = "";   // Objetivos estratégicos (lista o array de frases)

  // Datos de mercado y clientes
  marketSegment: string = "";           // Segmento de mercado (p.ej., PYMES, enterprise, etc.)
  marketSize: string = "";              // Tamaño del mercado (puede ser numérico o descriptivo)
  marketTrends: string = "";            // Tendencias actuales en el mercado
  customerNeeds: string = "";           // Principales necesidades de los clientes
  customerExpectations: string = "";    // Expectativas que tienen los clientes
  impactPotential: Prioridad = "Medium";   // Impacto potencial (Bajo/Medio/Alto)

  // Lista de prestaciones o capacidades clave (en lugar de "materiales" o "componentes")
  capabilities: Capability[] = [];

  // Métricas de evaluación para cada producto potencial (usadas para orientar la toma de decisiones)
  marketImpact: number = 0;             // Por ejemplo, un score de 0 a 100 que estime el ROI o impacto comercial
  technicalComplexity: Prioridad = "Medium";  // Escala numérica (p.ej., 1 a 5, donde 5 es muy complejo)
  risk: Prioridad = "Medium";            // Riesgo estimado (Bajo/Medio/Alto) en cuanto a estabilidad o cambios futuros
  strategicPriority: Prioridad = "Medium"; // Alineación con los objetivos estratégicos (Bajo/Medio/Alto)

  // Comentarios adicionales (por parte de marketing, análisis de procesos, etc.)
  marketingComments: string = "";
  processComments: string = "";

  constructor(
    models: Model[] = [],
    languagesAllowed: string[] = []
  ) {
    this.models = models;
    this.languagesAllowed = languagesAllowed;
  }
}

