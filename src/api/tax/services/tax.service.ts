import { Injectable } from '@nestjs/common';
import { TaxDbService } from '@modules/tax-db/services/tax-db.service';
import { TaxConfigResponseDTO } from '../dtos/response';

// Fallback cuando nunca se cargó ninguna fila de `TaxConfig` — deshabilitado por default a
// propósito: las tasas de IVA reales por país deben venir de asesoría fiscal real, no de
// inferencia de este LLM (ver openspec/decisions.md, backlog post-Fase 0004 punto 5). Mismo
// criterio de "fallback seguro sin romper" que `TipsService.DEFAULT_CONFIG`.
const DEFAULT_CONFIG: TaxConfigResponseDTO = {
  isEnabled: false,
  name: 'Sin configurar',
  rate: 0,
};

@Injectable()
export class TaxService {
  constructor(private readonly taxDb: TaxDbService) {}

  /**
   * Config activa — Paraguay-only por ahora (mismo criterio ya documentado para
   * `LegalDocumentVersions`/`TipConfig`: sin país resuelto por Service/User todavía, siempre se
   * pide el default global `countryId: null`). Deliberadamente NO se consume todavía desde
   * `PaymentApiService.createPayment` — wirear una tasa real al cálculo del total cobrado es una
   * decisión de negocio/fiscal que excede el alcance de "modelar el flujo técnico".
   */
  async getConfig(): Promise<TaxConfigResponseDTO> {
    const config = await this.taxDb.findActiveConfig(null);
    if (!config) return DEFAULT_CONFIG;
    return {
      isEnabled: config.isEnabled,
      name: config.name,
      rate: Number(config.rate),
    };
  }

  /**
   * IVA real sobre un pago — se aplica sobre `platformFee` (la comisión que la plataforma cobra
   * por el servicio de intermediación), no sobre el monto bruto que recibe el profesional. Es el
   * criterio técnico elegido para modelar el flujo (ver openspec/decisions.md, Fase 0011) — con
   * `isEnabled: false` (default sin config cargada) siempre da 0, sin cambiar el monto total
   * cobrado hasta que exista una tasa real definida por asesoría fiscal.
   */
  async calculateTax(platformFee: number): Promise<number> {
    const config = await this.getConfig();
    if (!config.isEnabled) return 0;
    return Math.round(platformFee * config.rate * 100) / 100;
  }
}
