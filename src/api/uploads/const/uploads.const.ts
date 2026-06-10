export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MERCHANT_DOC_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MERCHANT_DOC_FIELDS = [
  { name: 'documentFrontImage', maxCount: 1 },
  { name: 'documentBackImage', maxCount: 1 },
  { name: 'commercialInvoiceImage', maxCount: 1 },
  { name: 'businessLicenseImage', maxCount: 1 },
  { name: 'storefrontImage', maxCount: 1 },
];

export const IMAGE_PROCESSING = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 80,
  thumbnailWidth: 150,
  thumbnailHeight: 150,
  thumbnailQuality: 70,
} as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
