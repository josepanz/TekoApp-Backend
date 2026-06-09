import { Injectable } from '@nestjs/common';
import { PrismaDatasource } from '@core/database/services/prisma.service';
import {
  PaymentProvider,
  PaymentProviderConfig,
  PlatformCommissionConfig,
} from '@prisma/client';

type CacheEntry<T> = { data: T | null; expiresAt: number };

@Injectable()
export class FeeCalculatorService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaDatasource) {}

  async calculateProviderFee(
    amount: number,
    provider: PaymentProvider,
  ): Promise<number> {
    const config = await this.getProviderConfig(provider);
    if (!config) return 0;

    const feeRate = Number(config.feePercentage);
    const fixedFee = Number(config.feeFixed);
    return Math.round((amount * feeRate + fixedFee) * 100) / 100;
  }

  async calculatePlatformFee(amount: number): Promise<number> {
    const config = await this.getDefaultCommissionConfig();
    if (!config) return 0;

    const rate = Number(config.percentage);
    const fixed = Number(config.fixedAmount);
    let fee = Math.round((amount * rate + fixed) * 100) / 100;

    if (config.minimumFee !== null && fee < Number(config.minimumFee)) {
      fee = Number(config.minimumFee);
    }
    if (config.maximumFee !== null && fee > Number(config.maximumFee)) {
      fee = Number(config.maximumFee);
    }

    return fee;
  }

  private async getProviderConfig(
    provider: PaymentProvider,
  ): Promise<PaymentProviderConfig | null> {
    return this.fromCache(`provider:${provider}`, () =>
      this.prisma.extended.paymentProviderConfig.findFirst({
        where: { provider, isActive: true },
      }),
    );
  }

  private async getDefaultCommissionConfig(): Promise<PlatformCommissionConfig | null> {
    return this.fromCache('commission:default', () =>
      this.prisma.extended.platformCommissionConfig.findFirst({
        where: { isDefault: true, isActive: true },
      }),
    );
  }

  private async fromCache<T>(
    key: string,
    fetch: () => Promise<T | null>,
  ): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    const data = await fetch();
    this.cache.set(key, { data, expiresAt: Date.now() + this.CACHE_TTL_MS });
    return data;
  }
}
