import React from "react";
import { validationGroupOrder, validationStatusOrder } from "./ModelValidationService";
import type { ValidationGroup, ValidationSection } from "./ModelValidationService";

export type AttemptValidation = {
  projectId: string;
  modelName?: string;
  sections: Partial<Record<ValidationGroup, ValidationSection>>;
};

const statusLabels = {
  incumple: "Incumple",
  no_evaluable: "No evaluable",
  cumple: "Cumple",
  no_aplica: "No aplica"
};

function ValidationCard({ attempt, validation }: { attempt: number; validation: AttemptValidation }) {
  const sections = validationGroupOrder.flatMap(group => validation.sections[group] ? [validation.sections[group]] : []);
  const rules = sections.flatMap(section => section.rules).sort((left, right) =>
    validationStatusOrder.indexOf(left.status) - validationStatusOrder.indexOf(right.status) ||
    left.ruleId.localeCompare(right.ruleId)
  );
  const findingsByRule = new Map<string, ValidationSection["findings"]>();
  for (const section of sections) {
    for (const finding of section.findings) {
      const owner = rules.find(rule => finding.ruleIds.includes(rule.ruleId));
      if (!owner) continue;
      const findings = findingsByRule.get(owner.ruleId) ?? [];
      findings.push(finding);
      findingsByRule.set(owner.ruleId, findings);
    }
  }

  const failed = rules.filter(rule => rule.status === "incumple").length;
  const unevaluable = rules.filter(rule => rule.status === "no_evaluable").length;
  const unavailable = sections.filter(section => section.unavailable);
  const pending = sections.length < validationGroupOrder.length;
  const title = validation.modelName ? `Validación de ${validation.modelName}` : "Validación del modelo";

  return (
    <details className="validation-card" aria-label={`Validación del intento ${attempt}`}>
      <summary>
        <span className="validation-card-title">{title}</span>
        <span className="validation-card-summary" aria-live="polite">
          {pending && <span>Evaluando…</span>}
          {!pending && unavailable.length === sections.length && <span>Informe no disponible</span>}
          {!pending && unavailable.length > 0 && unavailable.length < sections.length && <span>Informe parcial</span>}
          {failed > 0 && <span className="validation-status incumple">
            {failed} {failed === 1 ? "regla incumplida" : "reglas incumplidas"}
          </span>}
          {unevaluable > 0 && <span className="validation-status no_evaluable">
            {unevaluable} {unevaluable === 1 ? "regla no evaluable" : "reglas no evaluables"}
          </span>}
          {!pending && failed === 0 && unevaluable === 0 && <span>Sin incumplimientos detectados</span>}
        </span>
        <span className="validation-card-toggle">Ver reglas</span>
      </summary>

      <div className="validation-card-body">
        {rules.length > 0 && <p className="validation-scope">Alcance del informe · Proyecto</p>}
        {rules.length > 0 && <ul className="validation-rule-list" aria-label="Resultados de las reglas">
          {rules.map(rule => (
            <li key={rule.ruleId} className="validation-rule">
              <div className="validation-rule-heading">
                <code>{rule.ruleId}</code>
                <span>{rule.label}</span>
                <span className={`validation-status ${rule.status}`}>{statusLabels[rule.status]}</span>
              </div>
              {findingsByRule.has(rule.ruleId) && (
                <ul className="validation-findings">
                  {findingsByRule.get(rule.ruleId).map((finding, index) => (
                    <li key={index}>
                      {finding.ruleIds.length > 1 && <code>{finding.ruleIds.join(", ")} · </code>}
                      {finding.status !== rule.status && <span>{statusLabels[finding.status]} · </span>}
                      {finding.description}
                      {finding.context && <small>{finding.context}</small>}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>}
        {unavailable.length > 0 && <ul className="validation-notes" aria-label="Informes no disponibles">
          {unavailable.map(section => <li key={section.group}>{section.title} · {section.notes[0]}</li>)}
        </ul>}
        {sections.some(section => !section.unavailable && section.notes.length > 0) && (
          <details className="validation-context">
            <summary>Contexto de la validación</summary>
            {sections.filter(section => !section.unavailable && section.notes.length > 0).map(section => (
              <div className="validation-context-group" key={section.group}>
                <strong>{section.title}</strong>
                <ul className="validation-notes">
                  {section.notes.map((note, index) => <li key={index}>{note}</li>)}
                </ul>
              </div>
            ))}
          </details>
        )}
      </div>
    </details>
  );
}

export default React.memo(ValidationCard);
