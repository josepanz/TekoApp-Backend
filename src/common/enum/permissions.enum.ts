/**
 * Const que define todos los códigos de permisos utilizados en el sistema.
 * Usar un objeto const garantiza la seguridad de tipos y
 * proporciona autocompletado en el código, evitando errores por
 * escribir mal las cadenas de texto (magic strings).
 */

export const PERMISSIONS = {
  // Permiso de Administración
  ADMIN: {
    ALL: 'admin:all',
  },
  DASHBOARD: 'dashboard:read',
  USER: {
    CREATE: 'user:create',
    READ: 'user:read',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    CLIENTS: 'user.clients:read',
    PASSWORD: {
      CREATE: 'user.password:create',
      UPDATE: 'user.password:update',
    },
  },
  // Permisos de Rol (Role)
  ROLE: {
    CREATE: 'role:create',
    READ: 'role:read',
    UPDATE: 'role:update',
    DELETE: 'role:delete',
  },
  PERMISSION: {
    CREATE: 'permission:create',
    READ: 'permission:read',
    UPDATE: 'permission:update',
    DELETE: 'permission:delete',
  },
  ASSIGNMENT: {
    ROLE_PERMISSION: 'role.permission.assignment:create',
    USER_PERMISSION: 'user.permission.assignment:create',
    UNASSIGN_USER: 'user.permission.unassignment:delete',
    UNASSIGN_ROLE: 'role.permission.unassignment:delete',
  },
} as const;

// Tipo utilitario para usar en guards o decoradores
export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
