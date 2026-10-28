import { AppError } from '../../shared/errors/app-error.js';
import type { Classification } from './outcome.input.js';
import type { ReviewSource } from './outcome.source.js';
import type { OutcomeRepository } from './outcome.repository.js';
export const invalid = (message: string) => new AppError('VALIDATION_ERROR', message);
export function validateEvidence(source: ReviewSource, keys: string[]) {
  if (
    keys.length > 32 ||
    new Set(keys).size !== keys.length ||
    keys.some((k) => !source.evidenceKeys.includes(k))
  )
    throw invalid('Evidence must be an exact frozen reference.');
}
export function transition(from: Classification, to: Classification) {
  const valid =
    from === to ||
    (from === 'RAISED' && ['DISCUSSED', 'NOT_DISCUSSED'].includes(to)) ||
    (from === 'DISCUSSED' &&
      ['ADDRESSED', 'UNRESOLVED', 'DEFERRED', 'DECISION', 'ACTION', 'NOT_DISCUSSED'].includes(
        to,
      )) ||
    (!['RAISED', 'DISCUSSED'].includes(from) && to === 'DISCUSSED');
  if (!valid)
    throw new AppError(
      'INVALID_LIFECYCLE',
      'Explicit discussion assessment required before final classification.',
    );
}
export function validateFinal(
  source: ReviewSource,
  c: Awaited<ReturnType<OutcomeRepository['contents']>>,
) {
  const retained = c.items.filter((i) => i.retained),
    map = new Map(retained.map((i) => [i.id, i]));
  for (const i of c.items) {
    validateEvidence(source, i.evidenceKeys);
    if (!i.sourceKey.startsWith('manual:') && !source.entries.some((e) => e.key === i.sourceKey))
      throw invalid('Source anchor is outside the frozen capture.');
  }
  for (const l of c.links) {
    if (!map.has(l.itemId)) throw invalid('Outcome links must use retained assessments.');
    if (l.decisionId && !c.decisions.some((d) => d.id === l.decisionId))
      throw invalid('Decision link missing.');
    if (l.actionId && !c.actions.some((a) => a.id === l.actionId))
      throw invalid('Action link missing.');
  }
  for (const i of retained) {
    if (i.classification === 'DECISION' && !c.links.some((l) => l.itemId === i.id && l.decisionId))
      throw invalid('Decision candidate definition required.');
    if (i.classification === 'ACTION' && !c.links.some((l) => l.itemId === i.id && l.actionId))
      throw invalid('Action candidate definition required.');
  }
  for (const d of c.decisions) {
    validateEvidence(source, d.evidenceKeys);
    if (!d.statement.trim() || !c.links.some((l) => l.decisionId === d.id && map.has(l.itemId)))
      throw invalid('Decision needs reviewed source assessments.');
  }
  for (const a of c.actions) {
    validateEvidence(source, a.evidenceKeys);
    if (
      !a.assigneeParticipantId ||
      !a.assignee ||
      !source.participants.some(
        (p) =>
          p.id === a.assigneeParticipantId &&
          JSON.stringify(p.actor) === JSON.stringify(a.assignee),
      )
    )
      throw invalid('Accepted action requires one captured responsible actor.');
    if (a.decisionId && !c.decisions.some((d) => d.id === a.decisionId))
      throw invalid('Primary Decision must belong to this review.');
    if (!c.links.some((l) => l.actionId === a.id && map.has(l.itemId)))
      throw invalid('Action needs reviewed source assessments.');
  }
}
