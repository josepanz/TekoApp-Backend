import { PaginatedRequest } from '@common/dtos/request-with-pagination.dto';

/** `page` / `pageSize` (máximo 100, por defecto 10). */
export class GetProfessionalStatusHistoryQueryDTO extends PaginatedRequest<GetProfessionalStatusHistoryQueryDTO> {}
