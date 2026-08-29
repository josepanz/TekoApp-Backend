import { ServiceProgressEntries } from '@prisma/client';
import { ServiceProgressEntryResponseDTO } from '../dtos/response';

export function mapEntryToResponse(
  entry: ServiceProgressEntries,
  editWindowMinutes: number,
): ServiceProgressEntryResponseDTO {
  const windowExpiresAt = new Date(
    entry.createdAt.getTime() + editWindowMinutes * 60_000,
  );
  return {
    referenceId: entry.referenceId,
    note: entry.note,
    images: entry.images,
    entryOrder: entry.entryOrder,
    createdAt: entry.createdAt,
    editWindowExpired: new Date() > windowExpiresAt,
  };
}

export function mapEntriesToResponse(
  entries: ServiceProgressEntries[],
  editWindowMinutes: number,
): ServiceProgressEntryResponseDTO[] {
  return entries.map((entry) => mapEntryToResponse(entry, editWindowMinutes));
}
