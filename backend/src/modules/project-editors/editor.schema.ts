import { z } from 'zod';
import { uuid } from '../../shared/validation/common.js';
export const editorInput = z.object({ userId: uuid }).strict();
export const editorParams = z.object({ projectId: uuid, userId: uuid });
