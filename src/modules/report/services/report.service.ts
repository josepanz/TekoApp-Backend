import { Injectable, BadRequestException } from '@nestjs/common';
import { IReportService } from '../domain/interfaces/report.interface';
import { IReportOptions, IReportPayload } from '../domain/types/report.type';
import { ExcelGenerator } from '../infrastructure/excel-generator.hint';
import { PdfHtmlGenerator } from '../infrastructure/pdf-html-generator.hint';
import { PdfNativeGenerator } from '../infrastructure/pdf-native-generator.hint';

import { t } from '@common/i18n/i18n.helper';
@Injectable()
export class ReportService implements IReportService {
  public async generate(
    payload: IReportPayload,
    options: IReportOptions,
  ): Promise<Buffer> {
    switch (options.format) {
      case 'xlsx':
        return await ExcelGenerator.generateXlsx(payload);

      case 'csv':
        return ExcelGenerator.generateCsv(payload);

      case 'pdf':
        return this.handlePdfGeneration(payload, options);

      default:
        throw new BadRequestException(
          t('report.UNSUPPORTED_FORMAT', { format: options.format }),
        );
    }
  }

  private async handlePdfGeneration(
    payload: IReportPayload,
    options: IReportOptions,
  ): Promise<Buffer> {
    const engine = options.pdfEngine || 'html';

    if (engine === 'html') {
      if (!options.templateHtml) {
        throw new BadRequestException(
          t('report.HTML_ENGINE_REQUIRES_TEMPLATE'),
        );
      }
      return await PdfHtmlGenerator.generate(payload, options.templateHtml);
    }

    if (engine === 'native') {
      if (!options.nativeDefinition) {
        throw new BadRequestException(
          t('report.NATIVE_ENGINE_REQUIRES_DEFINITION'),
        );
      }
      return await PdfNativeGenerator.generate(options.nativeDefinition);
    }

    throw new BadRequestException(
      t('report.PDF_ENGINE_NOT_RECOGNIZED', { engine: engine }),
    );
  }
}
