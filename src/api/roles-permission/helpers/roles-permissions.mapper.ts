import { Injectable } from '@nestjs/common';
import {
  PermissionResponseDTO,
  RoleResponseDTO,
} from '@api/roles-permission/dtos/response';

interface IRolePermission {
  id: number;
  referenceId?: string;
  name: string;
  displayName: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  lastChangedAt: Date | null;
  lastChangedBy: string | null;
}

@Injectable()
export class RolesPermissionsMapper {
  roleToResponse(role: IRolePermission): RoleResponseDTO {
    return {
      id: role.id,
      // Los roles siempre tienen referenceId (columna `reference_id` NOT NULL en `Roles`) — a
      // diferencia de `IRolePermission`, que es una interfaz compartida con `Permissions` (sin
      // referenceId), por eso queda opcional ahí y se afirma acá.
      referenceId: role.referenceId,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      createdBy: role.createdBy,
      lastChangedAt: role.lastChangedAt,
      lastChangedBy: role.lastChangedBy,
    };
  }

  permissionToResponse(permission: IRolePermission): PermissionResponseDTO {
    return {
      id: permission.id,
      name: permission.name,
      displayName: permission.displayName,
      description: permission.description,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      createdBy: permission.createdBy,
      lastChangedAt: permission.lastChangedAt,
      lastChangedBy: permission.lastChangedBy,
    };
  }
}
