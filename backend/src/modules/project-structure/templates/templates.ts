import type { projectTypes } from '../../../shared/database/schema.js';
type Key = (typeof projectTypes)[number];
const names: Record<Key, readonly string[]> = {
  PRODUCT_SYSTEM: [
    'Product',
    'Feature',
    'Requirement',
    'Domain',
    'Service',
    'API',
    'Data',
    'Frontend',
  ],
  BACKEND_PLATFORM: ['Domain', 'Service', 'API', 'Data', 'Infrastructure'],
  API_CENTERED: ['Domain', 'API', 'Service', 'Data', 'External Integration'],
  EVENT_DRIVEN: ['Domain', 'Service', 'Event', 'Data', 'Infrastructure'],
  FRONTEND_BACKEND: ['Product', 'Frontend', 'API', 'Service', 'Data'],
  CUSTOM: [],
};
export const templates = Object.entries(names).map(([templateKey, layers]) => ({
  templateKey: templateKey as Key,
  layers: layers.map((name, sortOrder) => ({
    name,
    description: null,
    sortOrder,
    source: 'TEMPLATE' as const,
  })),
}));
export function templateLayers(key: Key) {
  return templates.find((t) => t.templateKey === key)!.layers;
}
