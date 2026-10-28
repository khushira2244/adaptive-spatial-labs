import type { ContextPackage } from './context-package.js';
import { AIError } from '../ai.error.js';
export function validateReferences(value: unknown, p: ContextPackage): void {
  if (Array.isArray(value)) {
    for (const child of value) validateReferences(child, p);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (
      key === 'references' &&
      Array.isArray(child) &&
      child.some((ref) => typeof ref !== 'string' || !p.references.includes(ref))
    )
      throw new AIError('AI_OUTPUT_INVALID');
    validateReferences(child, p);
  }
}
