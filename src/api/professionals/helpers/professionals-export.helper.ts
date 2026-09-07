import { IExcelColumn } from '@modules/report/domain/types/report.type';
import { ProfessionalWithRelations } from '@modules/professionals-db/types/professionals-db.type';

export const PROFESSIONALS_EXPORT_COLUMNS: IExcelColumn[] = [
  { header: 'ID', key: 'referenceId' },
  { header: 'Nombre', key: 'firstName' },
  { header: 'Apellido', key: 'lastName' },
  { header: 'Email', key: 'email' },
  { header: 'Categoría', key: 'category' },
  { header: 'Estado', key: 'status' },
  { header: 'Verificación', key: 'verificationStatus' },
  { header: 'Disponible', key: 'isAvailable' },
  { header: 'Calificación promedio', key: 'averageRating' },
  { header: 'Cantidad de calificaciones', key: 'totalRatings' },
  { header: 'Tarifa por hora', key: 'hourlyRate' },
  { header: 'Creado', key: 'createdAt' },
];

export function mapProfessionalsToExportRows(
  professionals: ProfessionalWithRelations[],
): Record<string, unknown>[] {
  return professionals.map((professional) => ({
    referenceId: professional.referenceId,
    firstName: professional.user.firstName,
    lastName: professional.user.lastName,
    email: professional.user.email,
    category: professional.category.name,
    status: professional.status,
    verificationStatus: professional.verificationStatus,
    isAvailable: professional.isAvailable,
    averageRating: professional.averageRating,
    totalRatings: professional.totalRatings,
    hourlyRate: professional.hourlyRate,
    createdAt: professional.createdAt.toISOString(),
  }));
}
