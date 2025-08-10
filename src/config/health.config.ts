import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthCheckService, HealthCheck, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private http: HttpModule,
  ) {}

  @HealthCheck()
  check(): Promise<HealthIndicatorResult> {
    return this.health.check([
      // Verificar base de datos PostgreSQL
      () => this.health.pingCheck('postgres', 'postgresql'),
      
      // Verificar base de datos MongoDB
      () => this.health.pingCheck('mongodb', 'mongodb'),
      
      // Verificar Redis
      () => this.health.pingCheck('redis', 'redis'),
      
      // Verificar memoria del sistema
      () => this.health.memoryHealthCheck('memory'),
      
      // Verificar disco
      () => this.health.diskHealthCheck('disk', {
        thresholdPercent: 0.9,
        path: '/',
      }),
    ]);
  }
}

export const HealthConfig = {
  imports: [TerminusModule, HttpModule],
  providers: [HealthService],
  exports: [HealthService],
};
