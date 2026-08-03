import { StorageExecutionOptions } from '@modules/storage/interfaces/storage.interface';
import {
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';

import { t } from '@common/i18n/i18n.helper';
export class ProcessBatchManager {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    executionOptions?: StorageExecutionOptions,
  ): Promise<T> {
    const retryAttempts = this.resolveRetryAttempts(
      executionOptions?.retryAttempts,
    );
    const retryDelayMs = this.resolveRetryDelayMs(
      executionOptions?.retryDelayMs,
    );

    for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === retryAttempts || !this.shouldRetry(error)) {
          throw error;
        }

        await this.delay(retryDelayMs * (attempt + 1));
      }
    }

    throw new ServiceUnavailableException(t('common.STORAGE_UNAVAILABLE'));
  }

  private shouldRetry(error: unknown): boolean {
    const errorName =
      error &&
      typeof error === 'object' &&
      'name' in error &&
      typeof error.name === 'string'
        ? (error as { name: string }).name
        : '';
    const statusCode =
      error && typeof error === 'object' && '$metadata' in error
        ? Number(
            (error as { $metadata?: { httpStatusCode?: number } }).$metadata
              ?.httpStatusCode,
          )
        : undefined;

    return (
      errorName === 'SlowDown' ||
      errorName === 'Throttling' ||
      errorName === 'TooManyRequestsException' ||
      statusCode === 429 ||
      statusCode === 503
    );
  }

  async processInBatches<T, TResult>(
    items: T[],
    batchSize: number,
    handler: (item: T) => Promise<TResult>,
  ): Promise<TResult[]> {
    const results: TResult[] = [];

    for (let index = 0; index < items.length; index += batchSize) {
      const batch = items.slice(index, index + batchSize);
      const batchResults = await Promise.all(
        batch.map((item) => handler(item)),
      );
      results.push(...batchResults);
    }

    return results;
  }

  private resolveRetryAttempts(value?: number): number {
    const retryAttempts: number = value ?? 3;

    if (!Number.isInteger(retryAttempts) || retryAttempts < 0) {
      throw new BadRequestException(t('common.RETRY_ATTEMPTS_INVALID'));
    }

    return retryAttempts;
  }

  private resolveRetryDelayMs(value?: number): number {
    const retryDelayMs: number = value ?? 1000;

    if (!Number.isInteger(retryDelayMs) || retryDelayMs < 0) {
      throw new BadRequestException(t('common.RETRY_DELAY_INVALID'));
    }

    return retryDelayMs;
  }

  private async delay(milliseconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
