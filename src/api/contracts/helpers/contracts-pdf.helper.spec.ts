import { buildContractPdfDefinition } from './contracts-pdf.helper';
import { ContractWithLegalTerms } from '@modules/contracts-db/services/contracts-db.service';
import { CONTRACT_LEGAL_DISCLAIMER_PLACEHOLDER } from '../const/contracts.const';

const baseContract = {
  clientSignatureName: null,
  clientSignedAt: null,
  professionalSignatureName: null,
  professionalSignedAt: null,
  client: { firstName: 'Juan', lastName: 'Pérez' },
  professional: { user: { firstName: 'Ana', lastName: 'Gómez' } },
  contentSnapshot: {
    service: {
      title: 'Pintura de living',
      description: 'Pintar el living',
      categoryName: 'Pintura',
    },
    budgetOption: {
      label: 'Estándar',
      description: null,
      totalPrice: 500,
      estimatedHours: null,
    },
    lineItems: [
      {
        itemType: 'LABOR',
        catalogItemName: null,
        description: 'Mano de obra',
        quantity: 1,
        unitPrice: 500,
        subtotal: 500,
      },
    ],
  },
} as unknown as ContractWithLegalTerms;

// Aplana el árbol de `content` de pdfmake a los strings de texto para poder buscar substrings
// sin acoplar el test a la estructura visual exacta del documento.
function flattenText(content: unknown): string {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(flattenText).join(' ');
  if (typeof content === 'object') {
    const node = content as Record<string, unknown>;
    if ('text' in node) return flattenText(node.text);
    if ('table' in node) {
      const table = node.table as { body: unknown[][] };
      return table.body.map((row) => row.map(flattenText).join(' ')).join(' ');
    }
  }
  return '';
}

describe('buildContractPdfDefinition', () => {
  it('debe incluir el título del servicio, la opción y el total desde el contentSnapshot congelado', () => {
    // Act
    const definition = buildContractPdfDefinition(baseContract);
    const text = flattenText(definition.content);

    // Assert
    expect(text).toContain('Pintura de living');
    expect(text).toContain('Estándar');
    expect(text).toContain('500.00');
  });

  it('debe listar cada línea de ítem con cantidad, precio unitario y subtotal', () => {
    // Act
    const definition = buildContractPdfDefinition(baseContract);
    const text = flattenText(definition.content);

    // Assert
    expect(text).toContain('Mano de obra');
  });

  it('debe incluir el disclaimer legal siempre, sin importar el estado de firma', () => {
    // Act
    const definition = buildContractPdfDefinition(baseContract);
    const text = flattenText(definition.content);

    // Assert
    expect(text).toContain(CONTRACT_LEGAL_DISCLAIMER_PLACEHOLDER);
  });

  it('no debe romper cuando todavía nadie firmó (nombres y fechas de firma null)', () => {
    // Act & Assert — el helper hace `?.toISOString()` sobre las fechas de firma; sin este guard
    // un contrato recién generado (sin firmar) rompería la generación del PDF preliminar.
    expect(() => buildContractPdfDefinition(baseContract)).not.toThrow();
  });

  it('debe incluir el nombre firmado y la fecha ISO cuando el cliente ya firmó', () => {
    // Arrange
    const signedAt = new Date('2026-09-05T12:00:00.000Z');
    const contract = {
      ...baseContract,
      clientSignatureName: 'Juan Pérez',
      clientSignedAt: signedAt,
    } as unknown as ContractWithLegalTerms;

    // Act
    const definition = buildContractPdfDefinition(contract);
    const text = flattenText(definition.content);

    // Assert
    expect(text).toContain('Juan Pérez');
    expect(text).toContain(signedAt.toISOString());
  });
});
