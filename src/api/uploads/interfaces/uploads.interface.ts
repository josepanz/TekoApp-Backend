export interface IUploadMerchantDocsParams {
  files: Record<string, Express.Multer.File[]>;
  userId: number;
  referenceId: string;
  documentType?: number | null;
  documentNumber?: string;
}

export interface IUploadedDocUrls {
  documentFrontImage?: string;
  documentBackImage?: string;
  commercialInvoiceImage?: string;
  businessLicenseImage?: string;
  storefrontImage?: string;
}
