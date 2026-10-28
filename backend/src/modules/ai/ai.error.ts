import { AppError } from '../../shared/errors/app-error.js';
export type AIErrorCode =
  | 'AI_UNAVAILABLE'
  | 'AI_PROVIDER_ERROR'
  | 'AI_TIMEOUT'
  | 'AI_CANCELLED'
  | 'AI_OUTPUT_INVALID'
  | 'AI_CONTEXT_TOO_LARGE';
export class AIError extends AppError {
  constructor(code: AIErrorCode) {
    super(
      code,
      {
        AI_UNAVAILABLE: 'AI is unavailable; manual workflows remain available.',
        AI_PROVIDER_ERROR: 'AI provider failed. Retry later or continue manually.',
        AI_TIMEOUT: 'AI request timed out; no domain changes were made.',
        AI_CANCELLED: 'AI request was cancelled; no domain changes were made.',
        AI_OUTPUT_INVALID: 'AI response failed schema or semantic validation.',
        AI_CONTEXT_TOO_LARGE:
          'Selected AI context exceeds the bounded request size. Select a smaller area.',
      }[code],
    );
  }
}
