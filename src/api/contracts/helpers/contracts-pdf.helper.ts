import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { ContractWithLegalTerms } from '@modules/contracts-db/services/contracts-db.service';
import { ContractContentSnapshotDTO } from '../dtos/response';
import { CONTRACT_LEGAL_DISCLAIMER_PLACEHOLDER } from '../const/contracts.const';

/**
 * Definición nativa de pdfmake (`ReportService.generate(..., { pdfEngine: 'native' })`) — sin
 * Chromium/Puppeteer, ver decisión en `openspec/decisions.md`, Fase 0004.
 */
export function buildContractPdfDefinition(
  contract: ContractWithLegalTerms,
): TDocumentDefinitions {
  const snapshot =
    contract.contentSnapshot as unknown as ContractContentSnapshotDTO;
  const clientName = `${contract.client.firstName} ${contract.client.lastName}`;
  const professionalName = `${contract.professional.user.firstName} ${contract.professional.user.lastName}`;

  return {
    content: [
      { text: 'Contrato de servicio', style: 'title' },
      { text: snapshot.service.title, style: 'subtitle' },
      { text: snapshot.service.description, margin: [0, 0, 0, 10] },
      {
        text: `Opción de presupuesto: ${snapshot.budgetOption.label}`,
        bold: true,
      },
      {
        text: `Precio total: ${snapshot.budgetOption.totalPrice.toFixed(2)}`,
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            ['Descripción', 'Cantidad', 'Precio unit.', 'Subtotal'],
            ...snapshot.lineItems.map((item) => [
              item.description,
              String(item.quantity),
              item.unitPrice.toFixed(2),
              item.subtotal.toFixed(2),
            ]),
          ],
        },
        margin: [0, 0, 0, 15],
      },
      { text: 'Firmas', style: 'subtitle' },
      {
        text: `Cliente: ${clientName} — ${contract.clientSignatureName ?? ''} — ${
          contract.clientSignedAt?.toISOString() ?? ''
        }`,
      },
      {
        text: `Profesional: ${professionalName} — ${contract.professionalSignatureName ?? ''} — ${
          contract.professionalSignedAt?.toISOString() ?? ''
        }`,
        margin: [0, 0, 0, 15],
      },
      { text: CONTRACT_LEGAL_DISCLAIMER_PLACEHOLDER, style: 'legal' },
    ],
    styles: {
      title: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subtitle: { fontSize: 13, bold: true, margin: [0, 5, 0, 5] },
      legal: { fontSize: 8, italics: true, color: '#666666' },
    },
    defaultStyle: { font: 'Roboto' },
  };
}
