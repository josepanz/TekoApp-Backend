import { BadRequestException } from '@nestjs/common';
import { ReportService } from './report.service';
import { ExcelGenerator } from '../infrastructure/excel-generator.hint';
import { PdfHtmlGenerator } from '../infrastructure/pdf-html-generator.hint';
import { PdfNativeGenerator } from '../infrastructure/pdf-native-generator.hint';
import { IReportPayload, IReportOptions } from '../domain/types/report.type';

describe('ReportService', () => {
  let service: ReportService;

  const mockPayload: IReportPayload = {
    metadata: { title: 'Test Report' },
    items: [],
  };

  let spyGenerateXlsx: jest.SpyInstance;
  let spyGenerateCsv: jest.SpyInstance;
  let spyPdfHtml: jest.SpyInstance;
  let spyPdfNative: jest.SpyInstance;

  beforeEach(() => {
    service = new ReportService();

    spyGenerateXlsx = jest
      .spyOn(ExcelGenerator, 'generateXlsx')
      .mockResolvedValue(Buffer.from('xlsx'));

    spyGenerateCsv = jest
      .spyOn(ExcelGenerator, 'generateCsv')
      .mockReturnValue(Buffer.from('csv'));

    spyPdfHtml = jest
      .spyOn(PdfHtmlGenerator, 'generate')
      .mockResolvedValue(Buffer.from('pdf-html'));

    spyPdfNative = jest
      .spyOn(PdfNativeGenerator, 'generate')
      .mockResolvedValue(Buffer.from('pdf-native'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate — formato xlsx', () => {
    it('debe llamar a ExcelGenerator.generateXlsx y retornar el buffer resultante', async () => {
      // Arrange
      const options: IReportOptions = { format: 'xlsx' };

      // Act
      const result = await service.generate(mockPayload, options);

      // Assert
      expect(spyGenerateXlsx).toHaveBeenCalledWith(mockPayload);
      expect(result).toEqual(Buffer.from('xlsx'));
    });
  });

  describe('generate — formato csv', () => {
    it('debe llamar a ExcelGenerator.generateCsv y retornar el buffer resultante', async () => {
      // Arrange
      const options: IReportOptions = { format: 'csv' };

      // Act
      const result = await service.generate(mockPayload, options);

      // Assert
      expect(spyGenerateCsv).toHaveBeenCalledWith(mockPayload);
      expect(result).toEqual(Buffer.from('csv'));
    });
  });

  describe('generate — formato pdf con motor html', () => {
    it('debe llamar a PdfHtmlGenerator.generate cuando el motor es html', async () => {
      // Arrange
      const options: IReportOptions = {
        format: 'pdf',
        pdfEngine: 'html',
        templateHtml: '<html><body>{{data}}</body></html>',
      };

      // Act
      const result = await service.generate(mockPayload, options);

      // Assert
      expect(spyPdfHtml).toHaveBeenCalledWith(
        mockPayload,
        options.templateHtml,
      );
      expect(result).toEqual(Buffer.from('pdf-html'));
    });

    it('debe lanzar BadRequestException cuando el motor es html pero no se provee templateHtml', async () => {
      // Arrange
      const options: IReportOptions = {
        format: 'pdf',
        pdfEngine: 'html',
      };

      // Act & Assert
      await expect(service.generate(mockPayload, options)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.generate(mockPayload, options)).rejects.toThrow(
        'El motor HTML requiere la propiedad "templateHtml".',
      );
    });

    it('debe usar el motor html por defecto cuando no se especifica pdfEngine', async () => {
      // Arrange
      const options: IReportOptions = {
        format: 'pdf',
        templateHtml: '<html><body>reporte</body></html>',
      };

      // Act
      const result = await service.generate(mockPayload, options);

      // Assert
      expect(spyPdfHtml).toHaveBeenCalledWith(
        mockPayload,
        options.templateHtml,
      );
      expect(result).toEqual(Buffer.from('pdf-html'));
    });

    it('debe pasar el payload y el templateHtml exactos al generador html', async () => {
      // Arrange
      const template = '<html><body><p>{{titulo}}</p></body></html>';
      const options: IReportOptions = {
        format: 'pdf',
        pdfEngine: 'html',
        templateHtml: template,
      };

      // Act
      await service.generate(mockPayload, options);

      // Assert
      expect(spyPdfHtml).toHaveBeenCalledTimes(1);
      expect(spyPdfHtml).toHaveBeenCalledWith(mockPayload, template);
    });
  });

  describe('generate — formato pdf con motor native', () => {
    it('debe llamar a PdfNativeGenerator.generate cuando el motor es native', async () => {
      // Arrange
      const nativeDefinition = {
        content: [],
      } as unknown as import('pdfmake/interfaces').TDocumentDefinitions;
      const options: IReportOptions = {
        format: 'pdf',
        pdfEngine: 'native',
        nativeDefinition,
      };

      // Act
      const result = await service.generate(mockPayload, options);

      // Assert
      expect(spyPdfNative).toHaveBeenCalledWith(nativeDefinition);
      expect(result).toEqual(Buffer.from('pdf-native'));
    });

    it('debe lanzar BadRequestException cuando el motor es native pero no se provee nativeDefinition', async () => {
      // Arrange
      const options: IReportOptions = {
        format: 'pdf',
        pdfEngine: 'native',
      };

      // Act & Assert
      await expect(service.generate(mockPayload, options)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.generate(mockPayload, options)).rejects.toThrow(
        'El motor Nativo requiere la propiedad "nativeDefinition".',
      );
    });
  });

  describe('generate — motor pdf desconocido', () => {
    it('debe lanzar BadRequestException cuando se especifica un motor pdf no reconocido', async () => {
      // Arrange
      const options = {
        format: 'pdf',
        pdfEngine: 'unknown-engine',
      } as unknown as IReportOptions;

      // Act & Assert
      await expect(service.generate(mockPayload, options)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.generate(mockPayload, options)).rejects.toThrow(
        'Motor PDF "unknown-engine" no reconocido.',
      );
    });
  });

  describe('generate — formato no soportado', () => {
    it('debe lanzar BadRequestException con el mensaje correcto cuando el formato no es válido', async () => {
      // Arrange
      const options = { format: 'ppt' } as unknown as IReportOptions;

      // Act & Assert
      await expect(service.generate(mockPayload, options)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.generate(mockPayload, options)).rejects.toThrow(
        'Formato no soportado: ppt',
      );
    });
  });
});
