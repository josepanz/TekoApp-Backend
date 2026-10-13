import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceStatus } from '@prisma/client';
import { PERMISSIONS } from '@common/enum/permissions.enum';
import { t } from '@common/i18n/i18n.helper';
import { IUserDataOnJwt } from '@modules/auth/interfaces/user-data-on-jwt.interface';
import {
  StorageAccessDbService,
  StorageKeyOwner,
} from '@modules/storage-access-db/services/storage-access-db.service';

type Viewer = Pick<IUserDataOnJwt, 'id'> & { permissions?: string[] };

/**
 * Autoriza el acceso a un archivo de S3 por su key. El dueño se resuelve desde la DB (el registro
 * que referencia la key), nunca desde la key: una key que ningún registro referencia es 404.
 *
 * Lectura: admin siempre; documento -> dueño, revisores, o cualquiera si está aprobado y es visible al
 * cliente; portafolio -> dueño, revisores, o cualquiera si está aprobado y visible; avatar -> cualquier
 * autenticado; contrato y bitácora -> las partes del servicio (+ auditores); foto de servicio -> las
 * partes y, mientras está PENDING, los profesionales aprobados.
 * Borrado: solo el dueño del registro (o admin).
 */
@Injectable()
export class UploadsAccessService {
  constructor(private readonly storageAccessDb: StorageAccessDbService) {}

  async assertCanRead(key: string, viewer: Viewer): Promise<void> {
    const owner = await this.resolve(key);
    if (this.has(viewer, PERMISSIONS.ADMIN.ALL)) return;
    if (await this.canRead(owner, viewer)) return;
    throw new ForbiddenException(t('uploads.FILE_FORBIDDEN'));
  }

  async assertCanDelete(key: string, viewer: Viewer): Promise<void> {
    const owner = await this.resolve(key);
    if (this.has(viewer, PERMISSIONS.ADMIN.ALL)) return;
    if (this.isOwner(owner, viewer.id)) return;
    throw new ForbiddenException(t('uploads.FILE_FORBIDDEN'));
  }

  private async resolve(key: string): Promise<StorageKeyOwner> {
    const owner = await this.storageAccessDb.findOwnerByKey(key);
    if (!owner) throw new NotFoundException(t('uploads.FILE_NOT_FOUND'));
    return owner;
  }

  private has(viewer: Viewer, permission: string): boolean {
    return viewer.permissions?.includes(permission) ?? false;
  }

  private isOwner(owner: StorageKeyOwner, userId: number): boolean {
    switch (owner.kind) {
      case 'professional-document':
      case 'portfolio-item':
      case 'avatar':
        return owner.ownerUserId === userId;
      case 'service-progress':
        return owner.authorUserId === userId;
      case 'service-image':
        return owner.clientUserId === userId;
      case 'contract':
        return false;
    }
  }

  private async canRead(
    owner: StorageKeyOwner,
    viewer: Viewer,
  ): Promise<boolean> {
    switch (owner.kind) {
      case 'avatar':
        return true;
      case 'professional-document':
        return (
          owner.isPublic ||
          owner.ownerUserId === viewer.id ||
          this.has(viewer, PERMISSIONS.PROFESSIONAL_DOCUMENTS.REVIEW)
        );
      case 'portfolio-item':
        return (
          owner.isPublic ||
          owner.ownerUserId === viewer.id ||
          this.has(viewer, PERMISSIONS.PROFESSIONAL_PORTFOLIO.REVIEW)
        );
      case 'contract':
        return (
          owner.clientUserId === viewer.id ||
          owner.professionalUserId === viewer.id
        );
      case 'service-progress':
        return (
          owner.clientUserId === viewer.id ||
          owner.professionalUserId === viewer.id ||
          this.has(viewer, PERMISSIONS.SERVICE_PROGRESS.AUDIT_VIEW)
        );
      case 'service-image':
        if (
          owner.clientUserId === viewer.id ||
          owner.professionalUserId === viewer.id
        ) {
          return true;
        }
        return (
          owner.status === ServiceStatus.PENDING &&
          (await this.storageAccessDb.isOperatingProfessional(viewer.id))
        );
    }
  }
}
