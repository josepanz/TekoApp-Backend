export interface RetryOptions {
  attempts: number;
  delayMs: number;
  shouldRetry?: (error: unknown) => boolean;
}
