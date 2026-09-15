import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/// Fila de `GET /admin/audit-logs`. `id` es `BigInt` en Prisma, se expone como `string`
/// (mismo criterio que cualquier otro id grande de este repo — ver #0008 en decisions.md).
export class AuditLogResponseDTO {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tableName!: string;

  @ApiProperty()
  recordId!: string;

  @ApiProperty()
  operationType!: string;

  @ApiPropertyOptional()
  oldData!: unknown;

  @ApiPropertyOptional()
  newData!: unknown;

  @ApiProperty()
  changedAt!: Date;

  @ApiProperty()
  changedBy!: string;

  @ApiPropertyOptional()
  reason!: string | null;
}
